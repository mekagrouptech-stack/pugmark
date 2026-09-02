const express = require('express')
const router = express.Router()
const logger = require('../utils/logger')
const { sequelize } = require('../config/database')
const csvImporter = require('../services/biometricCsvImporter')
const { normalizePunchTime } = require('../services/ebioServerService')
const biometricSync = require('../services/biometricAttendanceSync')

/**
 * eBioServerNew Web Hook receiver.
 *
 * The eSSL Bio Server (running on a local PC) can PUSH punches to a URL in real
 * time — this is the API-based path that works when the server can't be reached
 * inbound. Deliberately UNAUTHENTICATED (the Bio Server can't send a JWT); mount
 * at the app root so the external URL is:
 *
 *     https://pugmarkhr.com/api/ebio-hook
 *
 * Tolerant of payload shape: accepts JSON (object or array), form-encoded, or
 * CSV-style text, and stores into the same attendance_logs table (idempotent).
 * Always replies 200 so the Bio Server doesn't retry-storm.
 */

// Capture the raw body regardless of Content-Type (Bio Server headers vary).
router.use(express.text({ type: () => true, limit: '5mb' }))

// Common field-name aliases across eSSL firmwares/exports.
const FIELD = {
  code: ['employeecode', 'empcode', 'userid', 'pin', 'badgenumber', 'badge', 'enrollid', 'acno', 'payrollno'],
  time: ['logdatetime', 'punchtime', 'logdate', 'datetime', 'time', 'timestamp', 'date'],
  serial: ['serialnumber', 'serial', 'deviceserial', 'deviceid', 'device', 'devicename', 'terminal'],
  status: ['status', 'direction', 'inout', 'punchtype', 'state'],
}

function pick(obj, keys) {
  const flat = {}
  for (const k of Object.keys(obj || {})) flat[k.toLowerCase().replace(/[\s_-]/g, '')] = obj[k]
  for (const cand of keys) {
    const c = cand.replace(/[\s_-]/g, '')
    if (flat[c] != null && String(flat[c]).trim() !== '') return flat[c]
  }
  return null
}

function recordsFromJson(parsed) {
  const arr = Array.isArray(parsed)
    ? parsed
    : parsed.data || parsed.punches || parsed.logs || parsed.records || [parsed]
  return arr
    .map((o) => ({
      employeeCode: String(pick(o, FIELD.code) || '').trim().slice(0, 32),
      punchTime: normalizePunchTime(pick(o, FIELD.time)),
      deviceSerial: String(pick(o, FIELD.serial) || 'eSSL-Hook').slice(0, 64),
      status: /out/i.test(String(pick(o, FIELD.status) || '')) ? 1 : 0,
    }))
    .filter((r) => r.employeeCode && r.punchTime)
}

async function handle(req, res) {
  // The Bio Server's "Webhook Response" field defaults to `success` — it treats
  // the POST as delivered only if our body matches. Reply with that exact text.
  const ok = () => res.set('Content-Type', 'text/plain').status(200).send('success')
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || '')
    if (!raw || !raw.trim()) return ok()
    logger.info(`[ebio-hook] received ${raw.length} bytes: ${raw.slice(0, 300)}`)

    let records = []
    let parsed = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      /* not JSON */
    }
    if (parsed && typeof parsed === 'object') {
      records = recordsFromJson(parsed)
    } else {
      // Fallback: CSV / delimited text (reuse the CSV parser)
      records = csvImporter.parseCsv(raw)
    }

    if (records.length === 0) {
      logger.warn(`[ebio-hook] no parsable records in payload`)
      return ok()
    }

    const placeholders = records.map(() => '(?, ?, ?, ?, 15, NOW())').join(', ')
    const replacements = records.flatMap((r) => [
      r.deviceSerial,
      String(r.employeeCode).slice(0, 32),
      r.punchTime,
      r.status,
    ])
    const [result] = await sequelize.query(
      `INSERT IGNORE INTO attendance_logs
         (device_serial, device_pin, punch_time, status, verify_mode, created_at)
       VALUES ${placeholders}`,
      { replacements }
    )
    const inserted = result?.affectedRows ?? 0
    logger.info(`[ebio-hook] stored ${inserted}/${records.length} punch(es)`)

    // Materialize the punches into attendance_records (first punch of the day =
    // IN, last = OUT). Deliberately not awaited: the Bio Server is waiting on
    // `success` and retry-storms if we are slow, and a miss here is recovered by
    // the nightly sync.
    if (inserted > 0) {
      biometricSync.materializeDays(
        records.map((r) => r.punchTime),
        'ebio-hook'
      )
    }
    return ok()
  } catch (e) {
    logger.error(`[ebio-hook] error: ${e.message}`)
    // Still reply `success` (200) so the Bio Server advances instead of retry-storming.
    // Raw payloads are logged above; use the Bio Server "Reset" to re-send if needed.
    return res.set('Content-Type', 'text/plain').status(200).send('success')
  }
}

// Health check for the eSSL "Test" button / browser.
router.get('/', (req, res) => res.status(200).send('eBioServer webhook ready'))
router.post('/', handle)

module.exports = router
