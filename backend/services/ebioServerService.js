/**
 * eBioServerNew (eSSL) Web API client — SOAP 1.1 over HTTP.
 *
 * eBioServerNew is eSSL's server software that the biometric terminals push to.
 * Pugmark PULLS punch data from it by calling its SOAP methods (the opposite of
 * the direct ADMS /iclock push). Configure via env:
 *
 *   EBIO_ENABLED=true
 *   EBIO_URL=http://<host>/Webservice.asmx      (the eBioServerNew web service)
 *   EBIO_USER=<api username from eBioServer app>
 *   EBIO_PASSWORD=<api password>
 *   EBIO_LOCATION=                              (blank = all locations)
 *
 * All methods take UserName + Password; responses are a single delimited string
 * inside <{Method}Result>…</{Method}Result>.
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')
const logger = require('../utils/logger')
const moment = require('moment-timezone')

const TEMPURI = 'http://tempuri.org/'

/**
 * Minimal POST using Node's built-in http/https — no external dependency and
 * works on every Node version (the backend has no axios/fetch/node-fetch, and
 * global fetch is absent on Node < 18).
 */
function httpPost(urlStr, headers, body, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let u
    try {
      u = new URL(urlStr)
    } catch {
      return reject(new Error(`Invalid EBIO_URL: "${urlStr}"`))
    }
    const lib = u.protocol === 'https:' ? https : http
    const data = Buffer.from(body, 'utf8')
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: (u.pathname || '/') + (u.search || ''),
        method: 'POST',
        headers: { ...headers, 'Content-Length': data.length },
        timeout: timeoutMs,
      },
      (res) => {
        let chunks = ''
        res.setEncoding('utf8')
        res.on('data', (c) => {
          chunks += c
        })
        res.on('end', () => resolve({ status: res.statusCode, text: chunks }))
      }
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('eBioServer request timed out')))
    req.write(data)
    req.end()
  })
}

const cfg = () => ({
  enabled: String(process.env.EBIO_ENABLED || '').toLowerCase() === 'true',
  url: process.env.EBIO_URL || '',
  user: process.env.EBIO_USER || '',
  password: process.env.EBIO_PASSWORD || '',
  location: process.env.EBIO_LOCATION || '',
})

const xmlEscape = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const xmlUnescape = (s) =>
  String(s == null ? '' : s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

/**
 * Low-level SOAP call. Returns the inner text of <{method}Result>.
 * @param {string} method  e.g. 'GetDeviceLogs'
 * @param {Object} params  ordered key/value pairs for the SOAP body
 */
async function callSoap(method, params = {}) {
  const { url } = cfg()
  if (!url) throw new Error('EBIO_URL is not configured')

  const inner = Object.entries(params)
    .map(([k, v]) => `      <${k}>${xmlEscape(v)}</${k}>`)
    .join('\n')

  const envelope =
    `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
    `xmlns:xsd="http://www.w3.org/2001/XMLSchema" ` +
    `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n` +
    `  <soap:Body>\n` +
    `    <${method} xmlns="${TEMPURI}">\n${inner}\n    </${method}>\n` +
    `  </soap:Body>\n` +
    `</soap:Envelope>`

  const { status, text } = await httpPost(
    url,
    {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${TEMPURI}${method}"`,
    },
    envelope
  )

  if (status < 200 || status >= 300) {
    throw new Error(`eBioServer ${method} HTTP ${status}: ${String(text).slice(0, 200)}`)
  }

  // Extract <{method}Result>…</{method}Result>
  const re = new RegExp(`<${method}Result[^>]*>([\\s\\S]*?)</${method}Result>`, 'i')
  const m = text.match(re)
  if (!m) {
    logger.warn(`[ebio] ${method}: could not find result node. Raw: ${text.slice(0, 300)}`)
    return ''
  }
  return xmlUnescape(m[1]).trim()
}

/**
 * Parse a device-logs result string.
 * Format (per manual): records separated by ';', fields by ','.
 * Fields: LogDateTime, EmployeeCode, DeviceName, DeviceLocation[, …]
 */
function parseDeviceLogs(resultStr) {
  const raw = String(resultStr || '').trim()
  if (!raw) return []
  // A plain "error"/"no records" style message has no ';' or ',' record shape.
  if (!raw.includes(',') && !raw.includes(';')) {
    logger.info(`[ebio] device logs message: ${raw.slice(0, 200)}`)
    return []
  }
  return raw
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((rec) => {
      const parts = rec.split(',').map((x) => x.trim())
      const [logTime, employeeCode, deviceName, deviceLocation] = parts
      return {
        logTime,
        employeeCode,
        deviceName: deviceName || '',
        deviceLocation: deviceLocation || '',
        raw: rec,
      }
    })
    .filter((r) => r.employeeCode && r.logTime)
}

/**
 * Normalise eBioServer's date-time string to 'YYYY-MM-DD HH:mm:ss'.
 * eSSL builds vary (dd-MM-yyyy, dd/MM/yyyy, ISO…) so we try several formats.
 */
function normalizePunchTime(s) {
  const str = String(s || '').trim()
  const fmts = [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss',
    'DD-MM-YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss',
    'DD-MMM-YYYY HH:mm:ss',
    'YYYY-MM-DD HH:mm',
    'DD-MM-YYYY HH:mm',
  ]
  const m = moment(str, fmts, true)
  if (m.isValid()) return m.format('YYYY-MM-DD HH:mm:ss')
  const loose = moment(new Date(str))
  return loose.isValid() ? loose.format('YYYY-MM-DD HH:mm:ss') : null
}

const ebioServerService = {
  cfg,
  isEnabled: () => cfg().enabled && !!cfg().url,
  normalizePunchTime,
  parseDeviceLogs,

  /**
   * GetDeviceLogs — all punches for a date (default today), optional location.
   * @returns {Promise<Array<{logTime, employeeCode, deviceName, deviceLocation, raw}>>}
   */
  async getDeviceLogs({ logDate, location } = {}) {
    const { user, password, location: defaultLoc } = cfg()
    const date = logDate || moment().format('YYYY-MM-DD')
    const result = await callSoap('GetDeviceLogs', {
      UserName: user,
      Password: password,
      Location: location != null ? location : defaultLoc,
      LogDate: date,
    })
    return parseDeviceLogs(result)
  },

  /** GetEmployeePunchLogs — punches for one employee on one date (raw string). */
  async getEmployeePunchLogs({ employeeCode, attendanceDate } = {}) {
    const { user, password } = cfg()
    return callSoap('GetEmployeePunchLogs', {
      UserName: user,
      Password: password,
      EmployeeCode: employeeCode,
      AttendanceDate: attendanceDate || moment().format('YYYY-MM-DD'),
    })
  },

  /** GetDeviceList — devices registered in eBioServer (raw string). */
  async getDeviceList({ location } = {}) {
    const { user, password, location: defaultLoc } = cfg()
    return callSoap('GetDeviceList', {
      UserName: user,
      Password: password,
      Location: location != null ? location : defaultLoc,
    })
  },

  /** Quick connectivity/credentials check — returns the raw device-list string. */
  async testConnection() {
    const raw = await this.getDeviceList({})
    return { ok: true, sample: String(raw).slice(0, 500) }
  },

  /**
   * Pull device logs for a date and upsert into attendance_logs (idempotent).
   * Shared by the /api/ebio/sync endpoint and the auto-poller.
   * @returns {Promise<{fetched:number, stored:number, skipped:number}>}
   */
  async syncDeviceLogsToDb({ logDate, location } = {}) {
    const { sequelize } = require('../config/database')
    const logs = await this.getDeviceLogs({ logDate, location })
    if (logs.length === 0) return { fetched: 0, stored: 0, skipped: 0 }

    const rows = []
    let skipped = 0
    for (const r of logs) {
      const punchTime = normalizePunchTime(r.logTime)
      if (!punchTime || !r.employeeCode) {
        skipped += 1
        continue
      }
      rows.push([
        (r.deviceName || 'eBioServer').slice(0, 64),
        String(r.employeeCode).slice(0, 32),
        punchTime,
        0, // status (eBioServer device logs carry no in/out flag)
        15, // verify_mode (unknown)
      ])
    }

    let stored = 0
    let attendance = { days: 0, users: 0 }
    if (rows.length > 0) {
      const placeholders = rows.map(() => '(?, ?, ?, ?, ?, NOW())').join(', ')
      const [result] = await sequelize.query(
        `INSERT IGNORE INTO attendance_logs
           (device_serial, device_pin, punch_time, status, verify_mode, created_at)
         VALUES ${placeholders}`,
        { replacements: rows.flat() }
      )
      stored = result?.affectedRows ?? rows.length

      // Roll the new punches straight into attendance_records (first punch of
      // the day = IN, last = OUT) so the poller keeps the attendance tables
      // live instead of leaving them to the nightly cron.
      if (stored > 0) {
        attendance = await require('./biometricAttendanceSync').materializeDays(
          rows.map((r) => r[2]), // punch_time column
          'ebio'
        )
      }
    }
    return { fetched: logs.length, stored, skipped, attendance }
  },

  /**
   * Start the auto-poller if EBIO_ENABLED and EBIO_POLL_MINUTES are set.
   * Pulls today's logs every N minutes. Safe to call once at startup.
   */
  startPoller() {
    const minutes = parseInt(process.env.EBIO_POLL_MINUTES || '0', 10)
    if (!this.isEnabled() || !minutes || minutes < 1) return null
    const intervalMs = minutes * 60 * 1000
    logger.info(`[ebio] auto-poll enabled: every ${minutes} min`)
    const tick = async () => {
      try {
        const r = await this.syncDeviceLogsToDb({})
        if (r.stored) logger.info(`[ebio] auto-poll stored ${r.stored} new punch(es)`)
      } catch (e) {
        logger.error(`[ebio] auto-poll error: ${e.message}`)
      }
    }
    const timer = setInterval(tick, intervalMs)
    if (timer.unref) timer.unref()
    return timer
  },
}

module.exports = ebioServerService
