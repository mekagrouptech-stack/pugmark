const attendanceService = require('../services/attendanceService')
const officeService = require('../services/officeService')
const biometricSync = require('../services/biometricAttendanceSync')
const attendanceExcelImporter = require('../services/attendanceExcelImporter')
const bulkAttendanceService = require('../services/bulkAttendanceService')
const attendancePasteService = require('../services/attendancePasteService')
const { EXPLICIT_STATUS_LABELS } = require('../services/attendanceService')
const { BadRequestError } = require('../utils/errors')
const logger = require('../utils/logger')
const { AttendanceRecord, User } = require('../models')
const { Op } = require('sequelize')
const { istStartOfDay, istEndOfDay, toIST } = require('../utils/timeUtils')
const { teamUserIdsFor } = require('../utils/teamScope')

// Office start time (IST). A first punch after this is a late mark — kept in one
// place so the team tables, My Attendance and List Late Mark cannot drift apart.
const LATE_AFTER_HOUR = 10
const LATE_AFTER_MINUTE = 15

/** Milliseconds → "1 hour 5 minutes" / "16 minutes", matching the late-mark table. */
function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}

/**
 * Attendance Controller
 * Handles HTTP requests for attendance operations
 */
class AttendanceController {
  /**
   * Handle attendance punch request
   * POST /api/attendance/punch
   */
  async punchAttendance(req, res, next) {
    try {
      const { officeId, latitude, longitude, punchType, remark, accuracy, targetUserId } = req.body

      // Determine which user the punch is for
      const requesterRole = (req.user.role || '').toUpperCase()
      const isAdminOrManager =
        requesterRole === 'ADMIN' || requesterRole === 'MANAGER' || requesterRole === 'HR' || requesterRole === 'HEAD_HR'

      // If admin/manager/HR and targetUserId provided, punch for that employee; otherwise for self
      const userId = isAdminOrManager && targetUserId ? targetUserId : req.user.id
      const canOverride = req.canOverride || false

      // Get client IP and user agent
      const ipAddress = req.ip || req.connection.remoteAddress
      const userAgent = req.get('user-agent')

      // Process punch
      const result = await attendanceService.processPunch({
        userId,
        officeId,
        latitude,
        longitude,
        punchType,
        remark,
        canOverride,
        accuracy,
        ipAddress,
        userAgent,
      })

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get today's attendance for current user
   * GET /api/attendance/today
   */
  async getTodayAttendance(req, res, next) {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId) : req.user.id
      
      // Check if admin/HR is requesting another user's attendance
      const requesterRole = (req.user.role || '').toUpperCase()
      const isAdminOrManager =
        requesterRole === 'ADMIN' || requesterRole === 'MANAGER' || requesterRole === 'HR' || requesterRole === 'HEAD_HR'
      
      // Only allow viewing other users if requester is admin/manager/HR
      const targetUserId = isAdminOrManager && req.query.userId ? parseInt(req.query.userId) : req.user.id

      // Get today's date range in IST
      const todayStart = istStartOfDay(new Date()).toDate()
      const todayEnd = istEndOfDay(new Date()).toDate()

      // Materialize today's biometric punches (first=IN / last=OUT) before reading,
      // so today's status reflects the latest device data. Non-fatal on failure.
      try {
        const todayStr = toIST(new Date()).format('YYYY-MM-DD')
        await biometricSync.syncUserDayById(targetUserId, todayStr)
      } catch (e) {
        logger.warn('getTodayAttendance biometric sync skipped:', e.message)
      }

      // Get today's attendance records
      const records = await AttendanceRecord.findAll({
        where: {
          userId: targetUserId,
          [Op.or]: [
            {
              createdAt: {
                [Op.gte]: todayStart,
                [Op.lt]: todayEnd,
              },
            },
            {
              checkInTime: {
                [Op.gte]: todayStart,
                [Op.lt]: todayEnd,
              },
            },
            {
              checkOutTime: {
                [Op.gte]: todayStart,
                [Op.lt]: todayEnd,
              },
            },
          ],
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode'],
          },
        ],
        order: [['createdAt', 'ASC']],
      })

      if (records.length === 0) {
        // No punches today → mark as Absent for the current date (IST)
        const todayStr = toIST(new Date()).format('YYYY-MM-DD')
        const absentRecord = {
          id: `date-${todayStr}`,
          date: todayStr,
          officeId: null,
          officeName: null,
          checkIn: null,
          checkOut: null,
          checkInLocation: null,
          checkOutLocation: null,
          status: 'Absent',
          totalHours: null,
          isLate: false,
        }

        return res.status(200).json({
          success: true,
          message: 'No punches for today. Marked as Absent.',
          data: absentRecord,
        })
      }

      // Format the attendance record
      const formatted = await attendanceService.formatAttendanceRecords(records)
      const todayRecord = formatted[0] || null

      res.status(200).json({
        success: true,
        message: 'Today\'s attendance retrieved successfully',
        data: todayRecord,
      })
    } catch (error) {
      logger.error('Error in getTodayAttendance:', error)
      next(error)
    }
  }

  /**
   * Get user's attendance records with pagination
   * GET /api/attendance/records
   * Query params: startDate, endDate, officeId, page, limit, cursor
   */
  async getAttendanceRecords(req, res, next) {
    try {
      const userId = req.user.id
      const { startDate, endDate, officeId, page, limit, cursor } = req.query

      // Materialize biometric punches for the requested window before reading.
      // Defaults to the last 31 days when no range is supplied. Non-fatal.
      try {
        const end = endDate || toIST(new Date()).format('YYYY-MM-DD')
        const start =
          startDate || toIST(new Date()).subtract(31, 'days').format('YYYY-MM-DD')
        await biometricSync.syncUserRange(userId, start, end)
      } catch (e) {
        logger.warn('getAttendanceRecords biometric sync skipped:', e.message)
      }

      const result = await attendanceService.getUserAttendanceRecords(userId, {
        startDate,
        endDate,
        officeId: officeId ? parseInt(officeId) : undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        cursor,
      })

      res.status(200).json({
        success: true,
        message: 'Attendance records retrieved successfully',
        data: result.data,
        pagination: result.pagination,
        counts: result.counts,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get attendance record by ID with location details
   * GET /api/attendance/records/:id
   */
  async getAttendanceRecordById(req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user.id

      // Fetch record with location data
      // Implementation depends on your database structure
      // This is a placeholder - implement based on your schema

      res.status(200).json({
        success: true,
        message: 'Attendance record retrieved successfully',
        data: {},
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update attendance record (Admin / HR / Manager only)
   * PUT /api/attendance/update
   */
  async updateAttendance(req, res, next) {
    try {
      const { userId, date, checkInTime, checkOutTime, status } = req.body

      logger.info('Update attendance request body:', JSON.stringify(req.body))
      logger.info('Update attendance request:', { userId, date, checkInTime, checkOutTime, status })

      // Ensure userId is a number
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId
      if (!userIdNum || isNaN(userIdNum)) {
        throw new BadRequestError('Valid user ID is required')
      }

      if (!date) {
        throw new BadRequestError('Date is required')
      }

      // Only admins/managers/HR can update attendance
      const requesterRole = (req.user.role || '').toUpperCase()
      const isAdminOrManager =
        requesterRole === 'ADMIN' || requesterRole === 'MANAGER' || requesterRole === 'HR' || requesterRole === 'HEAD_HR'

      if (!isAdminOrManager) {
        throw new BadRequestError('Only admins, managers, and HR can update attendance')
      }

      // Only include fields that are provided (not undefined)
      const updateData = {
        userId: userIdNum,
        date,
      }
      
      if (checkInTime !== undefined && checkInTime !== null && checkInTime !== '') {
        updateData.checkInTime = checkInTime
      }
      if (checkOutTime !== undefined && checkOutTime !== null && checkOutTime !== '') {
        updateData.checkOutTime = checkOutTime
      }
      if (status !== undefined && status !== null && status !== '') {
        updateData.status = status
      }

      const result = await attendanceService.updateAttendanceRecord(updateData)

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete attendance record (Admin / HR / Manager only)
   * DELETE /api/attendance/records/:id
   */
  async deleteAttendanceRecord(req, res, next) {
    try {
      const { id } = req.params
      const recordId = parseInt(id, 10)

      if (!recordId || isNaN(recordId)) {
        throw new BadRequestError('Valid attendance record ID is required')
      }

      const result = await attendanceService.deleteAttendanceRecord(recordId)

      res.status(200).json({
        success: true,
        message: result.message,
        data: null,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get team / all employees attendance (Admin / HR / Manager)
   * GET /api/attendance/team
   */
  async getTeamAttendance(req, res, next) {
    try {
      let { startDate, endDate } = req.query

      // Materialize biometric punches (first punch = IN, last punch = OUT) for
      // every employee who punched in the requested window, so the team tables
      // show the same in/out times as the device page. Non-fatal on failure.
      try {
        const syncEnd = endDate || toIST(new Date()).format('YYYY-MM-DD')
        const syncStart =
          startDate || toIST(new Date()).subtract(7, 'days').format('YYYY-MM-DD')
        await biometricSync.syncAllForRange(syncStart, syncEnd)
      } catch (e) {
        logger.warn('getTeamAttendance biometric sync skipped:', e.message)
      }

      const whereClause = {}

      // A reporting person's team screens cover their own reports; HR/Head HR/
      // Admin keep the company-wide view they have always had. Without this the
      // route returned every employee's attendance to any manager who could
      // reach it.
      const teamUserIds = await teamUserIdsFor(req.user)
      if (teamUserIds !== null) {
        if (teamUserIds.length === 0) {
          return res.status(200).json({
            success: true,
            message: 'Team attendance retrieved successfully',
            data: [],
          })
        }
        whereClause.userId = { [Op.in]: teamUserIds }
      }

      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate)
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          whereClause.createdAt[Op.lte] = end
        }
      } else {
        // Default: last 7 days
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 7)
        whereClause.createdAt = {
          [Op.gte]: start,
          [Op.lte]: end,
        }
      }

      const records = await AttendanceRecord.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode'],
          },
        ],
        order: [['createdAt', 'DESC']],
      })

      // Group by user + date and format similar to team attendance UI
      const grouped = {}

      records.forEach((record) => {
        // Determine the date - use checkInTime/checkOutTime if available, otherwise createdAt
        let recordDate = record.createdAt
        if (record.punchType === 'IN' && record.checkInTime) {
          recordDate = record.checkInTime
        } else if (record.punchType === 'OUT' && record.checkOutTime) {
          recordDate = record.checkOutTime
        }
        // Group on the IST calendar day — a UTC date would push punches made
        // before 05:30 IST onto the previous day.
        const date = toIST(recordDate).format('YYYY-MM-DD')
        const userId = record.userId
        const key = `${userId}-${date}`

        if (!grouped[key]) {
          grouped[key] = {
            id: record.id,
            userId,
            employeeName: record.user?.name || '',
            employeeCode: record.user?.employeeCode || '',
            date,
            checkIn: null,
            checkOut: null,
            totalHours: '0h 00m',
            lateBy: null,
            status: 'Absent',
            // Internal fields (not returned) used to compute accurate duration
            _firstInTime: null,
            _lastOutTime: null,
          }
        }

        const slot = grouped[key]

        // A day imported from a monthly report carries its status on the row and
        // has no times at all — its created_at is only a date anchor. Take the
        // status and stop: falling through to the punch branches would render
        // that anchor as a check-in, inventing a punch that never happened and
        // grading the employee Late for it.
        if (record.status && !record.checkInTime && !record.checkOutTime) {
          slot.status = EXPLICIT_STATUS_LABELS[record.status] || record.status
          slot._explicitStatus = record.status
          return
        }

        if (record.punchType === 'IN') {
          const punchTime = record.checkInTime || record.createdAt
          const punchDateIst = toIST(punchTime)
          const punchDate = punchDateIst.toDate()

          // The day's check-in is the FIRST punch, whatever order rows arrive in.
          if (!slot._firstInTime || punchDate < slot._firstInTime) {
            slot._firstInTime = punchDate
            slot.checkIn = punchDateIst.format('hh:mm A')

            // Same 10:15 AM IST threshold used by My Attendance and List Late
            // Mark, so every table agrees on who was late.
            const expectedIst = punchDateIst
              .clone()
              .hour(LATE_AFTER_HOUR)
              .minute(LATE_AFTER_MINUTE)
              .second(0)
              .millisecond(0)
            const isLate = punchDateIst.isAfter(expectedIst)
            // A real punch outranks an imported status for the same day.
            slot.status = isLate ? 'Late' : 'Present'
            slot._explicitStatus = null
            slot.lateBy = isLate
              ? formatDuration(punchDateIst.valueOf() - expectedIst.valueOf())
              : null
          }
        } else if (record.punchType === 'OUT') {
          const punchTime = record.checkOutTime || record.createdAt
          const punchDateIst = toIST(punchTime)
          const punchDate = punchDateIst.toDate()

          // The day's check-out is the LAST punch, whatever order rows arrive in.
          if (!slot._lastOutTime || punchDate > slot._lastOutTime) {
            slot._lastOutTime = punchDate
            slot.checkOut = punchDateIst.format('hh:mm A')
          }
        }
      })

      // After grouping, compute accurate total hours for each day
      const data = Object.values(grouped).map((slot) => {
        if (slot._firstInTime && slot._lastOutTime && slot._lastOutTime > slot._firstInTime) {
          const diffMs = slot._lastOutTime.getTime() - slot._firstInTime.getTime()
            const diffMinutes = Math.round(diffMs / 60000)
            const hours = Math.floor(diffMinutes / 60)
            const minutes = diffMinutes % 60
            slot.totalHours = `${hours}h ${minutes.toString().padStart(2, '0')}m`
        } else {
          slot.totalHours = slot.totalHours || '0h 00m'
        }

        // Remove internal helper fields before sending response
        delete slot._explicitStatus
        delete slot._firstInTime
        delete slot._lastOutTime
        return slot
      })

      res.status(200).json({
        success: true,
        message: 'Team attendance retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getTeamAttendance:', error)
      next(error)
    }
  }

  /**
   * Get late mark records (check-in after 10:15 AM IST = Late). Real data for List Late Mark.
   * GET /api/attendance/late-marks?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  async getLateMarks(req, res, next) {
    try {
      const currentUser = req.user
      let { startDate, endDate } = req.query

      const end = endDate ? new Date(endDate) : new Date()
      end.setHours(23, 59, 59, 999)
      const start = startDate ? new Date(startDate) : (() => {
        const s = new Date()
        s.setDate(s.getDate() - 30)
        s.setHours(0, 0, 0, 0)
        return s
      })()

      // Same definition of "team" as the members list and attendance tables —
      // HR and Head HR previously landed in the manager branch here and saw only
      // their own direct reports on this one screen.
      let userIds = await teamUserIdsFor(currentUser)
      if (userIds === null) {
        const users = await User.findAll({ where: { isActive: true }, attributes: ['id'] })
        userIds = users.map((u) => u.id)
      }
      if (!userIds || userIds.length === 0) {
        return res.status(200).json({ success: true, message: 'Late marks retrieved', data: [] })
      }

      const records = await AttendanceRecord.findAll({
        where: {
          userId: { [Op.in]: userIds },
          punchType: 'IN',
          [Op.or]: [
            { createdAt: { [Op.between]: [start, end] } },
            { checkInTime: { [Op.between]: [start, end] } },
          ],
        },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employeeCode'] }],
        order: [['checkInTime', 'ASC'], ['createdAt', 'ASC']],
      })

      const EXPECTED_HOUR = LATE_AFTER_HOUR
      const EXPECTED_MINUTE = LATE_AFTER_MINUTE
      const grouped = {}
      records.forEach((record) => {
        const punchTime = record.checkInTime || record.createdAt
        // toIST() must read the stored value directly: the driver hands back
        // 'YYYY-MM-DD HH:mm:ss' UTC strings, and new Date() would parse those as
        // server-local time, shifting every punch by the IST offset.
        const istMoment = toIST(punchTime)
        const punchDate = istMoment.toDate()
        const dateStr = istMoment.format('YYYY-MM-DD')
        const key = `${record.userId}-${dateStr}`

        if (!grouped[key]) {
          grouped[key] = {
            userId: record.userId,
            employeeName: record.user?.name || 'N/A',
            employeeCode: record.user?.employeeCode || 'N/A',
            date: dateStr,
            checkInTime: punchDate,
            checkIn: istMoment.format('hh:mm A'),
          }
        } else if (punchDate < grouped[key].checkInTime) {
          // The day's check-in is the employee's FIRST punch.
          grouped[key].checkInTime = punchDate
          grouped[key].checkIn = istMoment.format('hh:mm A')
        }
      })

      const lateMarks = []
      let idGen = 1
      Object.values(grouped).forEach((slot) => {
        const punchIst = toIST(slot.checkInTime)
        const expectedIst = punchIst.clone().hour(EXPECTED_HOUR).minute(EXPECTED_MINUTE).second(0).millisecond(0)
        if (!punchIst.isAfter(expectedIst)) return

        const diffMs = punchIst.valueOf() - expectedIst.valueOf()
        const diffMinutes = Math.round(diffMs / 60000)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        const lateByStr = hours > 0
          ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
          : `${minutes} minute${minutes !== 1 ? 's' : ''}`

        lateMarks.push({
          id: idGen++,
          employeeName: slot.employeeName,
          employeeCode: slot.employeeCode,
          date: slot.date,
          checkIn: slot.checkIn,
          expectedCheckIn: '10:15 AM',
          lateBy: lateByStr.trim(),
          status: 'Marked',
        })
      })

      lateMarks.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))

      res.status(200).json({
        success: true,
        message: 'Late marks retrieved (check-in after 10:15 AM = Late)',
        data: lateMarks,
      })
    } catch (error) {
      logger.error('Error in getLateMarks:', error)
      next(error)
    }
  }

  /**
   * Import attendance from an uploaded spreadsheet.
   * POST /api/attendance/import  (multipart/form-data, field name: "file")
   *
   * Always 200 when the file itself was readable, even if every row failed —
   * the interesting result is the per-row report, and the UI renders it either
   * way. Only an unreadable/mis-shaped file is a 400.
   */
  async importAttendanceExcel(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        throw new BadRequestError('No file uploaded. Attach a .xlsx, .xls or .csv file.')
      }

      const result = await attendanceExcelImporter.importAttendanceWorkbook(req.file.buffer)

      res.status(200).json({
        success: true,
        message: `${result.imported} of ${result.total} row(s) imported`,
        data: result,
      })
    } catch (error) {
      if (error.statusCode === 400) return next(new BadRequestError(error.message))
      logger.error('Error in importAttendanceExcel:', error)
      next(error)
    }
  }

  /**
   * Fill a whole month for a set of employees.
   * POST /api/attendance/bulk-month
   */
  async bulkFillMonth(req, res, next) {
    try {
      const result = await bulkAttendanceService.fillMonth({
        month: req.body.month,
        userIds: Array.isArray(req.body.userIds) ? req.body.userIds : [],
        weekOffDays: Array.isArray(req.body.weekOffDays) ? req.body.weekOffDays : undefined,
        workingStatus: req.body.workingStatus,
        markHolidays: req.body.markHolidays !== false,
        skipFuture: req.body.skipFuture !== false,
        preserveExisting: req.body.preserveExisting !== false,
      })

      res.status(200).json({
        success: true,
        message:
          result.message ||
          `${result.written} day(s) filled for ${result.employees} employee(s)`,
        data: result,
      })
    } catch (error) {
      if (error.statusCode === 400) return next(new BadRequestError(error.message))
      logger.error('Error in bulkFillMonth:', error)
      next(error)
    }
  }

  /**
   * Download a monthly matrix workbook (employees down, days across).
   * GET /api/attendance/monthly-template?month=YYYY-MM&prefill=P
   */
  async downloadMonthlyTemplate(req, res, next) {
    try {
      const { month, prefill } = req.query
      const weekOffDays = req.query.weekOffDays
        ? String(req.query.weekOffDays)
            .split(',')
            .map((d) => Number.parseInt(d, 10))
            .filter((d) => !Number.isNaN(d))
        : undefined

      const { buffer } = await bulkAttendanceService.buildMonthlyTemplate({
        month,
        weekOffDays,
        prefillStatus: prefill || null,
        markHolidays: req.query.markHolidays !== 'false',
      })

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance-${month}.xlsx"`
      )
      res.status(200).send(buffer)
    } catch (error) {
      if (error.statusCode === 400) return next(new BadRequestError(error.message))
      logger.error('Error in downloadMonthlyTemplate:', error)
      next(error)
    }
  }

  /**
   * Describe what a pasted block would do, without writing anything.
   * POST /api/attendance/paste-preview
   */
  async previewPaste(req, res, next) {
    try {
      const result = await attendancePasteService.preview({
        text: req.body.text,
        dates: req.body.dates,
        status: req.body.status,
      })
      res.status(200).json({ success: true, message: 'Paste analysed', data: result })
    } catch (error) {
      if (error.statusCode === 400) return next(new BadRequestError(error.message))
      logger.error('Error in previewPaste:', error)
      next(error)
    }
  }

  /**
   * Apply a pasted block.
   * POST /api/attendance/paste
   */
  async applyPaste(req, res, next) {
    try {
      const result = await attendancePasteService.apply({
        text: req.body.text,
        status: req.body.status,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        preserveExisting: req.body.preserveExisting !== false,
      })

      const label =
        result.shape === 'list'
          ? `${result.imported} day(s) marked ${result.statusLabel} for ${result.employees} employee(s)`
          : `${result.imported} of ${result.total} row(s) imported`

      res.status(200).json({ success: true, message: label, data: result })
    } catch (error) {
      if (error.statusCode === 400) return next(new BadRequestError(error.message))
      logger.error('Error in applyPaste:', error)
      next(error)
    }
  }

  /**
   * Export a month's actual attendance as a matrix workbook.
   * GET /api/attendance/monthly-export?month=YYYY-MM
   */
  async exportMonthlyMatrix(req, res, next) {
    try {
      const { month } = req.query
      const userIds = req.query.userIds
        ? String(req.query.userIds)
            .split(',')
            .map((id) => Number.parseInt(id, 10))
            .filter((id) => !Number.isNaN(id))
        : []

      const { buffer } = await bulkAttendanceService.exportMonth({
        month,
        userIds,
        markAbsent: req.query.markAbsent === 'true',
      })

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance-${month}-export.xlsx"`
      )
      res.status(200).send(buffer)
    } catch (error) {
      if (error.statusCode === 400) return next(new BadRequestError(error.message))
      logger.error('Error in exportMonthlyMatrix:', error)
      next(error)
    }
  }

  /**
   * Download the blank import template.
   * GET /api/attendance/import-template
   */
  async downloadImportTemplate(req, res, next) {
    try {
      const buffer = attendanceExcelImporter.buildTemplateWorkbook()
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader('Content-Disposition', 'attachment; filename="attendance-import-template.xlsx"')
      res.status(200).send(buffer)
    } catch (error) {
      logger.error('Error in downloadImportTemplate:', error)
      next(error)
    }
  }
}

module.exports = new AttendanceController()
