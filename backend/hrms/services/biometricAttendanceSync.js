/**
 * Biometric Attendance Sync
 *
 * Bridges raw biometric device punches (attendance_logs, pushed by the eSSL
 * terminal via /iclock) into attendance_records, which is the single source
 * of truth read by "today's status", records, reports, and payroll.
 *
 * Rule: for a given user on a given IST day, the FIRST device punch is the
 * check-in (punchType 'IN') and the LAST device punch is the check-out
 * (punchType 'OUT'). A single punch produces just an IN row.
 *
 * Records written here are tagged source='biometric' so re-running the sync is
 * idempotent (previous biometric rows for the day are replaced) and never
 * touches manually-entered rows (source='manual', the admin fallback).
 *
 * Device punches join to a user via users.device_pin (or employee_code, which
 * some deployments enroll as the device PIN).
 */

const { Op } = require('sequelize')
const moment = require('moment-timezone')
const {
  AttendanceRecord,
  AttendanceLog,
  User,
  Office,
  UserOffice,
  sequelize,
} = require('../models')
const logger = require('../utils/logger')

const IST = 'Asia/Kolkata'

/** Resolve an officeId for a user (attendance_records.office_id is NOT NULL). */
async function resolveOfficeId(userId) {
  try {
    const uo = await UserOffice.findOne({
      where: { userId },
      attributes: ['officeId'],
    })
    if (uo && uo.officeId) return uo.officeId
  } catch (e) {
    logger.warn(`biometricSync: user office lookup failed for user ${userId}: ${e.message}`)
  }
  const office = await Office.findOne({ attributes: ['id'], order: [['id', 'ASC']] })
  return office ? office.id : null
}

/**
 * UTC instant bounds for an IST calendar day. attendance_records timestamps are
 * stored as UTC (the app's toIST() reads them back as moment.utc(...).tz(IST)),
 * so idempotency deletes must scope by these UTC bounds.
 */
function istDayUtcBounds(dateStr) {
  const start = moment.tz(dateStr, 'YYYY-MM-DD', IST).startOf('day').utc().toDate()
  const end = moment.tz(dateStr, 'YYYY-MM-DD', IST).endOf('day').utc().toDate()
  return { start, end }
}

/**
 * Convert a biometric punch timestamp — stored verbatim as IST wall-clock in
 * attendance_logs.punch_time (dateStrings:true → 'YYYY-MM-DD HH:mm:ss') — into a
 * real UTC Date suitable for attendance_records.check_in_time/check_out_time.
 */
function istWallClockToUtc(value) {
  return moment.tz(String(value), 'YYYY-MM-DD HH:mm:ss', IST).utc().toDate()
}

/**
 * Materialize one user's biometric punches for one IST day into
 * attendance_records. Returns a small summary or null when there is nothing
 * to sync.
 *
 * @param {{id:number, devicePin?:string, employeeCode?:string}} user
 * @param {string} dateStr YYYY-MM-DD (IST)
 */
async function syncUserDay(user, dateStr) {
  const pins = [user.devicePin, user.employeeCode].filter(Boolean)
  if (pins.length === 0) return null

  // punch_time is verbatim IST wall-clock, so match the IST calendar day directly
  // with DATE(punch_time) — no timezone conversion on the query side.
  const logs = await AttendanceLog.findAll({
    where: {
      devicePin: { [Op.in]: pins.map(String) },
      [Op.and]: sequelize.where(
        sequelize.fn('DATE', sequelize.col('punch_time')),
        dateStr
      ),
    },
    order: [['punchTime', 'ASC']],
  })
  if (logs.length === 0) return null

  const firstTime = istWallClockToUtc(logs[0].punchTime)
  const lastTime = istWallClockToUtc(logs[logs.length - 1].punchTime)
  const hasOut = lastTime.getTime() > firstTime.getTime()
  const { start, end } = istDayUtcBounds(dateStr)

  const officeId = await resolveOfficeId(user.id)
  if (!officeId) {
    logger.warn(`biometricSync: no office resolvable for user ${user.id}; skipping ${dateStr}`)
    return null
  }

  const t = await sequelize.transaction()
  try {
    // Idempotent: drop prior biometric rows for this user/day, keep manual rows.
    await AttendanceRecord.destroy({
      where: {
        userId: user.id,
        source: 'biometric',
        createdAt: { [Op.gte]: start, [Op.lte]: end },
      },
      transaction: t,
    })

    const rows = [
      {
        userId: user.id,
        officeId,
        punchType: 'IN',
        checkInTime: firstTime,
        createdAt: firstTime,
        updatedAt: firstTime,
        isWithinRadius: true,
        remark: 'Biometric device',
        source: 'biometric',
      },
    ]

    if (hasOut) {
      const totalHours =
        Math.round(((lastTime.getTime() - firstTime.getTime()) / 3600000) * 100) / 100
      rows.push({
        userId: user.id,
        officeId,
        punchType: 'OUT',
        checkOutTime: lastTime,
        createdAt: lastTime,
        updatedAt: lastTime,
        isWithinRadius: true,
        remark: 'Biometric device',
        source: 'biometric',
        totalHours,
      })
    }

    await AttendanceRecord.bulkCreate(rows, { transaction: t, silent: true })
    await t.commit()

    return {
      userId: user.id,
      date: dateStr,
      checkIn: firstTime,
      checkOut: hasOut ? lastTime : null,
      punches: logs.length,
    }
  } catch (err) {
    await t.rollback()
    logger.error(`biometricSync: failed for user ${user.id} on ${dateStr}: ${err.message}`)
    throw err
  }
}

/** Sync one user (by id) for one IST day. Loads the user's device identifiers. */
async function syncUserDayById(userId, dateStr) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'devicePin', 'employeeCode'],
  })
  if (!user) return null
  return syncUserDay(user.get({ plain: true }), dateStr)
}

/** Sync one user across an inclusive IST date range (capped to 92 days). */
async function syncUserRange(userId, startStr, endStr) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'devicePin', 'employeeCode'],
  })
  if (!user) return { synced: 0 }
  const plain = user.get({ plain: true })

  let cursor = moment.tz(startStr, 'YYYY-MM-DD', IST).startOf('day')
  const last = moment.tz(endStr, 'YYYY-MM-DD', IST).startOf('day')
  let guard = 0
  let synced = 0
  while (cursor.isSameOrBefore(last) && guard < 92) {
    const dateStr = cursor.format('YYYY-MM-DD')
    try {
      const res = await syncUserDay(plain, dateStr)
      if (res) synced += 1
    } catch {
      /* individual day failures are logged in syncUserDay; keep going */
    }
    cursor = cursor.add(1, 'day')
    guard += 1
  }
  return { synced }
}

/**
 * Sync every user that has biometric punches on the given IST day. Used by the
 * nightly cron and before payroll runs.
 */
async function syncAllForDate(dateStr) {
  // Distinct device PINs that punched that IST day.
  const pins = await AttendanceLog.findAll({
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('device_pin')), 'devicePin']],
    where: sequelize.where(sequelize.fn('DATE', sequelize.col('punch_time')), dateStr),
    raw: true,
  })
  const pinList = pins.map((p) => p.devicePin).filter(Boolean).map(String)
  if (pinList.length === 0) return { users: 0 }

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { devicePin: { [Op.in]: pinList } },
        { employeeCode: { [Op.in]: pinList } },
      ],
    },
    attributes: ['id', 'devicePin', 'employeeCode'],
  })

  let count = 0
  let failed = 0
  let lastError = null
  for (const u of users) {
    try {
      const res = await syncUserDay(u.get({ plain: true }), dateStr)
      if (res) count += 1
    } catch (e) {
      // Per-user failures must not abort the whole day, but they must not
      // vanish either: a schema drift (a missing column, say) fails identically
      // for every user and would otherwise read as "nobody punched", which is
      // indistinguishable from a genuinely empty day.
      failed += 1
      lastError = e.message
    }
  }
  if (failed > 0) {
    logger.error(
      `biometricSync: ${dateStr} — ${failed}/${users.length} user(s) failed to sync. Last error: ${lastError}`
    )
  }
  return { users: count, failed, lastError }
}

/**
 * Sync every user that punched on any IST day in an inclusive range. Used by the
 * team/report endpoints and after a device import, so all attendance tables show
 * the first punch as check-in and the last punch as check-out without waiting
 * for the nightly cron.
 */
async function syncAllForRange(startStr, endStr) {
  let cursor = moment.tz(startStr, 'YYYY-MM-DD', IST).startOf('day')
  const last = moment.tz(endStr, 'YYYY-MM-DD', IST).startOf('day')
  let guard = 0
  let days = 0
  let users = 0
  let failed = 0
  let lastError = null
  while (cursor.isSameOrBefore(last) && guard < 92) {
    try {
      const res = await syncAllForDate(cursor.format('YYYY-MM-DD'))
      if (res && res.users > 0) {
        days += 1
        users += res.users
      }
      if (res && res.failed > 0) {
        failed += res.failed
        lastError = res.lastError
      }
    } catch (e) {
      logger.warn(`biometricSync: range day ${cursor.format('YYYY-MM-DD')} failed: ${e.message}`)
    }
    cursor = cursor.add(1, 'day')
    guard += 1
  }
  return { days, users, failed, lastError }
}

/**
 * Materialize exactly the IST days a batch of just-stored punches touched.
 *
 * Every writer into attendance_logs (the /iclock push, the CSV importer, the
 * eBioServer SOAP poller, the webhook) calls this immediately after its INSERT,
 * so a punch becomes an IN/OUT row in attendance_records within the same tick
 * instead of waiting for the nightly cron.
 *
 * Days are taken from the punch timestamps themselves rather than from "today",
 * because a CSV drop or a device that was offline for a week carries backdated
 * punches that a today-only sync would silently miss.
 *
 * Never rejects: attendance_records is a derived table and the nightly sync
 * rebuilds it, so a failure here must not fail the import that produced the
 * punches. Callers with no client waiting can await it for accurate logging;
 * callers holding a device connection open should not.
 *
 * @param {Array<string|Date>} punchTimes 'YYYY-MM-DD HH:mm:ss' IST wall-clock
 * @param {string} tag caller name, for log context
 * @returns {Promise<{days:number, users:number}>}
 */
async function materializeDays(punchTimes, tag = 'sync') {
  const days = [
    ...new Set(
      (punchTimes || [])
        .map((t) => String(t ?? '').slice(0, 10))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    ),
  ]
  if (days.length === 0) return { days: 0, users: 0 }

  // Sequential, not Promise.all: syncAllForDate deletes and re-inserts a day's
  // biometric rows per user, and two overlapping days would otherwise contend
  // for the same rows. Batches are a handful of days at most.
  let users = 0
  for (const day of days) {
    try {
      const res = await syncAllForDate(day)
      users += res?.users ?? 0
    } catch (e) {
      logger.warn(`[${tag}] materialize ${day} failed: ${e.message}`)
    }
  }
  logger.info(`[${tag}] materialized ${users} user-day(s) across ${days.join(', ')}`)
  return { days: days.length, users }
}

module.exports = {
  syncUserDay,
  syncUserDayById,
  syncUserRange,
  syncAllForDate,
  syncAllForRange,
  materializeDays,
}
