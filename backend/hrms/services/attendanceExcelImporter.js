/**
 * Attendance Excel/CSV importer.
 *
 * Turns a spreadsheet of attendance into attendance_records. Each row names an
 * employee, a date, and the times worked; the row is applied through
 * attendanceService.updateAttendanceRecord — the same upsert the "Edit" action
 * on the team attendance screen uses — so an import and a manual correction
 * produce identical rows, and re-importing a corrected sheet overwrites rather
 * than duplicates.
 *
 * Expected columns (header names are matched loosely — case, spaces,
 * underscores and common synonyms all resolve):
 *
 *   Employee Code | Date       | Check In | Check Out | Status (optional)
 *   MIPL92        | 26/08/2026 | 09:31    | 18:36     | Present
 *
 * HR builds these sheets by hand and exports them from other systems, so the
 * parsers below are deliberately forgiving: dates arrive as Excel serial
 * numbers, dd/mm/yyyy, or ISO; times as serial fractions, "9:31 AM", or
 * "09:31:00". A row that cannot be understood is reported back with the reason
 * and the sheet's own row number rather than aborting the whole file — a
 * 200-row sheet with two bad dates should import 198 rows and tell you about
 * the two.
 */

const XLSX = require('xlsx')
const moment = require('moment-timezone')
const { Op } = require('sequelize')
const { User, AttendanceRecord, Office, UserOffice } = require('../models')
const attendanceService = require('./attendanceService')
const logger = require('../utils/logger')

const IST = 'Asia/Kolkata'

// Header aliases -> canonical field. Compared after normalising to lowercase
// alphanumerics, so "Employee Code", "employee_code" and "EmpCode" all match.
const HEADER_ALIASES = {
  employeecode: 'employeeCode',
  empcode: 'employeeCode',
  code: 'employeeCode',
  employeeid: 'employeeCode',
  empid: 'employeeCode',
  employee: 'employeeCode',
  pin: 'employeeCode',
  devicepin: 'employeeCode',

  date: 'date',
  attendancedate: 'date',
  punchdate: 'date',
  day: 'date',

  checkin: 'checkIn',
  intime: 'checkIn',
  punchin: 'checkIn',
  timein: 'checkIn',
  in: 'checkIn',

  checkout: 'checkOut',
  outtime: 'checkOut',
  punchout: 'checkOut',
  timeout: 'checkOut',
  out: 'checkOut',

  status: 'status',

  // Present so a sheet exported by this app re-imports cleanly. Ignored on the
  // way in because the service recomputes hours from the times.
  employeename: 'employeeName',
  name: 'employeeName',
  totalhours: 'totalHours',
  hours: 'totalHours',
}

const normalizeHeader = (h) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** Map a sheet's raw header row onto canonical field names. */
function mapHeaders(rawRow) {
  const mapping = {}
  Object.keys(rawRow).forEach((key) => {
    const canonical = HEADER_ALIASES[normalizeHeader(key)]
    if (canonical) mapping[key] = canonical
  })
  return mapping
}

/**
 * Excel stores a date as days since 1899-12-30 and a time as the fractional
 * part of a day. XLSX hands back the raw number unless the cell was tagged as a
 * date, so both shapes have to be handled here.
 */
function excelSerialToDate(serial) {
  const utcDays = Math.floor(serial) - 25569
  const d = new Date(utcDays * 86400 * 1000)
  return Number.isNaN(d.getTime()) ? null : d
}

const pad = (n) => String(n).padStart(2, '0')

/** Normalise a cell into YYYY-MM-DD, or null when it is not a date. */
function parseDateCell(value) {
  if (value === null || value === undefined || value === '') return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }

  if (typeof value === 'number') {
    const d = excelSerialToDate(value)
    if (!d) return null
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  }

  const s = String(value).trim()
  if (!s) return null

  // ISO first — unambiguous.
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`

  // dd/mm/yyyy and dd-mm-yyyy. Day-first is the assumption: this is an Indian
  // deployment and the app formats every date as DD/MM/YYYY, so a sheet
  // exported from it round-trips. A value above 12 in the first position is
  // clearly a day and settles that row; 03/04 stays ambiguous and follows the
  // day-first rule.
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (m) {
    const [, a, b, year] = m
    const day = Number.parseInt(a, 10)
    const month = Number.parseInt(b, 10)
    if (month > 12 && day <= 12) return `${year}-${pad(day)}-${pad(month)}` // clearly mm/dd
    if (day > 31 || month > 12) return null
    return `${year}-${pad(month)}-${pad(day)}`
  }

  const parsed = new Date(s)
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
  }
  return null
}

/**
 * Normalise a cell into 24-hour HH:mm, or null when blank/unparseable.
 * updateAttendanceRecord only accepts HH:mm, so everything funnels to that.
 */
function parseTimeCell(value) {
  if (value === null || value === undefined || value === '') return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`
  }

  // Fraction of a day: 0.5 = 12:00. A whole number here is a date cell in the
  // wrong column, so only the fractional part is meaningful.
  if (typeof value === 'number') {
    const frac = value - Math.floor(value)
    const totalMinutes = Math.round(frac * 24 * 60)
    if (totalMinutes < 0 || totalMinutes >= 24 * 60) return null
    return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`
  }

  const s = String(value).trim()
  if (!s || s === '-' || s === '--:--') return null

  // "9:31 AM", "09:31", "09:31:22", "9.31 PM"
  const m = s.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp][Mm])?$/)
  if (!m) return null

  let hours = Number.parseInt(m[1], 10)
  const minutes = Number.parseInt(m[2], 10)
  const meridiem = (m[4] || '').toLowerCase()

  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null

  return `${pad(hours)}:${pad(minutes)}`
}

/**
 * Parse a workbook buffer into canonical rows.
 *
 * Returns { rows, headerError }. headerError is set when the sheet has no
 * recognisable employee/date columns at all — worth failing loudly on, rather
 * than reporting every single row as broken.
 */
function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { rows: [], headerError: 'The file contains no sheets.' }

  const sheet = wb.Sheets[sheetName]
  // defval keeps blank cells present, so a missing Check Out reads as null
  // instead of shifting the row's keys.
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false, dateNF: 'yyyy-mm-dd' })
  if (raw.length === 0) return { rows: [], headerError: 'The sheet has no data rows.' }

  const mapping = mapHeaders(raw[0])
  const mapped = Object.values(mapping)
  if (!mapped.includes('employeeCode') || !mapped.includes('date')) {
    return {
      rows: [],
      headerError:
        'Could not find the required columns. The sheet needs an "Employee Code" column and a "Date" column.',
    }
  }

  const rows = raw.map((rawRow, index) => {
    // +2: one for the header row, one because spreadsheets are 1-indexed — so
    // this is the row number the user sees in Excel.
    const row = { rowNumber: index + 2 }
    Object.entries(mapping).forEach(([rawKey, field]) => {
      row[field] = rawRow[rawKey]
    })
    return row
  })

  return { rows, headerError: null }
}


// ---------------------------------------------------------------------------
// Monthly matrix format
// ---------------------------------------------------------------------------

/**
 * The monthly attendance report is a different animal from the row-per-day
 * sheet above: one row per employee, one COLUMN per calendar day, and each cell
 * holds a status code rather than times.
 *
 *   Sr.No | Employee Username | Employee | Designation | 01-07-2026 | 02-07-2026 | …
 *   1     | MIPL131           | Abhishek | Division Hd | P          | WOF        | …
 *
 * Three properties of the real reports drive the parsing below:
 *
 *  - Column ORDER is not stable between sheets. In the HO tab the code comes
 *    before the name; in Dahej they are swapped; the UAE tab has no code column
 *    at all. Columns are therefore identified by their CONTENT (a code looks
 *    like MIPL131) and not by position — a positional reader silently swaps
 *    name and code and imports every Dahej row against the wrong person.
 *  - Leading columns vary in count, so the day columns are found by testing
 *    each header for a date rather than assuming a fixed offset.
 *  - Every tab is a real location with real employees, so all sheets are read,
 *    and each row is reported with the sheet it came from.
 */

// Codes that describe a worked/non-worked day we can represent. Leave codes are
// deliberately absent — see LEAVE_CODES.
const ATTENDANCE_CODES = new Set(['P', 'WOF', 'A', 'HD', 'L'])

// Leave and not-applicable codes. These belong in the leaves table, which this
// importer does not touch, so they are reported as skipped rather than being
// quietly dropped or mis-filed as attendance.
const LEAVE_CODES = {
  EL: 'Earned Leave',
  HEL: 'Half Earned Leave',
  CO: 'Comp Off',
  LWP: 'Leave Without Pay',
  HLWP: 'Half Leave Without Pay',
  NA: 'Not applicable',
}

const looksLikeEmployeeCode = (v) => /^[A-Za-z]{2,6}\s*\d{1,6}$/.test(String(v || '').trim())

/** True when a header cell is a calendar date (the day columns). */
function headerDate(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return parseDateCell(value)
  const s = String(value).trim()
  if (!/\d/.test(s)) return null
  if (!/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(s) && typeof value !== 'number') return null
  return parseDateCell(value)
}

/**
 * Locate the code and name columns among the leading (non-date) columns.
 *
 * Decided by looking at the data, not the headers: the header text is
 * inconsistent ("Employee Username" vs "Employee") but an employee code is
 * unmistakable. The name is then the remaining text column with the highest
 * fill rate, excluding the ones we can identify as something else.
 */
function locateIdentityColumns(rows, leadingCols, header) {
  const score = leadingCols.map((col) => {
    let codeHits = 0
    let filled = 0
    rows.forEach((r) => {
      const v = r[col]
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        filled += 1
        if (looksLikeEmployeeCode(v)) codeHits += 1
      }
    })
    return { col, codeHits, filled, header: String(header[col] || '').toLowerCase() }
  })

  // The code column is the one whose values actually look like codes.
  const codeCol = score
    .filter((c) => c.filled > 0 && c.codeHits / c.filled > 0.6)
    .sort((a, b) => b.codeHits - a.codeHits)[0]

  // The name column: a well-filled text column that is not the code column, not
  // the serial number, and not one of the known metadata headers.
  const excluded = /sr\.?\s*no|designation|joining|lwd|date/
  const nameCol = score
    .filter(
      (c) =>
        (!codeCol || c.col !== codeCol.col) &&
        c.codeHits === 0 &&
        c.filled > 0 &&
        !excluded.test(c.header)
    )
    .sort((a, b) => b.filled - a.filled)[0]

  return { codeCol: codeCol ? codeCol.col : null, nameCol: nameCol ? nameCol.col : null }
}

/**
 * Parse one worksheet in matrix form.
 * Returns null when the sheet is not a matrix (no date columns), so the caller
 * can fall back to the row-per-day reader.
 */
function parseMatrixSheet(worksheet, sheetName) {
  const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false })
  if (aoa.length < 2) return null

  const header = aoa[0] || []
  const dateCols = []
  header.forEach((h, i) => {
    const d = headerDate(h)
    if (d) dateCols.push({ col: i, date: d })
  })

  // A couple of stray date-looking headers is not a matrix; a month of them is.
  if (dateCols.length < 5) return null

  const firstDateCol = dateCols[0].col
  const leadingCols = []
  for (let i = 0; i < firstDateCol; i++) leadingCols.push(i)

  const bodyRows = aoa.slice(1).map((row, idx) => ({ row: row || [], rowNumber: idx + 2 }))
  const populated = bodyRows.filter(({ row }) =>
    dateCols.some(({ col }) => row[col] !== null && String(row[col] || '').trim() !== '')
  )

  const { codeCol, nameCol } = locateIdentityColumns(
    populated.map((r) => r.row),
    leadingCols,
    header
  )

  const entries = []
  populated.forEach(({ row, rowNumber }) => {
    const employeeCode = codeCol !== null ? String(row[codeCol] || '').trim() : ''
    const employeeName = nameCol !== null ? String(row[nameCol] || '').trim() : ''
    if (!employeeCode && !employeeName) return

    dateCols.forEach(({ col, date }) => {
      const raw = row[col]
      const code = String(raw === null || raw === undefined ? '' : raw).trim().toUpperCase()
      if (!code) return
      entries.push({ sheetName, rowNumber, employeeCode, employeeName, date, code })
    })
  })

  return { entries, employees: populated.length, days: dateCols.length, codeCol, nameCol }
}


/** Resolve an office for a user — attendance_records.office_id is NOT NULL. */
async function resolveOfficeId(userId, cache) {
  if (cache.has(userId)) return cache.get(userId)
  let officeId = null
  try {
    const uo = await UserOffice.findOne({ where: { userId }, attributes: ['officeId'] })
    if (uo && uo.officeId) officeId = uo.officeId
  } catch {
    /* fall through to the default office */
  }
  if (!officeId) {
    const office = await Office.findOne({ attributes: ['id'], order: [['id', 'ASC']] })
    officeId = office ? office.id : null
  }
  cache.set(userId, officeId)
  return officeId
}

/**
 * Write one status-only day.
 *
 * The report gives a status and no times, so the row carries its status
 * explicitly and created_at is used purely as a date anchor (midday IST, far
 * from either midnight so no timezone rounding can push the row onto the
 * neighbouring day). The read path skips the punch-formatting branches for rows
 * like these, so the anchor is never rendered as a check-in.
 *
 * source='import' scopes the idempotency delete: re-importing a month replaces
 * its own rows and never disturbs a real punch or a manual correction.
 */
async function writeStatusDay({ userId, officeId, date, code, sheetName }) {
  const dayStart = moment.tz(date, 'YYYY-MM-DD', IST).startOf('day').utc().toDate()
  const dayEnd = moment.tz(date, 'YYYY-MM-DD', IST).endOf('day').utc().toDate()
  const anchor = moment.tz(date + ' 12:00:00', 'YYYY-MM-DD HH:mm:ss', IST).utc().toDate()

  await AttendanceRecord.destroy({
    where: {
      userId,
      source: 'import',
      createdAt: { [Op.gte]: dayStart, [Op.lte]: dayEnd },
    },
  })

  await AttendanceRecord.create(
    {
      userId,
      officeId,
      punchType: 'IN',
      isWithinRadius: true,
      status: code,
      source: 'import',
      remark: 'Monthly report (' + sheetName + ')',
      createdAt: anchor,
      updatedAt: anchor,
    },
    { silent: true }
  )
}

/**
 * Import a monthly attendance-report workbook (every sheet).
 *
 * @param {import('xlsx').WorkBook} wb
 */
async function importMatrixWorkbook(wb) {
  const sheets = []
  for (const name of wb.SheetNames) {
    const parsed = parseMatrixSheet(wb.Sheets[name], name)
    if (parsed && parsed.entries.length) sheets.push({ name, parsed })
  }
  if (sheets.length === 0) return null

  const entries = sheets.flatMap((s) => s.parsed.entries)

  // Resolve every identifier in the workbook in one pass.
  const codes = [...new Set(entries.map((e) => e.employeeCode).filter(Boolean))]
  const names = [...new Set(entries.map((e) => e.employeeName).filter(Boolean))]

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { employeeCode: { [Op.in]: codes.length ? codes : [''] } },
        { devicePin: { [Op.in]: codes.length ? codes : [''] } },
        { name: { [Op.in]: names.length ? names : [''] } },
      ],
    },
    attributes: ['id', 'name', 'employeeCode', 'devicePin'],
  })

  const byCode = new Map()
  const byName = new Map()
  users.forEach((u) => {
    if (u.employeeCode) byCode.set(String(u.employeeCode).toLowerCase(), u)
    if (u.devicePin) byCode.set(String(u.devicePin).toLowerCase(), u)
    if (u.name) {
      // Names are a fallback only (the UAE sheet has no code column), and only
      // when unambiguous — two people called "Suresh Kumar" must not silently
      // resolve to whichever row happened to be read last.
      const key = String(u.name).trim().toLowerCase().replace(/\s+/g, ' ')
      byName.set(key, byName.has(key) ? null : u)
    }
  })

  const officeCache = new Map()
  const errors = []
  const skippedCodeCounts = {}
  const unresolved = new Set()
  let imported = 0

  for (const entry of entries) {
    const { code } = entry

    // Leave codes and anything unrecognised are tallied, not listed: 58 EL
    // cells would bury every other message in the report.
    if (LEAVE_CODES[code] || !ATTENDANCE_CODES.has(code)) {
      skippedCodeCounts[code] = (skippedCodeCounts[code] || 0) + 1
      continue
    }

    let user = entry.employeeCode ? byCode.get(entry.employeeCode.toLowerCase()) : null
    if (!user && entry.employeeName) {
      const key = entry.employeeName.trim().toLowerCase().replace(/\s+/g, ' ')
      // null here means the name is ambiguous — treat it as unresolved.
      user = byName.get(key) || null
    }

    if (!user) {
      const label = entry.employeeCode || entry.employeeName || '(unnamed)'
      const seenKey = entry.sheetName + ':' + label
      if (!unresolved.has(seenKey)) {
        unresolved.add(seenKey)
        errors.push({
          row: entry.rowNumber,
          sheet: entry.sheetName,
          employeeCode: label,
          reason: entry.employeeCode
            ? 'No employee matches code "' + entry.employeeCode + '"'
            : 'No employee matches the name "' + entry.employeeName +
              '" (this sheet has no employee code column)',
        })
      }
      continue
    }

    const officeId = await resolveOfficeId(user.id, officeCache)
    if (!officeId) {
      errors.push({
        row: entry.rowNumber,
        sheet: entry.sheetName,
        employeeCode: entry.employeeCode || entry.employeeName,
        reason: 'No office configured — cannot create an attendance record',
      })
      continue
    }

    try {
      await writeStatusDay({
        userId: user.id,
        officeId,
        date: entry.date,
        code,
        sheetName: entry.sheetName,
      })
      imported += 1
    } catch (e) {
      errors.push({
        row: entry.rowNumber,
        sheet: entry.sheetName,
        employeeCode: entry.employeeCode || entry.employeeName,
        reason: e.message || 'Failed to save',
      })
    }
  }

  // Roll the per-code tallies into report lines, so the UI shows in one place
  // exactly what was left out and why.
  Object.entries(skippedCodeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      errors.push({
        row: '—',
        sheet: 'all sheets',
        employeeCode: code,
        reason: LEAVE_CODES[code]
          ? count + ' day(s) marked ' + code + ' (' + LEAVE_CODES[code] +
            ') — leave is not imported by this tool'
          : count + ' day(s) had the unrecognised code "' + code + '"',
      })
    })

  logger.info(
    'attendanceExcelImport(matrix): ' + imported + '/' + entries.length +
      ' day(s) imported across ' + sheets.length + ' sheet(s)'
  )

  return {
    format: 'matrix',
    sheets: sheets.map((s) => ({
      name: s.name,
      employees: s.parsed.employees,
      days: s.parsed.days,
    })),
    total: entries.length,
    imported,
    skipped: entries.length - imported,
    errors,
  }
}

/**
 * Import attendance rows from a spreadsheet buffer.
 *
 * @param {Buffer} buffer the uploaded .xlsx/.xls/.csv
 * @returns {Promise<{total:number, imported:number, skipped:number, errors:Array}>}
 */
async function importAttendanceWorkbook(buffer) {
  // Two shapes reach this function and they are told apart by structure, not by
  // asking the user to pick: the monthly report is a matrix (a column per
  // calendar day), everything else is one row per employee-day. The matrix test
  // requires a month's worth of date headers, so a row-per-day sheet that
  // happens to contain a date column cannot be mistaken for one.
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const matrix = await importMatrixWorkbook(wb)
  if (matrix) return matrix

  const { rows, headerError } = parseWorkbook(buffer)
  if (headerError) {
    const err = new Error(headerError)
    err.statusCode = 400
    throw err
  }

  // Resolve every employee code in the sheet up front: one query instead of one
  // per row, and an unknown code can then be reported without a database round
  // trip. Device PIN is accepted too, since biometric exports carry that.
  const codes = [
    ...new Set(rows.map((r) => String(r.employeeCode || '').trim()).filter(Boolean)),
  ]
  const users = codes.length
    ? await User.findAll({
        where: {
          [Op.or]: [{ employeeCode: { [Op.in]: codes } }, { devicePin: { [Op.in]: codes } }],
        },
        attributes: ['id', 'name', 'employeeCode', 'devicePin'],
      })
    : []

  const byCode = new Map()
  users.forEach((u) => {
    if (u.employeeCode) byCode.set(String(u.employeeCode).toLowerCase(), u)
    if (u.devicePin) byCode.set(String(u.devicePin).toLowerCase(), u)
  })

  const errors = []
  let imported = 0

  for (const row of rows) {
    const code = String(row.employeeCode || '').trim()
    const fail = (reason) => errors.push({ row: row.rowNumber, employeeCode: code || '—', reason })

    if (!code) {
      fail('No employee code')
      continue
    }

    const user = byCode.get(code.toLowerCase())
    if (!user) {
      fail(`No employee matches code "${code}"`)
      continue
    }

    const date = parseDateCell(row.date)
    if (!date) {
      fail(`Could not read the date "${row.date === null || row.date === undefined ? '' : row.date}"`)
      continue
    }

    const checkIn = parseTimeCell(row.checkIn)
    const checkOut = parseTimeCell(row.checkOut)
    if (!checkIn && !checkOut) {
      fail('Row has neither a check-in nor a check-out time')
      continue
    }

    try {
      await attendanceService.updateAttendanceRecord({
        userId: user.id,
        date,
        checkInTime: checkIn || undefined,
        checkOutTime: checkOut || undefined,
        status: row.status || undefined,
      })
      imported += 1
    } catch (e) {
      // Business-rule rejections (check-out before check-in, say) belong in the
      // report next to the row that caused them, not in a 500.
      fail(e.message || 'Failed to save')
    }
  }

  logger.info(
    `attendanceExcelImport: ${imported}/${rows.length} row(s) imported, ${errors.length} skipped`
  )

  return { format: 'rows', total: rows.length, imported, skipped: errors.length, errors }
}

/** Build the blank template workbook offered next to the upload button. */
function buildTemplateWorkbook() {
  const today = new Date()
  const sample = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`

  const rows = [
    {
      'Employee Code': 'MIPL92',
      Date: sample,
      'Check In': '09:30',
      'Check Out': '18:30',
      Status: 'Present',
    },
  ]

  const sheet = XLSX.utils.json_to_sheet(rows)
  sheet['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Attendance')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

module.exports = {
  importAttendanceWorkbook,
  buildTemplateWorkbook,
  importMatrixWorkbook,
  // exported for tests
  parseDateCell,
  parseTimeCell,
  parseWorkbook,
  parseMatrixSheet,
}
