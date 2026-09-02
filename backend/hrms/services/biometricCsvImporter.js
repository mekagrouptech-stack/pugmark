/**
 * Biometric CSV importer.
 *
 * The eSSL Bio Server "FTP/WebDav Punch Logs Upload" feature uploads a daily CSV
 * of punches (e.g. dd_MM_yyyy.csv) to a folder on this server via FTP. This
 * importer scans that folder, parses each CSV, and upserts the punches into the
 * same `attendance_logs` table used everywhere else — so they show on
 * /attendance/biometric and resolve to employees by code or device PIN.
 *
 * Config (env):
 *   EBIO_CSV_DIR          absolute path to the FTP upload folder
 *                         (default: <backend>/storage/biometric)
 *   EBIO_CSV_POLL_MINUTES minutes between automatic imports (0 = off)
 *
 * Processed files are renamed to "<name>.imported" so they are not re-read.
 * Inserts are idempotent (INSERT IGNORE on uq_punch), so a re-import is safe.
 */

const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const logger = require('../utils/logger')

const csvDir = () =>
  process.env.EBIO_CSV_DIR || path.join(__dirname, '..', 'storage', 'biometric')

// ---- tiny CSV parser (handles quoted fields + commas inside quotes) ----------
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') {
        inQ = false
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQ = true
    } else if (c === ',' || c === ';' || c === '\t') {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

// ---- column detection --------------------------------------------------------
const RX = {
  code: /^(emp.*code|employee.*code|user.?id|userid|pin|badge|enroll|ac.?no|payroll)/i,
  datetime: /(date.?time|punch.?time|log.?time|date_time|transaction)/i,
  date: /^(date|punch.?date|log.?date|att.?date)/i,
  time: /^(time|punch.?time|log.?time)$/i,
  serial: /(serial|device|terminal|machine)/i,
  status: /(status|state|in.?out|punch.?type|inout)/i,
}

function detectColumns(header) {
  const idx = { code: -1, datetime: -1, date: -1, time: -1, serial: -1, status: -1 }
  header.forEach((h, i) => {
    const key = String(h || '').trim()
    if (idx.code < 0 && RX.code.test(key)) idx.code = i
    if (idx.datetime < 0 && RX.datetime.test(key)) idx.datetime = i
    if (idx.date < 0 && RX.date.test(key)) idx.date = i
    if (idx.time < 0 && RX.time.test(key)) idx.time = i
    if (idx.serial < 0 && RX.serial.test(key)) idx.serial = i
    if (idx.status < 0 && RX.status.test(key)) idx.status = i
  })
  return idx
}

const DATE_FMTS = [
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DDTHH:mm:ss',
  'DD-MM-YYYY HH:mm:ss',
  'DD/MM/YYYY HH:mm:ss',
  'MM/DD/YYYY HH:mm:ss',
  'DD-MMM-YYYY HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'DD-MM-YYYY HH:mm',
  'DD/MM/YYYY HH:mm',
]

function normalize(dt) {
  const s = String(dt || '').trim()
  if (!s) return null
  const m = moment(s, DATE_FMTS, true)
  if (m.isValid()) return m.format('YYYY-MM-DD HH:mm:ss')
  const loose = moment(new Date(s))
  return loose.isValid() ? loose.format('YYYY-MM-DD HH:mm:ss') : null
}

/**
 * Parse one CSV file's text into punch rows.
 * @returns {Array<{employeeCode, punchTime, deviceSerial, status}>}
 */
function parseCsv(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const first = parseCsvLine(lines[0])
  const looksLikeHeader = first.some((c) => /[a-zA-Z]/.test(c) && !/\d{4}-\d\d-\d\d/.test(c))
  let cols
  let startRow = 0
  if (looksLikeHeader) {
    cols = detectColumns(first)
    startRow = 1
  } else {
    // No header — assume common eSSL order: code, datetime, serial, status
    cols = { code: 0, datetime: 1, date: -1, time: -1, serial: 2, status: 3 }
  }
  // Fallbacks if detection missed the essentials
  if (cols.code < 0) cols.code = 0
  if (cols.datetime < 0 && cols.date < 0) cols.datetime = 1

  const rows = []
  for (let i = startRow; i < lines.length; i++) {
    const f = parseCsvLine(lines[i])
    const employeeCode = (f[cols.code] || '').trim()
    let dtStr =
      cols.datetime >= 0
        ? f[cols.datetime]
        : `${f[cols.date] || ''} ${cols.time >= 0 ? f[cols.time] || '' : ''}`.trim()
    const punchTime = normalize(dtStr)
    if (!employeeCode || !punchTime) continue
    const statusRaw = cols.status >= 0 ? String(f[cols.status] || '').toLowerCase() : ''
    const status = /out/.test(statusRaw) ? 1 : 0
    rows.push({
      employeeCode: employeeCode.slice(0, 32),
      punchTime,
      deviceSerial: (cols.serial >= 0 ? f[cols.serial] : 'eSSL-CSV' || 'eSSL-CSV').slice(0, 64),
      status,
    })
  }
  return rows
}

const biometricCsvImporter = {
  csvDir,
  parseCsv,

  /**
   * Scan the CSV folder, import every *.csv, and rename each to *.imported.
   * @returns {Promise<{files:number, fetched:number, stored:number}>}
   */
  async importAll() {
    const { sequelize } = require('../config/database')
    const dir = csvDir()
    if (!fs.existsSync(dir)) {
      return { files: 0, fetched: 0, stored: 0, note: `folder not found: ${dir}` }
    }
    const entries = fs
      .readdirSync(dir)
      .filter((f) => /\.csv$/i.test(f))
      .sort()

    let files = 0
    let fetched = 0
    let stored = 0
    // Punch timestamps that actually reached attendance_logs this run, so the
    // materializer syncs precisely the days the CSVs carried (which are often
    // backdated) rather than guessing at today.
    const storedPunchTimes = []
    for (const file of entries) {
      const full = path.join(dir, file)
      let rows
      try {
        rows = parseCsv(fs.readFileSync(full, 'utf8'))
      } catch (e) {
        logger.error(`[csv] failed to read ${file}: ${e.message}`)
        continue
      }
      files += 1
      fetched += rows.length
      if (rows.length > 0) {
        const placeholders = rows.map(() => '(?, ?, ?, ?, 15, NOW())').join(', ')
        const replacements = rows.flatMap((r) => [r.deviceSerial, r.employeeCode, r.punchTime, r.status])
        try {
          const [result] = await sequelize.query(
            `INSERT IGNORE INTO attendance_logs
               (device_serial, device_pin, punch_time, status, verify_mode, created_at)
             VALUES ${placeholders}`,
            { replacements }
          )
          const inserted = result?.affectedRows ?? 0
          stored += inserted
          // INSERT IGNORE reports how many rows were new but not which ones, so
          // re-materialize every day in the file whenever anything was inserted.
          // syncAllForDate is idempotent, so the over-coverage is only cost, and
          // a file that was entirely duplicates costs nothing at all.
          if (inserted > 0) storedPunchTimes.push(...rows.map((r) => r.punchTime))
        } catch (e) {
          logger.error(`[csv] insert failed for ${file}: ${e.message}`)
          continue // leave file so it retries next run
        }
      }
      // Mark processed so it isn't re-imported.
      try {
        fs.renameSync(full, full + '.imported')
      } catch {
        /* ignore rename errors */
      }
    }
    if (files) logger.info(`[csv] imported ${files} file(s): fetched=${fetched} stored=${stored}`)

    // Turn the new punches into attendance_records IN/OUT rows now. Awaited
    // because nothing is holding a connection open here — both callers (the
    // poller and POST /api/ebio/import-csv) want the count in their result.
    const attendance = await require('./biometricAttendanceSync').materializeDays(
      storedPunchTimes,
      'csv'
    )
    return { files, fetched, stored, attendance }
  },

  /** Start the auto-importer if EBIO_CSV_POLL_MINUTES >= 1. */
  startPoller() {
    const minutes = parseInt(process.env.EBIO_CSV_POLL_MINUTES || '0', 10)
    if (!minutes || minutes < 1) return null
    logger.info(`[csv] auto-import enabled: every ${minutes} min (dir=${csvDir()})`)
    const tick = async () => {
      try {
        await this.importAll()
      } catch (e) {
        logger.error(`[csv] auto-import error: ${e.message}`)
      }
    }
    const timer = setInterval(tick, minutes * 60 * 1000)
    if (timer.unref) timer.unref()
    return timer
  },
}

module.exports = biometricCsvImporter
