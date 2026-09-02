/**
 * Bulk monthly attendance.
 *
 * Fills a whole calendar month for a set of employees in one action, and builds
 * the matching monthly matrix workbook (employees down, days across) so the same
 * month can instead be filled offline in Excel and brought back through Import.
 *
 * The two halves are deliberately the same shape as the HO/UAE/Dahej monthly
 * report the company already produces — one row per employee, one column per
 * day, cells holding a status code — so a filled template re-imports without
 * anyone having to reshape it.
 *
 * Written rows use source='import' and carry an explicit `status`, exactly like
 * the spreadsheet importer, which means:
 *   - re-running a month replaces its own rows rather than duplicating them,
 *   - a real punch or a manual correction is never overwritten,
 *   - the day renders with its status and no invented check-in time.
 */

const XLSX = require('xlsx')
const moment = require('moment-timezone')
const { Op } = require('sequelize')
const { User, AttendanceRecord, Office, UserOffice, sequelize } = require('../models')
const { holidaysForYear } = require('../utils/holidays')
const logger = require('../utils/logger')

const IST = 'Asia/Kolkata'

// Codes this tool writes. Kept aligned with the importer's ATTENDANCE_CODES so
// a bulk fill and an imported sheet cannot disagree about what a day means.
const STATUS_CODES = {
  P: 'Present',
  WOF: 'Week Off',
  A: 'Absent',
  HD: 'Half Day',
  H: 'Holiday',
}

/** Every YYYY-MM-DD in the given month. */
function daysInMonth(month) {
  const start = moment.tz(month, 'YYYY-MM', IST).startOf('month')
  if (!start.isValid()) return []
  const end = start.clone().endOf('month')
  const out = []
  const cursor = start.clone()
  while (cursor.isSameOrBefore(end, 'day')) {
    out.push(cursor.format('YYYY-MM-DD'))
    cursor.add(1, 'day')
  }
  return out
}

/**
 * Decide a day's status from the rules the caller supplied.
 *
 * Order matters: a company holiday outranks a weekly off, which outranks the
 * ordinary working-day status. Without that precedence a holiday landing on a
 * Sunday would silently be recorded as a plain week off.
 */
function statusForDay(dateStr, { weekOffDays, workingStatus, markHolidays, holidaySet }) {
  if (markHolidays && holidaySet.has(dateStr)) return 'H'
  const weekday = moment.tz(dateStr, 'YYYY-MM-DD', IST).day() // 0 = Sunday
  if (weekOffDays.includes(weekday)) return 'WOF'
  return workingStatus
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

/** Load the employees a bulk action applies to. */
async function loadTargets(userIds) {
  const where = { isActive: true }
  if (Array.isArray(userIds) && userIds.length > 0) where.id = { [Op.in]: userIds }
  return User.findAll({
    where,
    attributes: ['id', 'name', 'employeeCode', 'department'],
    order: [['name', 'ASC']],
  })
}

/**
 * Fill a month for a set of employees.
 *
 * @param {Object}   opts
 * @param {string}   opts.month           'YYYY-MM'
 * @param {number[]} [opts.userIds]       employees to fill; empty/omitted = all active
 * @param {number[]} [opts.weekOffDays]   weekday numbers that are weekly offs (0 = Sunday)
 * @param {string}   [opts.workingStatus] code for ordinary working days (default 'P')
 * @param {boolean}  [opts.markHolidays]  write 'H' on company holidays
 * @param {boolean}  [opts.skipFuture]    stop at today rather than filling the rest of the month
 * @param {boolean}  [opts.preserveExisting] leave days that already have any record alone
 */
async function fillMonth(opts) {
  const {
    month,
    userIds = [],
    weekOffDays = [0],
    workingStatus = 'P',
    markHolidays = true,
    skipFuture = true,
    preserveExisting = true,
  } = opts || {}

  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) {
    const err = new Error('A month in YYYY-MM format is required.')
    err.statusCode = 400
    throw err
  }
  if (!STATUS_CODES[workingStatus]) {
    const err = new Error(`Unknown status code "${workingStatus}".`)
    err.statusCode = 400
    throw err
  }

  let days = daysInMonth(month)
  if (days.length === 0) {
    const err = new Error(`"${month}" is not a valid month.`)
    err.statusCode = 400
    throw err
  }

  // Filling tomorrow's attendance asserts something nobody knows yet, so the
  // default stops at today. A month wholly in the past is unaffected.
  if (skipFuture) {
    const today = moment.tz(IST).format('YYYY-MM-DD')
    days = days.filter((d) => d <= today)
    if (days.length === 0) {
      return {
        month,
        employees: 0,
        days: 0,
        written: 0,
        preserved: 0,
        byStatus: {},
        message: 'That month is entirely in the future — nothing to fill.',
      }
    }
  }

  const users = await loadTargets(userIds)
  if (users.length === 0) {
    const err = new Error('No matching active employees.')
    err.statusCode = 400
    throw err
  }

  const year = Number.parseInt(month.slice(0, 4), 10)
  const holidaySet = new Set(
    markHolidays ? holidaysForYear(year).map((h) => moment(h.date).format('YYYY-MM-DD')) : []
  )

  const monthStart = moment.tz(month, 'YYYY-MM', IST).startOf('month').utc().toDate()
  const monthEnd = moment.tz(month, 'YYYY-MM', IST).endOf('month').utc().toDate()

  // One query for the whole month's existing rows: with 65 employees × 31 days
  // a per-day existence check would be two thousand round trips.
  const existing = await AttendanceRecord.findAll({
    where: {
      userId: { [Op.in]: users.map((u) => u.id) },
      createdAt: { [Op.gte]: monthStart, [Op.lte]: monthEnd },
    },
    attributes: ['id', 'userId', 'createdAt', 'checkInTime', 'checkOutTime', 'source'],
    raw: true,
  })

  // A day counts as "already attended" only when it holds something this tool
  // did not write. Its own previous output must be replaceable, or re-running a
  // month with corrected settings would be a no-op.
  const occupied = new Set()
  existing.forEach((r) => {
    if (r.source === 'import') return
    const key = `${r.userId}:${moment.utc(r.createdAt).tz(IST).format('YYYY-MM-DD')}`
    occupied.add(key)
  })

  const resolveOffice = await officeResolver()
  const byStatus = {}
  const rows = []
  let preserved = 0

  for (const user of users) {
    const officeId = await resolveOffice(user.id)
    if (!officeId) continue

    for (const date of days) {
      if (preserveExisting && occupied.has(`${user.id}:${date}`)) {
        preserved += 1
        continue
      }

      const code = statusForDay(date, { weekOffDays, workingStatus, markHolidays, holidaySet })
      // Midday IST: far enough from either midnight that no timezone rounding
      // can push the row onto the neighbouring day.
      const anchor = moment.tz(`${date} 12:00:00`, 'YYYY-MM-DD HH:mm:ss', IST).utc().toDate()

      rows.push({
        userId: user.id,
        officeId,
        punchType: 'IN',
        isWithinRadius: true,
        status: code,
        source: 'import',
        remark: `Bulk fill ${month}`,
        createdAt: anchor,
        updatedAt: anchor,
      })
      byStatus[code] = (byStatus[code] || 0) + 1
    }
  }

  // One transaction: a half-filled month is worse than a failed one, because
  // nothing on screen would say which days made it.
  const t = await sequelize.transaction()
  try {
    await AttendanceRecord.destroy({
      where: {
        userId: { [Op.in]: users.map((u) => u.id) },
        source: 'import',
        createdAt: { [Op.gte]: monthStart, [Op.lte]: monthEnd },
      },
      transaction: t,
    })

    // Chunked so a 65 × 31 fill does not build one enormous INSERT statement.
    for (let i = 0; i < rows.length; i += 500) {
      await AttendanceRecord.bulkCreate(rows.slice(i, i + 500), {
        transaction: t,
        silent: true,
      })
    }
    await t.commit()
  } catch (e) {
    await t.rollback()
    logger.error(`bulkAttendance: fillMonth ${month} failed: ${e.message}`)
    throw e
  }

  logger.info(
    `bulkAttendance: filled ${rows.length} day(s) for ${users.length} employee(s) in ${month}`
  )

  return {
    month,
    employees: users.length,
    days: days.length,
    written: rows.length,
    preserved,
    byStatus,
  }
}

/**
 * Build the monthly matrix workbook for a month.
 *
 * Two uses, which is why the pre-fill is optional: blank, it is a form for HR to
 * complete offline; pre-filled, it is a starting point where only the exceptions
 * need changing. Either way the sheet round-trips back through Import.
 */
async function buildMonthlyTemplate(opts) {
  const {
    month,
    userIds = [],
    weekOffDays = [0],
    prefillStatus = null,
    markHolidays = true,
  } = opts || {}

  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) {
    const err = new Error('A month in YYYY-MM format is required.')
    err.statusCode = 400
    throw err
  }

  const days = daysInMonth(month)
  const users = await loadTargets(userIds)
  const year = Number.parseInt(month.slice(0, 4), 10)
  const holidaySet = new Set(
    markHolidays ? holidaysForYear(year).map((h) => moment(h.date).format('YYYY-MM-DD')) : []
  )

  // Headers match the company's own report so the importer's content-based
  // column detection recognises it without special-casing.
  const header = ['Sr.No', 'Employee Username', 'Employee', 'Designation']
  days.forEach((d) => header.push(moment.tz(d, 'YYYY-MM-DD', IST).format('DD-MM-YYYY')))

  const aoa = [header]
  users.forEach((user, index) => {
    const row = [
      index + 1,
      user.employeeCode || '',
      user.name || '',
      user.department || '',
    ]
    days.forEach((date) => {
      if (!prefillStatus) {
        // Even a blank sheet marks the non-working days: they are the same for
        // everyone and re-typing them 31 times per employee is pure toil.
        const weekday = moment.tz(date, 'YYYY-MM-DD', IST).day()
        if (markHolidays && holidaySet.has(date)) row.push('H')
        else if (weekOffDays.includes(weekday)) row.push('WOF')
        else row.push('')
        return
      }
      row.push(
        statusForDay(date, {
          weekOffDays,
          workingStatus: prefillStatus,
          markHolidays,
          holidaySet,
        })
      )
    })
    aoa.push(row)
  })

  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  sheet['!cols'] = [
    { wch: 7 },
    { wch: 18 },
    { wch: 28 },
    { wch: 26 },
    ...days.map(() => ({ wch: 6 })),
  ]
  // Freeze the identity columns and the header, or scrolling to the 28th loses
  // track of whose row you are on.
  sheet['!freeze'] = { xSplit: 4, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, moment.tz(month, 'YYYY-MM', IST).format('MMM YYYY'))

  // A legend sheet: the codes are not self-evident and the importer rejects
  // anything it does not recognise, so they belong in the file itself.
  const legend = XLSX.utils.aoa_to_sheet([
    ['Code', 'Meaning', 'Imported?'],
    ['P', 'Present', 'Yes'],
    ['WOF', 'Week Off', 'Yes'],
    ['A', 'Absent', 'Yes'],
    ['HD', 'Half Day', 'Yes'],
    ['H', 'Holiday', 'Yes'],
    ['', '', ''],
    ['EL', 'Earned Leave', 'No — leave is not imported'],
    ['HEL', 'Half Earned Leave', 'No — leave is not imported'],
    ['CO', 'Comp Off', 'No — leave is not imported'],
    ['LWP', 'Leave Without Pay', 'No — leave is not imported'],
    ['HLWP', 'Half Leave Without Pay', 'No — leave is not imported'],
  ])
  legend['!cols'] = [{ wch: 8 }, { wch: 26 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, legend, 'Legend')

  return {
    buffer: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }),
    employees: users.length,
    days: days.length,
  }
}


/**
 * Export a month's ACTUAL attendance as the same matrix the company's own
 * report uses — employees down, days across, plus per-code totals.
 *
 * This is the counterpart to buildMonthlyTemplate: the template is a blank (or
 * pre-filled) form, this is what the system currently holds. The two share a
 * layout on purpose, so an exported month can be corrected in Excel and brought
 * straight back through Import without reshaping anything.
 *
 * A day's code comes from whichever source is most authoritative:
 *   1. an explicit status  — a bulk fill or an imported report said so;
 *   2. a real punch        — P, or L when the check-in is after the late cutoff;
 *   3. nothing at all      — left blank rather than asserted as Absent, because
 *      "no record" and "confirmed absent" are genuinely different claims and
 *      only the person closing the month can tell them apart.
 */
async function exportMonth(opts) {
  const { month, userIds = [], markAbsent = false } = opts || {}

  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) {
    const err = new Error('A month in YYYY-MM format is required.')
    err.statusCode = 400
    throw err
  }

  const days = daysInMonth(month)
  const users = await loadTargets(userIds)
  if (users.length === 0) {
    const err = new Error('No matching active employees.')
    err.statusCode = 400
    throw err
  }

  const monthStart = moment.tz(month, 'YYYY-MM', IST).startOf('month').utc().toDate()
  const monthEnd = moment.tz(month, 'YYYY-MM', IST).endOf('month').utc().toDate()

  const records = await AttendanceRecord.findAll({
    where: {
      userId: { [Op.in]: users.map((u) => u.id) },
      createdAt: { [Op.gte]: monthStart, [Op.lte]: monthEnd },
    },
    attributes: ['userId', 'status', 'checkInTime', 'checkOutTime', 'createdAt', 'punchType'],
    raw: true,
  })

  // userId -> date -> code. Built in one pass; an explicit status always wins
  // over a code derived from a punch, whatever order the rows arrive in.
  const grid = new Map()
  const setCode = (userId, date, code, authoritative) => {
    if (!grid.has(userId)) grid.set(userId, new Map())
    const dayMap = grid.get(userId)
    const existing = dayMap.get(date)
    if (existing && existing.authoritative && !authoritative) return
    dayMap.set(date, { code, authoritative })
  }

  records.forEach((r) => {
    const anchor = r.checkInTime || r.checkOutTime || r.createdAt
    const date = moment.utc(anchor).tz(IST).format('YYYY-MM-DD')

    if (r.status) {
      setCode(r.userId, date, r.status, true)
      return
    }
    if (r.checkInTime) {
      const inIst = moment.utc(r.checkInTime).tz(IST)
      const cutoff = inIst.clone().hour(10).minute(15).second(0).millisecond(0)
      setCode(r.userId, date, inIst.isAfter(cutoff) ? 'L' : 'P', false)
      return
    }
    // An OUT-only row still evidences a worked day.
    if (r.checkOutTime) setCode(r.userId, date, 'P', false)
  })

  // Totals worth having on the sheet — the company's own report carries a
  // similar tail, and a month is hard to sanity-check without it.
  const totalCodes = ['P', 'L', 'WOF', 'H', 'HD', 'A']

  const header = ['Sr.No', 'Employee Username', 'Employee', 'Designation']
  days.forEach((d) => header.push(moment.tz(d, 'YYYY-MM-DD', IST).format('DD-MM-YYYY')))
  totalCodes.forEach((c) => header.push(c))
  header.push('Recorded Days')

  const aoa = [header]
  users.forEach((user, index) => {
    const dayMap = grid.get(user.id) || new Map()
    const row = [index + 1, user.employeeCode || '', user.name || '', user.department || '']
    const tally = {}
    let recorded = 0

    days.forEach((date) => {
      const entry = dayMap.get(date)
      const code = entry ? entry.code : markAbsent ? 'A' : ''
      row.push(code)
      if (code) {
        tally[code] = (tally[code] || 0) + 1
        recorded += 1
      }
    })

    totalCodes.forEach((c) => row.push(tally[c] || 0))
    row.push(recorded)
    aoa.push(row)
  })

  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  sheet['!cols'] = [
    { wch: 7 },
    { wch: 18 },
    { wch: 28 },
    { wch: 26 },
    ...days.map(() => ({ wch: 6 })),
    ...totalCodes.map(() => ({ wch: 6 })),
    { wch: 15 },
  ]
  sheet['!freeze'] = { xSplit: 4, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, moment.tz(month, 'YYYY-MM', IST).format('MMM YYYY'))

  const legend = XLSX.utils.aoa_to_sheet([
    ['Code', 'Meaning'],
    ['P', 'Present'],
    ['L', 'Late (checked in after 10:15)'],
    ['WOF', 'Week Off'],
    ['H', 'Holiday'],
    ['HD', 'Half Day'],
    ['A', 'Absent'],
    ['(blank)', 'No record for that day'],
    ['', ''],
    ['Note', 'Edit this sheet and re-import it to correct the month.'],
  ])
  legend['!cols'] = [{ wch: 10 }, { wch: 46 }]
  XLSX.utils.book_append_sheet(wb, legend, 'Legend')

  return {
    buffer: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }),
    employees: users.length,
    days: days.length,
  }
}

module.exports = {
  fillMonth,
  buildMonthlyTemplate,
  exportMonth,
  STATUS_CODES,
  // exported for tests
  daysInMonth,
  statusForDay,
}
