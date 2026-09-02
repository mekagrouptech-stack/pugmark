const { sequelize } = require('../config/database')
const logger = require('../utils/logger')

/**
 * eSSL AIFace Orcus / ZKTeco ADMS ("Push SDK") controller.
 *
 * The terminal is the CLIENT here — it dials out to us over plain HTTP and
 * pushes punches. We never poll it. The whole protocol is plain text; there is
 * no JSON and no authentication beyond the device serial number (SN).
 *
 * ── The mandatory `OK` reply ────────────────────────────────────────────────
 * After ANY upload the device expects a 200 with a text body starting `OK`.
 * If it does not get one it assumes the batch was lost and re-sends the SAME
 * records on the next cycle, forever. That is why every handler below replies
 * `OK` even for tables we do not care about, and why the punch insert is
 * idempotent (INSERT IGNORE against the uq_punch unique key) — a re-send after
 * a network blip must not double-count attendance.
 */

// Device status/verify codes → the raw ints we persist. Kept here for reference;
// the frontend owns the human labels.
const DEFAULT_STATUS = 0 // check-in
const DEFAULT_VERIFY = 15 // face (the Orcus is a face terminal)

// Source IP of the request, for verifying that pushes really come from the
// terminal and not from someone probing the open port. Shared with the
// allowlist middleware so both report the address identically.
const { clientIp } = require('../middleware/iclockIpFilter')
const biometricSync = require('../services/biometricAttendanceSync')

/**
 * GET /iclock/cdata?SN=<serial>&options=all
 *
 * Handshake. The terminal calls this on boot and after every reconnect to
 * learn how it should behave. The response is a bare key=value list — no JSON,
 * no headers beyond text/plain. Getting the shape wrong makes the device sulk
 * and never upload.
 *
 * Stamp/OpStamp   - watermarks for incremental sync; 9999 = "send us everything"
 * TransFlag       - which record types to push (attlog, oplog, …)
 * TimeZone=330    - minutes east of UTC (330 = IST +05:30)
 * Realtime=1      - push each punch as it happens rather than only in batches
 */
exports.handshake = async (req, res) => {
  const sn = req.query.SN || 'unknown'
  logger.info(`[iclock] handshake from device SN=${sn} ip=${clientIp(req)}`)

  const body = [
    `GET OPTION FROM: ${sn}`,
    'Stamp=9999',
    'OpStamp=9999',
    'ErrorDelay=30',
    'Delay=30',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=1111000000',
    'TimeZone=330',
    'Realtime=1',
    'Encrypt=0',
  ].join('\n')

  res.set('Content-Type', 'text/plain').status(200).send(body)
}

/**
 * Parse one ATTLOG line.
 *
 * Format is tab-separated, trailing fields vary by firmware:
 *   PIN \t YYYY-MM-DD HH:MM:SS \t status \t verify \t workcode \t reserved…
 *
 * Some firmwares pad with spaces instead of tabs, so we split on any run of
 * whitespace that is not inside the timestamp. Splitting on /\t+/ first and
 * falling back to whitespace covers both.
 */
function parseAttlogLine(line) {
  const raw = line.trim()
  if (!raw) return null

  let parts = raw.split('\t').map((p) => p.trim()).filter((p) => p !== '')
  // Fallback for space-padded firmwares: re-glue the "date time" pair.
  if (parts.length < 2) {
    const ws = raw.split(/\s+/)
    if (ws.length < 3) return null
    parts = [ws[0], `${ws[1]} ${ws[2]}`, ...ws.slice(3)]
  }

  const [pin, punchTime, status, verify] = parts
  if (!pin || !punchTime) return null

  // Timestamp must look like YYYY-MM-DD HH:MM:SS, else it is not a punch row.
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(punchTime)) return null

  const statusInt = Number.parseInt(status, 10)
  const verifyInt = Number.parseInt(verify, 10)

  return {
    devicePin: String(pin).slice(0, 32),
    // Stored verbatim as device local wall-clock time. We deliberately do NOT
    // convert: the device is configured to IST and HR reads these as local
    // times. Converting here would silently shift every punch by 5h30m.
    punchTime: punchTime.replace('T', ' '),
    status: Number.isNaN(statusInt) ? DEFAULT_STATUS : statusInt,
    verifyMode: Number.isNaN(verifyInt) ? DEFAULT_VERIFY : verifyInt,
  }
}

/**
 * POST /iclock/cdata?SN=<serial>&table=ATTLOG
 *
 * Punch upload. Body is tab-separated plain text (see parseAttlogLine), which
 * is why this router mounts express.text() instead of express.json().
 *
 * Non-ATTLOG tables (OPERLOG, ATTPHOTO, USERINFO, …) are acknowledged without
 * being stored — we only care about punches, but the device still needs its OK.
 */
exports.receiveData = async (req, res) => {
  const sn = req.query.SN || 'unknown'
  const table = String(req.query.table || '').toUpperCase()
  const ip = clientIp(req)

  // Reply OK no matter what happens below — see the "mandatory OK" note above.
  const ok = (count) =>
    res.set('Content-Type', 'text/plain').status(200).send(typeof count === 'number' ? `OK: ${count}` : 'OK')

  try {
    if (table !== 'ATTLOG') {
      logger.info(`[iclock] SN=${sn} ip=${ip} table=${table || '(none)'} acknowledged (not stored)`)
      return ok()
    }

    const body = typeof req.body === 'string' ? req.body : ''
    const records = body
      .split(/\r?\n/)
      .map(parseAttlogLine)
      .filter(Boolean)

    if (records.length === 0) {
      logger.warn(`[iclock] SN=${sn} ip=${ip} ATTLOG upload contained no parsable rows`)
      return ok(0)
    }

    // Bulk INSERT IGNORE: duplicates from a device re-send collide with the
    // uq_punch unique key and are silently dropped rather than erroring.
    const placeholders = records.map(() => '(?, ?, ?, ?, ?, NOW())').join(', ')
    const replacements = records.flatMap((r) => [sn, r.devicePin, r.punchTime, r.status, r.verifyMode])

    await sequelize.query(
      `INSERT IGNORE INTO attendance_logs
         (device_serial, device_pin, punch_time, status, verify_mode, created_at)
       VALUES ${placeholders}`,
      { replacements }
    )

    logger.info(`[iclock] SN=${sn} ip=${ip} stored ${records.length} punch record(s)`)

    // Roll the new punches into attendance_records (first punch of the day =
    // check-in, last = check-out) so the attendance tables track the device
    // live. Fired after the OK is queued and deliberately not awaited: the
    // device must not wait on our bookkeeping, and a failure here is recoverable
    // by the nightly sync.
    biometricSync.materializeDays(
      records.map((r) => r.punchTime),
      `iclock SN=${sn}`
    )

    return ok(records.length)
  } catch (error) {
    // Still 200/OK: if we 500 here the device will retry the same batch
    // indefinitely and we would never drain its buffer. The error is logged
    // for us instead.
    logger.error(`[iclock] SN=${sn} ip=${ip} failed to store ATTLOG: ${error.message}`)
    return ok()
  }
}

/**
 * GET /iclock/getrequest?SN=<serial>
 *
 * The device polls this asking "any commands for me?" (remote door open, user
 * sync, reboot…). We have none, so a bare OK tells it to carry on.
 */
exports.getRequest = async (req, res) => {
  res.set('Content-Type', 'text/plain').status(200).send('OK')
}

/**
 * POST /iclock/devicecmd
 *
 * The device reporting the result of a command we issued via getrequest.
 * Nothing to do, but it still needs the acknowledgement.
 */
exports.deviceCmd = async (req, res) => {
  res.set('Content-Type', 'text/plain').status(200).send('OK')
}

/**
 * GET/POST /iclock/ping?SN=<serial>
 *
 * Liveness probe. Some firmwares hit this to confirm the server is alive before
 * they start (or resume) pushing punches. A bare text `OK` is all it wants.
 */
exports.ping = async (req, res) => {
  res.set('Content-Type', 'text/plain').status(200).send('OK')
}
