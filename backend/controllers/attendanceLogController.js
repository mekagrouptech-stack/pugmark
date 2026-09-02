const { sequelize } = require('../config/database')
const logger = require('../utils/logger')

/**
 * Read API over the raw biometric punches captured from the eSSL terminal.
 * Kept separate from attendanceController (which owns the GPS/app punch flow).
 */
class AttendanceLogController {
  /**
   * GET /api/attendance?date=YYYY-MM-DD&pin=<optional>
   *
   * Punches for a single day joined to the employee record. The join is on
   * users.device_pin (the terminal only knows the PIN); employees whose
   * device_pin is not yet populated still show up, with a null name.
   *
   * Punch direction is DERIVED, not taken from the device: for each employee on
   * the day, the FIRST punch is the check-in and the LAST punch is the
   * check-out; anything between the two is an intermediate swipe. eSSL/eBioServer
   * terminals report status=0 ("Check In") for every punch unless in/out keys are
   * pressed, so the raw status is unreliable — it is still returned as
   * `deviceStatus` for reference. This mirrors the rule the biometric →
   * attendance_records sync applies, so this page and every attendance table
   * agree.
   */
  async getDeviceLogs(req, res, next) {
    try {
      const { date, pin } = req.query

      // Default to today (server local date) when no date is supplied.
      const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Date().toISOString().slice(0, 10)

      const where = ['DATE(al.punch_time) = ?']
      const replacements = [day]
      if (pin) {
        where.push('al.device_pin = ?')
        replacements.push(String(pin))
      }

      // Ascending so first/last per employee can be derived in one pass. The row
      // cap is generous enough to hold a full day for a large site; truncating
      // would misidentify the last punch of the day.
      const [rows] = await sequelize.query(
        `SELECT
           al.id,
           al.device_serial   AS deviceSerial,
           al.device_pin      AS devicePin,
           al.punch_time      AS punchTime,
           al.status,
           al.verify_mode     AS verifyMode,
           u.id               AS userId,
           u.name             AS employeeName,
           u.employee_code    AS employeeCode,
           u.department       AS department
         FROM attendance_logs al
         LEFT JOIN users u ON (u.device_pin = al.device_pin OR u.employee_code = al.device_pin)
         WHERE ${where.join(' AND ')}
         ORDER BY al.punch_time ASC, al.id ASC
         LIMIT 5000`,
        { replacements }
      )

      const enriched = decoratePunchDirection(rows)

      // Newest punch first for display.
      enriched.reverse()

      res.status(200).json({
        success: true,
        message: 'Biometric attendance logs retrieved',
        data: enriched,
      })
    } catch (error) {
      logger.error('Error in getDeviceLogs:', error)
      next(error)
    }
  }
}

/**
 * Tag each punch of a single day with its derived direction.
 *
 * Grouping key is the mapped user when the PIN resolves to an employee, and the
 * raw PIN otherwise, so unmapped terminals still get sensible first/last tags.
 *
 * @param {Array<Object>} rows punches for one day, ordered oldest → newest
 * @returns {Array<Object>} same rows plus punchType/isFirstPunch/isLastPunch/punchIndex
 */
function decoratePunchDirection(rows) {
  const byEmployee = new Map()

  rows.forEach((row) => {
    const key = row.userId != null ? `u:${row.userId}` : `p:${row.devicePin}`
    if (!byEmployee.has(key)) byEmployee.set(key, [])
    byEmployee.get(key).push(row)
  })

  byEmployee.forEach((punches) => {
    const lastIndex = punches.length - 1
    punches.forEach((row, index) => {
      const isFirst = index === 0
      // A lone punch for the day is a check-in with no check-out yet.
      const isLast = index === lastIndex && lastIndex > 0

      row.deviceStatus = row.status
      row.punchIndex = index + 1
      row.punchCount = punches.length
      row.isFirstPunch = isFirst
      row.isLastPunch = isLast
      row.punchType = isFirst ? 'IN' : isLast ? 'OUT' : 'MID'
    })
  })

  return rows
}

module.exports = new AttendanceLogController()
module.exports.decoratePunchDirection = decoratePunchDirection
