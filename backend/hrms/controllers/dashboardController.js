const { User, AttendanceRecord, Payroll, Leave, DAR, BasicInformation, EmploymentInformation } = require('../models')
const { Op, fn, col, where: seqWhere } = require('sequelize')
const { sequelize } = require('../config/database')
const logger = require('../utils/logger')
const attendanceService = require('../services/attendanceService')
const biometricSync = require('../services/biometricAttendanceSync')
const { istStartOfDay, istEndOfDay } = require('../utils/timeUtils')

/**
 * Dashboard Controller
 * Handles dashboard statistics and data
 */
class DashboardController {
  /**
   * Get dashboard stats
   * GET /api/dashboard/stats
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user.id
      const userRole = req.user.role
      const companyId = req.user.companyId
      const { companyId: queryCompanyId } = req.query

      // Determine which company to get stats for
      const targetCompanyId = queryCompanyId || companyId

      // Get current date info
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      const currentYear = today.getFullYear()
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59)

      // Admin/HR/HEAD_HR can see organization-wide stats
      if (['ADMIN', 'HR', 'HEAD_HR'].includes(userRole)) {
        // Build user where clause
        const userWhereClause = {
          isActive: true,
        }
        if (targetCompanyId) {
          userWhereClause.companyId = targetCompanyId
        }

        // Total & active employees
        const totalEmployees = await User.count({ where: userWhereClause })

        // Get user IDs (for company scoping)
        let userIds = null
        if (targetCompanyId) {
          const users = await User.findAll({
            where: userWhereClause,
            attributes: ['id'],
          })
          userIds = users.map((u) => u.id)

          if (userIds.length === 0) {
            const zeroStats = {
              totalEmployees: 0,
              presentToday: 0,
              onLeave: 0,
              pendingLeaves: 0,
              upcomingHolidays: 0,
              monthlyAttendance: {
                present: 0,
                absent: 0,
                halfDay: 0,
                onLeave: 0,
              },
            }
            return res.status(200).json({
              success: true,
              message: 'Dashboard stats retrieved successfully',
              data: zeroStats,
            })
          }
        }

        // Build attendance where clause for month
        const attendanceWhereClause = {
          [Op.or]: [
            {
              createdAt: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
            {
              checkInTime: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
            {
              checkOutTime: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
          ],
        }

        if (userIds) {
          attendanceWhereClause.userId = { [Op.in]: userIds }
        }

        const attendanceStats = await AttendanceRecord.findAll({
          where: attendanceWhereClause,
          attributes: ['punchType'],
        })

        const monthlyPresent = attendanceStats.filter((a) => a.punchType === 'IN').length
        const monthlyAbsent = Math.max(0, totalEmployees * 22 - monthlyPresent) // Approximate

        // Today's present count
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const todayWhereClause = {
          punchType: 'IN',
          [Op.or]: [
            {
              createdAt: {
                [Op.between]: [todayStart, todayEnd],
              },
            },
            {
              checkInTime: {
                [Op.between]: [todayStart, todayEnd],
              },
            },
          ],
        }

        if (userIds) {
          todayWhereClause.userId = { [Op.in]: userIds }
        }

        const presentToday = await AttendanceRecord.count({
          where: todayWhereClause,
          distinct: true,
          col: 'userId',
        })

        // Shape response as DashboardStats to match mobile app types
        const stats = {
          totalEmployees,
          presentToday,
          onLeave: 0, // Leave model not implemented yet
          pendingLeaves: 0, // Leave approvals not implemented yet
          upcomingHolidays: 0, // Holiday model not implemented yet
          monthlyAttendance: {
            present: monthlyPresent,
            absent: monthlyAbsent,
            halfDay: 0,
            onLeave: 0,
          },
        }

        return res.status(200).json({
          success: true,
          message: 'Dashboard stats retrieved successfully',
          data: stats,
        })
      }

      // Employee/Manager: personal stats
      const userAttendance = await AttendanceRecord.findAll({
        where: {
          userId,
          [Op.or]: [
            {
              createdAt: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
            {
              checkInTime: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
            {
              checkOutTime: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
          ],
        },
      })

      const monthlyPresent = userAttendance.filter((a) => a.punchType === 'IN').length

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)

      const todayAttendanceCount = await AttendanceRecord.count({
        where: {
          userId,
          punchType: 'IN',
          [Op.or]: [
            {
              createdAt: {
                [Op.between]: [todayStart, todayEnd],
              },
            },
            {
              checkInTime: {
                [Op.between]: [todayStart, todayEnd],
              },
            },
          ],
        },
      })

      const stats = {
        totalEmployees: 1,
        presentToday: todayAttendanceCount > 0 ? 1 : 0,
        onLeave: 0,
        pendingLeaves: 0,
        upcomingHolidays: 0,
        monthlyAttendance: {
          present: monthlyPresent,
          absent: 0,
          halfDay: 0,
          onLeave: 0,
        },
      }

      return res.status(200).json({
        success: true,
        message: 'Dashboard stats retrieved successfully',
        data: stats,
      })
    } catch (error) {
      logger.error('Error in getStats:', error)
      next(error)
    }
  }

  /**
   * Get dashboard data for the logged-in user (salary, attendance, working reports, daily calendar)
   * GET /api/dashboard/me
   */
  async getMyDashboard(req, res, next) {
    try {
      const userId = req.user.id
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const monthStart = new Date(currentYear, currentMonth - 1, 1)
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)
      const monthStartStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const monthEndStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`

      // 1. Salary from user
      const user = await User.findByPk(userId, { attributes: ['id', 'monthlySalary'] })
      const monthlySalary = user?.monthlySalary != null ? Number(user.monthlySalary) : 0
      const salary = { monthly: monthlySalary }

      // 2. Attendance records for the month (all records, high limit)
      // Materialize the month's biometric punches first, exactly as
      // GET /attendance/records does. Without this the calendar reads only
      // attendance_records and paints "Absent" on days that already have
      // device punches in attendance_logs — so the dashboard and the
      // My Attendance page disagree until the nightly cron runs.
      try {
        await biometricSync.syncUserRange(userId, monthStartStr, monthEndStr)
      } catch (e) {
        logger.warn('getMyDashboard biometric sync skipped:', e.message)
      }

      let formattedAttendance = []
      try {
        const attendanceResult = await attendanceService.getUserAttendanceRecords(userId, {
          startDate: monthStartStr,
          endDate: monthEndStr,
          limit: 100,
        })
        formattedAttendance = attendanceResult.data || []
      } catch (err) {
        logger.warn('getMyDashboard: attendance fetch failed', err.message)
      }

      // 3. Approved leaves overlapping this month
      const leaveDatesSet = new Set()
      try {
        const leaves = await Leave.findAll({
          where: {
            userId,
            status: 'Approved',
            [Op.or]: [
              { startDate: { [Op.between]: [monthStartStr, monthEndStr] } },
              { endDate: { [Op.between]: [monthStartStr, monthEndStr] } },
            ],
          },
          attributes: ['startDate', 'endDate'],
        })
        leaves.forEach((l) => {
          const startStr = typeof l.startDate === 'string' ? l.startDate : (l.startDate && l.startDate.toISOString ? l.startDate.toISOString().slice(0, 10) : null)
          const endStr = typeof l.endDate === 'string' ? l.endDate : (l.endDate && l.endDate.toISOString ? l.endDate.toISOString().slice(0, 10) : null)
          if (!startStr || !endStr) return
          for (let d = new Date(startStr + 'T12:00:00'); d <= new Date(endStr + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear()
            const m = d.getMonth() + 1
            const day = d.getDate()
            if (y === currentYear && m === currentMonth) {
              leaveDatesSet.add(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
            }
          }
        })
      } catch (err) {
        logger.warn('getMyDashboard: leaves fetch failed', err.message)
      }

      // 4. Build daily attendance records: working days only, status from attendance or leave or absent
      const dailyAttendanceRecords = []
      const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const attendanceByDate = {}
      formattedAttendance.forEach((r) => {
        if (r.date) attendanceByDate[r.date] = r
      })

      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const d = new Date(currentYear, currentMonth - 1, day)
        const dayOfWeek = d.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        if (isWeekend) continue

        if (leaveDatesSet.has(dateStr)) {
          dailyAttendanceRecords.push({ date: dateStr, status: 'Leave' })
          continue
        }

        const att = attendanceByDate[dateStr]
        if (att) {
          let status = att.status || 'Present'
          const hours = Number(att.totalHours)
          if (!Number.isNaN(hours) && hours < 5 && hours > 0) {
            status = 'Half Day'
          }
          dailyAttendanceRecords.push({ date: dateStr, status })
        } else {
          if (dateStr <= todayStr) {
            dailyAttendanceRecords.push({ date: dateStr, status: 'Absent' })
          }
        }
      }

      // 5. ownAttendance counts
      let present = 0
      let absent = 0
      let leave = 0
      dailyAttendanceRecords.forEach((r) => {
        if (['Present', 'Late', 'Half Day'].includes(r.status)) present++
        else if (r.status === 'Absent') absent++
        else if (r.status === 'Leave') leave++
      })
      const totalDays = dailyAttendanceRecords.length
      const ownAttendance = {
        present,
        absent,
        leave,
        totalDays: totalDays || 1,
      }

      // 6. DAR (working reports) counts for the month
      let ownWorkingReports = { submitted: 0, approved: 0, pending: 0, total: 0 }
      try {
        const darWhere = {
          userId,
          date: { [Op.between]: [monthStartStr, monthEndStr] },
        }
        const [submittedCount, approvedCount, pendingCount, totalCount] = await Promise.all([
          DAR.count({ where: { ...darWhere, status: 'SUBMITTED' } }),
          DAR.count({ where: { ...darWhere, status: 'APPROVED' } }),
          DAR.count({ where: { ...darWhere, status: 'DRAFT' } }),
          DAR.count({ where: darWhere }),
        ])
        ownWorkingReports = {
          submitted: submittedCount,
          approved: approvedCount,
          pending: pendingCount,
          total: totalCount,
        }
      } catch (err) {
        logger.warn('getMyDashboard: DAR count failed', err.message)
      }

      res.status(200).json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          salary,
          attendance: ownAttendance,
          ownAttendance,
          workingReports: ownWorkingReports,
          ownWorkingReports,
          dailyAttendanceRecords,
        },
      })
    } catch (error) {
      logger.error('Error in getMyDashboard:', error)
      next(error)
    }
  }

  /**
   * Get today's birthdays and work anniversaries
   * GET /api/dashboard/celebrations
   */
  async getCelebrations(req, res, next) {
    try {
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      const currentDay = today.getDate()
      const currentYear = today.getFullYear()

      // Birthdays: match month & day of date_of_birth
      let birthdays = []
      try {
        const birthdayRecords = await BasicInformation.findAll({
          where: sequelize.where(
            fn('MONTH', col('date_of_birth')),
            currentMonth
          ),
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employeeCode', 'department', 'designation'] }],
        })
        birthdays = birthdayRecords
          .filter((r) => {
            const dob = new Date(r.dateOfBirth)
            return dob.getDate() === currentDay
          })
          .map((r) => ({
            id: r.user?.id,
            name: r.user?.name,
            employeeCode: r.user?.employeeCode,
            department: r.user?.department,
            designation: r.user?.designation,
            dateOfBirth: r.dateOfBirth,
          }))
      } catch (e) {
        logger.warn('Could not fetch birthdays:', e.message)
      }

      // Work Anniversaries: match month & day of date_of_joining, year < current
      let anniversaries = []
      try {
        const annivRecords = await EmploymentInformation.findAll({
          where: {
            [Op.and]: [
              sequelize.where(fn('MONTH', col('date_of_joining')), currentMonth),
              sequelize.where(fn('YEAR', col('date_of_joining')), { [Op.lt]: currentYear }),
            ],
          },
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employeeCode', 'department', 'designation'] }],
        })
        anniversaries = annivRecords
          .filter((r) => {
            const doj = new Date(r.dateOfJoining)
            return doj.getDate() === currentDay
          })
          .map((r) => {
            const doj = new Date(r.dateOfJoining)
            const years = currentYear - doj.getFullYear()
            return {
              id: r.user?.id,
              name: r.user?.name,
              employeeCode: r.user?.employeeCode,
              department: r.user?.department,
              designation: r.user?.designation,
              dateOfJoining: r.dateOfJoining,
              years,
            }
          })
      } catch (e) {
        logger.warn('Could not fetch anniversaries:', e.message)
      }

      res.status(200).json({
        success: true,
        data: { birthdays, anniversaries },
      })
    } catch (error) {
      logger.error('Error in getCelebrations:', error)
      next(error)
    }
  }
}

module.exports = new DashboardController()
