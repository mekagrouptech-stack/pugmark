/**
 * Paste-from-Excel attendance entry.
 *
 * Copying a block of cells in Excel puts tab-separated text on the clipboard, so
 * pasting into a textarea gives us the selection verbatim — no file to save, no
 * upload, no round trip through the downloads folder. For an HR user fixing a
 * handful of rows that is the whole job.
 *
 * Three shapes are accepted, decided by looking at the content:
 *
 *  1. MATRIX  — the monthly report block: a header row of dates, one row per
 *               employee, cells holding status codes.
 *  2. ROWS    — a header naming Employee Code / Date / Check In / Check Out.
 *  3. LIST    — just employees (a code per line, optionally code + name). This is
 *               the "paste these people and mark them Present" case: the status
 *               and the dates come from the form, not from the paste.
 *
 * Shapes 1 and 2 are handed to the spreadsheet importer by rebuilding the paste
 * as a workbook in memory. That is deliberate: paste and file upload then run
 * the exact same parsing, matching and idempotency logic, so the two can never
 * drift apart or disagree about what a row means.
 */

const XLSX = require('xlsx')
const moment = require('moment-timezone')
const { Op } = require('sequelize')
const { User, AttendanceRecord, Office, UserOffice, sequelize } = require('../models')
const attendanceExcelImporter = require('./attendanceExcelImporter')
const logger = require('../utils/logger')

const IST = 'Asia/Kolkata'

const STATUS_CODES = {
  P: 'Present',
  WOF: 'Week Off',
  A: 'Absent',
  HD: 'Half Day',
  H: 'Holiday',
  L: 'Late',
}

/**
 * Split pasted text into a grid.
 *
 * Tabs are the primary separator because that is what Excel writes. Commas are
 * accepted as a fallback for text copied out of a CSV, but only when the line
 * has no tabs at all — a genuine Excel cell can contain a comma ("Nair, Priya")
 * and splitting on it would tear the row apart.
 */
function toGrid(text) {
  const lines = String(text || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '')

  return lines.map((line) =>
    (line.includes('\t') ? line.split('\t') : line.split(',')).map((cell) => cell.trim())
  )
}

const looksLikeDate = (v) =>
  /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(String(v || '').trim()) ||
  /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(String(v || '').trim())

const HEADER_WORDS = /employee|emp\s*code|date|check\s*in|check\s*out|punch|status|designation|sr\.?\s*no/i

/**
 * Work out which of the three shapes a pasted grid is.
 * Returns 'matrix' | 'rows' | 'list'.
 */
function detectShape(grid) {
  if (grid.length === 0) return 'list'

  const header = grid[0] || []

  // A month of date headers is unmistakably the matrix report. Requiring
  // several means a ROWS paste with a single "Date" column cannot be mistaken
  // for one.
  const dateHeaders = header.filter(looksLikeDate).length
  if (dateHeaders >= 5) return 'matrix'

  // A header naming the row-format columns.
  const headerText = header.join(' ')
  if (HEADER_WORDS.test(headerText) && dateHeaders === 0) {
    const hasDateCol = /date/i.test(headerText)
    const hasEmployeeCol = /employee|emp\s*code/i.test(headerText)
    if (hasDateCol && hasEmployeeCol) return 'rows'
  }

  return 'list'
}

/** Rebuild a pasted grid as an in-memory workbook the file importer can read. */
function gridToWorkbookBuffer(grid, sheetName) {
  const sheet = XLSX.utils.aoa_to_sheet(grid)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, sheetName)
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Pull employee identifiers out of a LIST paste.
 *
 * Each line is one employee. A line may be just a code, or a code and a name in
 * either order (people paste both columns), so every cell on the line is offered
 * as a candidate and whichever one resolves wins.
 */
function parseList(grid) {
  const entries = []
  grid.forEach((cells, index) => {
    const candidates = cells.map((c) => String(c || '').trim()).filter(Boolean)
    if (candidates.length === 0) return

    // Skip an obvious header line rather than reporting it as a missing
    // employee — people copy the header along with the data constantly.
    if (index === 0 && candidates.some((c) => HEADER_WORDS.test(c)) && candidates.length <= 4) {
      return
    }

    entries.push({ line: index + 1, candidates, raw: candidates.join(' ') })
  })
  return entries
}

/** Every YYYY-MM-DD between two dates inclusive (capped, so a typo cannot run away). */
function datesBetween(startStr, endStr) {
  const start = moment.tz(startStr, 'YYYY-MM-DD', IST).startOf('day')
  const end = moment.tz(endStr || startStr, 'YYYY-MM-DD', IST).startOf('day')
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return []

  const out = []
  const cursor = start.clone()
  while (cursor.isSameOrBefore(end) && out.length < 366) {
    out.push(cursor.format('YYYY-MM-DD'))
    cursor.add(1, 'day')
  }
  return out
}

/** Resolve an office per user — attendance_records.office_id is NOT NULL. */
async function officeResolver() {
  const cache = new Map()
  let fallback
  return async (userId) => {
    if (cache.has(userId)) return cache.get(userId)
    let officeId = null
    try {
      const uo = await UserOffice.findOne({ where: { userId }, attributes: ['officeId'] })
      if (uo && uo.officeId) officeId = uo.officeId
    } catch {
      /* fall through to the default office */
    }
    if (!officeId) {
      if (fallback === undefined) {
        const office = await Office.findOne({ attributes: ['id'], order: [['id', 'ASC']] })
        fallback = office ? office.id : null
      }
      officeId = fallback
    }
    cache.set(userId, officeId)
    return officeId
  }
}

/**
 * Match LIST entries to employees.
 *
 * Codes are matched first and exactly; names only as a fallback and only when
 * unambiguous, so two people sharing a name resolve to neither rather than to
 * whichever row was read last.
 */
async function resolveListEntries(entries) {
  const values = [...new Set(entries.flatMap((e) => e.candidates))].filter(Boolean)
  if (values.length === 0) return { matched: [], unmatched: entries.map((e) => ({ ...e, reason: 'Empty line' })) }

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { employeeCode: { [Op.in]: values } },
        { devicePin: { [Op.in]: values } },
        { name: { [Op.in]: values } },
      ],
    },
    attributes: ['id', 'name', 'employeeCode', 'devicePin', 'isActive'],
  })

  const byCode = new Map()
  const byName = new Map()
  users.forEach((u) => {
    if (u.employeeCode) byCode.set(String(u.employeeCode).toLowerCase(), u)
    if (u.devicePin) byCode.set(String(u.devicePin).toLowerCase(), u)
    if (u.name) {
      const key = String(u.name).trim().toLowerCase().replace(/\s+/g, ' ')
      byName.set(key, byName.has(key) ? null : u)
    }
  })

  const matched = []
  const unmatched = []
  const seen = new Set()

  entries.forEach((entry) => {
    let user = null
    for (const candidate of entry.candidates) {
      user = byCode.get(candidate.toLowerCase())
      if (user) break
    }
    if (!user) {
      for (const candidate of entry.candidates) {
        const key = candidate.toLowerCase().replace(/\s+/g, ' ')
        if (byName.has(key)) {
          user = byName.get(key) // may be null when the name is ambiguous
          if (user) break
        }
      }
    }

    if (!user) {
      unmatched.push({ ...entry, reason: `No employee matches "${entry.raw}"` })
      return
    }
    // The same person pasted twice is one person, not two.
    if (seen.has(user.id)) return
    seen.add(user.id)
    matched.push({ ...entry, user })
  })

  return { matched, unmatched }
}

/**
 * Parse a paste and describe what it would do — nothing is written.
 *
 * A paste is invisible until it lands, so previewing it is not a nicety: a
 * mistyped column or a stray header row should be visible before it becomes
 * two thousand attendance rows.
 */
async function preview({ text, dates, status }) {
  const grid = toGrid(text)
  if (grid.length === 0) {
    const err = new Error('Nothing was pasted.')
    err.statusCode = 400
    throw err
  }

  const shape = detectShape(grid)

  if (shape !== 'list') {
    return {
      shape,
      rows: grid.length,
      columns: grid[0].length,
      message:
        shape === 'matrix'
          ? 'Looks like a monthly report block (a column per day). It will be read the same way as an uploaded report.'
          : 'Looks like a row-per-day block. It will be read the same way as an uploaded sheet.',
      sample: grid.slice(0, 4),
    }
  }

  const entries = parseList(grid)
  const { matched, unmatched } = await resolveListEntries(entries)

  return {
    shape: 'list',
    employees: matched.map((m) => ({
      line: m.line,
      userId: m.user.id,
      name: m.user.name,
      employeeCode: m.user.employeeCode,
      isActive: m.user.isActive,
    })),
    unmatched: unmatched.map((u) => ({ line: u.line, raw: u.raw, reason: u.reason })),
    dates: Array.isArray(dates) ? dates : [],
    status: status || 'P',
    willWrite: matched.length * (Array.isArray(dates) ? dates.length : 0),
  }
}

/**
 * Apply a paste.
 *
 * @param {Object}   opts
 * @param {string}   opts.text       the pasted clipboard text
 * @param {string}   [opts.status]   LIST only — code to mark (default 'P')
 * @param {string}   [opts.startDate] LIST only — YYYY-MM-DD
 * @param {string}   [opts.endDate]   LIST only — YYYY-MM-DD (defaults to startDate)
 * @param {boolean}  [opts.preserveExisting] LIST only — skip days that already
 *                   hold a punch or a manual entry
 */
async function apply(opts) {
  const {
    text,
    status = 'P',
    startDate,
    endDate,
    preserveExisting = true,
  } = opts || {}

  const grid = toGrid(text)
  if (grid.length === 0) {
    const err = new Error('Nothing was pasted.')
    err.statusCode = 400
    throw err
  }

  const shape = detectShape(grid)

  // Matrix and row pastes are the spreadsheet importer's job — rebuilt as a
  // workbook so there is exactly one implementation of that parsing.
  if (shape !== 'list') {
    const buffer = gridToWorkbookBuffer(grid, 'Pasted')
    const result = await attendanceExcelImporter.importAttendanceWorkbook(buffer)
    return { ...result, shape, via: 'spreadsheet-importer' }
  }

  if (!STATUS_CODES[status]) {
    const err = new Error(`Unknown status code "${status}".`)
    err.statusCode = 400
    throw err
  }

  const dates = datesBetween(startDate, endDate)
  if (dates.length === 0) {
    const err = new Error('A valid date (or date range) is required for a list of employees.')
    err.statusCode = 400
    throw err
  }

  const entries = parseList(grid)
  const { matched, unmatched } = await resolveListEntries(entries)
  if (matched.length === 0) {
    return {
      shape: 'list',
      total: entries.length,
      imported: 0,
      skipped: entries.length,
      errors: unmatched.map((u) => ({ row: u.line, employeeCode: u.raw, reason: u.reason })),
    }
  }

  const userIds = matched.map((m) => m.user.id)
  const rangeStart = moment.tz(dates[0], 'YYYY-MM-DD', IST).startOf('day').utc().toDate()
  const rangeEnd = moment
    .tz(dates[dates.length - 1], 'YYYY-MM-DD', IST)
    .endOf('day')
    .utc()
    .toDate()

  // One query for the window rather than one per employee-day.
  const existing = await AttendanceRecord.findAll({
    where: { userId: { [Op.in]: userIds }, createdAt: { [Op.gte]: rangeStart, [Op.lte]: rangeEnd } },
    attributes: ['userId', 'createdAt', 'source'],
    raw: true,
  })

  // Only rows this tooling did not write block a day; its own output must stay
  // replaceable or re-pasting a corrected list would do nothing.
  const occupied = new Set()
  existing.forEach((r) => {
    if (r.source === 'import') return
    occupied.add(`${r.userId}:${moment.utc(r.createdAt).tz(IST).format('YYYY-MM-DD')}`)
  })

  const resolveOffice = await officeResolver()
  const rows = []
  let preserved = 0

  for (const { user } of matched) {
    const officeId = await resolveOffice(user.id)
    if (!officeId) continue

    for (const date of dates) {
      if (preserveExisting && occupied.has(`${user.id}:${date}`)) {
        preserved += 1
        continue
      }
      const anchor = moment.tz(`${date} 12:00:00`, 'YYYY-MM-DD HH:mm:ss', IST).utc().toDate()
      rows.push({
        userId: user.id,
        officeId,
        punchType: 'IN',
        isWithinRadius: true,
        status,
        source: 'import',
        remark: `Pasted (${STATUS_CODES[status]})`,
        createdAt: anchor,
        updatedAt: anchor,
      })
    }
  }

  const t = await sequelize.transaction()
  try {
    await AttendanceRecord.destroy({
      where: {
        userId: { [Op.in]: userIds },
        source: 'import',
        createdAt: { [Op.gte]: rangeStart, [Op.lte]: rangeEnd },
      },
      transaction: t,
    })
    for (let i = 0; i < rows.length; i += 500) {
      await AttendanceRecord.bulkCreate(rows.slice(i, i + 500), { transaction: t, silent: true })
    }
    await t.commit()
  } catch (e) {
    await t.rollback()
    logger.error(`attendancePaste: apply failed: ${e.message}`)
    throw e
  }

  logger.info(
    `attendancePaste: marked ${rows.length} day(s) as ${status} for ${matched.length} employee(s)`
  )

  return {
    shape: 'list',
    status,
    statusLabel: STATUS_CODES[status],
    employees: matched.length,
    dates: dates.length,
    total: entries.length,
    imported: rows.length,
    preserved,
    skipped: unmatched.length,
    errors: unmatched.map((u) => ({ row: u.line, employeeCode: u.raw, reason: u.reason })),
  }
}

module.exports = {
  preview,
  apply,
  STATUS_CODES,
  // exported for tests
  toGrid,
  detectShape,
  parseList,
  datesBetween,
}
