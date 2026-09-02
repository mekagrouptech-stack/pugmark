const { Op } = require('sequelize')
const { sequelize } = require('../config/database')
const { User, Leave, EmploymentInformation, LeaveBalanceAdjustment } = require('../models')
const { moment, IST_TIMEZONE } = require('../utils/timeUtils')
const { holidaysTakenBy } = require('../utils/holidays')
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors')
const leaveWorkflowService = require('../services/leaveWorkflowService')
const logger = require('../utils/logger')

// Earned Leave is accrued, not granted up front: 2.5 days for each month the
// employee actually completes (30 a year at full service).
const EARNED_ACCRUAL_PER_MONTH = 2.5

// Roles allowed to create/edit/remove balance adjustments. Deliberately tighter
// than the read list: HOD can view the balance page but must not grant leave.
const ADJUSTMENT_WRITE_ROLES = ['ADMIN', 'HR', 'HEAD_HR']

const ADJUSTABLE_TYPES = ['earned', 'compOff']

const ADJUSTABLE_TYPE_LABELS = { earned: 'Earned leave', compOff: 'Comp off' }

// Comp off is granted purely through adjustments — nobody accrues it, so the
// figure an adjustment builds on is zero.
const BASE_COMP_OFF_QUOTA = 0

// One place that decides what a valid adjustment looks like, so create and
// update cannot drift apart.
const parseAdjustmentPayload = (body, { partial = false } = {}) => {
  const out = {}

  if (body.userId !== undefined || !partial) {
    const userId = parseInt(body.userId, 10)
    if (!Number.isInteger(userId) || userId <= 0) throw new BadRequestError('A valid employee is required')
    out.userId = userId
  }

  if (body.year !== undefined || !partial) {
    const year = parseInt(body.year, 10)
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestError('Year must be between 2000 and 2100')
    }
    out.year = year
  }

  if (body.leaveType !== undefined || !partial) {
    const leaveType = String(body.leaveType || '')
    if (!ADJUSTABLE_TYPES.includes(leaveType)) {
      throw new BadRequestError("Leave type must be one of: " + ADJUSTABLE_TYPES.join(', '))
    }
    out.leaveType = leaveType
  }

  if (body.days !== undefined || !partial) {
    const days = Number(body.days)
    if (!Number.isFinite(days)) throw new BadRequestError('Days must be a number')
    if (days === 0) throw new BadRequestError('Days cannot be zero — use a positive credit or a negative debit')
    if (Math.abs(days) > 365) throw new BadRequestError('Days must be between -365 and 365')
    // Half-day granularity: anything finer is a data-entry slip, not a policy.
    out.days = Math.round(days * 2) / 2
  }

  if (body.reason !== undefined) {
    const reason = String(body.reason || '').trim()
    if (reason.length > 500) throw new BadRequestError('Reason must be 500 characters or fewer')
    out.reason = reason || null
  }

  return out
}

// Balances are derived, so there is no row to update in place — the page has to
// re-read. Push a nudge to the people who can see it instead of leaving the
// table stale until someone hits Refresh.
const emitBalanceChanged = (req, payload) => {
  try {
    const io = req.app ? req.app.get('io') : null
    if (!io) return
    io.to('admin_notifications').emit('leave_balance_updated', payload)
    if (payload && payload.userId) {
      io.to('user_' + payload.userId).emit('leave_balance_updated', payload)
    }
  } catch (e) {
    logger.warn('Could not emit leave_balance_updated:', e.message)
  }
}

/**
 * Earned-leave entitlement accrued within `year` as of `todayStr` (YYYY-MM-DD).
 *
 * A month is worth 2.5 days only once it has fully elapsed AND the employee was
 * on roll for the whole of it. So the current, part-way month earns nothing yet,
 * and so does any month that ended before the employee joined — otherwise it is
 * zero. Past years therefore settle at the full 12 x 2.5 = 30.
 *
 * A missing joining date means "no record", not "joined today": those employees
 * are treated as on roll all year, which is how they were credited before any
 * joining date was captured.
 */
const accruedEarnedDays = (joiningDateStr, year, todayStr) => {
  let months = 0
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0')
    const monthStart = `${year}-${mm}-01`
    const monthEnd = moment(`${monthStart}`, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD')
    if (monthEnd > todayStr) break // month has not finished yet — and nor has any after it
    if (joiningDateStr && joiningDateStr > monthStart) continue // not on roll for the whole month
    months++
  }
  return months * EARNED_ACCRUAL_PER_MONTH
}

/**
 * The quota an employee has before any HR adjustment is folded in — accrual net
 * of observed holidays for earned leave, a flat zero for comp off.
 *
 * The balance table and the "Edit balance" action both need this figure, and
 * they must agree exactly: the edit stores `requested total - base`, so a base
 * that drifted from the one the table renders would make a saved balance come
 * back as a different number.
 */
const baseQuotasFor = (joiningDateStr, year, todayStr) => {
  const accrued = accruedEarnedDays(joiningDateStr, year, todayStr)
  const holidaysDeducted = holidaysTakenBy(year, todayStr, joiningDateStr).length
  return {
    accrued,
    holidaysDeducted,
    earned: accrued - holidaysDeducted,
    compOff: BASE_COMP_OFF_QUOTA,
  }
}

/**
 * Leave Controller
 * Two-step approval: 1) Reporting Person (Manager) -> 2) Head HR (both compulsory)
 */
class LeaveController {
  /**
   * Get leaves - two-step flow: pendingApproval shows Pending_Manager (for Reporting Person) or Pending_HR (for Head HR)
   */
  async getLeaves(req, res, next) {
    try {
      const { status, scope = 'my' } = req.query
      const currentUser = req.user
      const filters = { status, scope }

      const leaves = await leaveWorkflowService.getLeavesByRole(
        currentUser.id,
        currentUser.role,
        filters
      )

      const data = leaves.map((l) => {
        const plain = l.get ? l.get({ plain: true }) : l
        return {
          id: plain.id,
          userId: plain.userId,
          leaveType: plain.leaveType,
          startDate: plain.startDate,
          endDate: plain.endDate,
          reason: plain.reason,
          status: plain.status,
          reportingManagerId: plain.reportingManagerId,
          hrHeadId: plain.hrHeadId,
          approvedBy: plain.approvedBy,
          approvedAt: plain.approvedAt,
          managerApprovedBy: plain.managerApprovedBy,
          managerApprovedAt: plain.managerApprovedAt,
          rejectionReason: plain.rejectionReason,
          createdAt: plain.createdAt,
          userName: plain.user?.name,
          userEmployeeCode: plain.user?.employeeCode,
          reportingManagerName: plain.reportingManager?.name,
          hrHeadName: plain.hrHead?.name,
        }
      })

      res.status(200).json({
        success: true,
        message: 'Leaves retrieved successfully',
        data,
        count: data.length,
      })
    } catch (error) {
      logger.error('Error in getLeaves:', error)
      next(error)
    }
  }

  async getLeaveById(req, res, next) {
    try {
      const { id } = req.params
      const currentUser = req.user

      const leave = await Leave.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'employeeCode', 'department'] },
          { model: User, as: 'reportingManager', attributes: ['id', 'name'], required: false },
          { model: User, as: 'hrHead', attributes: ['id', 'name'], required: false },
        ],
      })

      if (!leave) throw new NotFoundError('Leave not found')

      const plain = leave.get({ plain: true })
      const canView =
        plain.userId === currentUser.id ||
        plain.reportingManagerId === currentUser.id ||
        plain.hrHeadId === currentUser.id ||
        ['ADMIN', 'HEAD_HR', 'HR'].includes(String(currentUser.role || '').toUpperCase())
      if (!canView) throw new ForbiddenError('You cannot view this leave')

      res.status(200).json({
        success: true,
        data: {
          id: plain.id,
          userId: plain.userId,
          leaveType: plain.leaveType,
          startDate: plain.startDate,
          endDate: plain.endDate,
          reason: plain.reason,
          status: plain.status,
          reportingManagerId: plain.reportingManagerId,
          hrHeadId: plain.hrHeadId,
          approvedBy: plain.approvedBy,
          approvedAt: plain.approvedAt,
          managerApprovedBy: plain.managerApprovedBy,
          managerApprovedAt: plain.managerApprovedAt,
          rejectionReason: plain.rejectionReason,
          createdAt: plain.createdAt,
          userName: plain.user?.name,
          userEmployeeCode: plain.user?.employeeCode,
          reportingManagerName: plain.reportingManager?.name,
          hrHeadName: plain.hrHead?.name,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  async applyLeave(req, res, next) {
    try {
      const leaveType = req.body.leaveType || req.body.type
      const { startDate, endDate, reason } = req.body
      const userId = req.user.id

      if (!leaveType || !startDate || !endDate || !reason) {
        throw new BadRequestError('Leave type, start date, end date, and reason are required')
      }

      const leave = await leaveWorkflowService.applyLeave(userId, {
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      })

      const created = await Leave.findByPk(leave.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'employeeCode'], required: true },
          { model: User, as: 'reportingManager', attributes: ['id', 'name'], required: false },
          { model: User, as: 'hrHead', attributes: ['id', 'name'], required: false },
        ],
      })
      const plain = created.get({ plain: true })

      try {
        const io = req.app.get('io')
        if (io) {
          const payload = {
            type: 'leave_applied',
            leaveId: plain.id,
            applicantName: plain.user?.name || req.user.name,
            applicantEmployeeCode: plain.user?.employeeCode,
            startDate: plain.startDate,
            endDate: plain.endDate,
            leaveType: plain.leaveType,
            reason: plain.reason,
            timestamp: new Date().toISOString(),
          }
          // Reporting Person: first approval + notification
          if (plain.reportingManagerId) {
            io.to('user_' + plain.reportingManagerId).emit('leave_applied', payload)
          }
          // Admin/Head HR: also see in notification (they see all pending in list)
          io.to('admin_notifications').emit('leave_applied', payload)
        }
      } catch (err) {
        logger.error('Failed to emit leave_applied notification:', err)
      }

      res.status(201).json({
        success: true,
        message: 'Leave applied successfully. First approval: Reporting Person, then Head HR.',
        data: {
          id: plain.id,
          leaveType: plain.leaveType,
          startDate: plain.startDate,
          endDate: plain.endDate,
          reason: plain.reason,
          status: plain.status,
          reportingManagerName: plain.reportingManager?.name || null,
          hrHeadName: plain.hrHead?.name || null,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /** Reporting Person approves → notification + approval request go to Head HR */
  async approveManager(req, res, next) {
    try {
      const { id } = req.params
      const { comments } = req.body
      const currentUser = req.user

      const leave = await leaveWorkflowService.managerApprove(id, currentUser.id, comments)

      try {
        const io = req.app.get('io')
        if (io) {
          const leaveWithUser = await Leave.findByPk(leave.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employeeCode'] }],
          })
          const plain = leaveWithUser?.get?.({ plain: true }) || leave
          const payload = {
            type: 'leave_pending_hr',
            leaveId: leave.id,
            applicantName: plain.user?.name,
            applicantEmployeeCode: plain.user?.employeeCode,
            startDate: leave.startDate,
            endDate: leave.endDate,
            leaveType: leave.leaveType,
            reason: leave.reason,
            timestamp: new Date().toISOString(),
          }
          // Notification + approval request go to Head HR (assigned or admin room as fallback)
          if (leave.hrHeadId) {
            io.to('user_' + leave.hrHeadId).emit('leave_pending_hr', payload)
          } else {
            io.to('admin_notifications').emit('leave_pending_hr', payload)
          }
        }
      } catch (err) {
        logger.error('Failed to emit leave_pending_hr notification:', err)
      }

      res.status(200).json({
        success: true,
        message: 'Leave approved by Reporting Person. Now pending Head HR approval.',
        data: { id: leave.id, status: 'Pending_HR' },
      })
    } catch (error) {
      next(error)
    }
  }

  /** Reporting Person (Manager) rejects */
  async rejectManager(req, res, next) {
    try {
      const { id } = req.params
      const { reason, comments } = req.body
      const currentUser = req.user
      const rejectReason = (reason || comments || '').trim() || 'Rejected by Reporting Person'

      const leave = await leaveWorkflowService.managerReject(id, currentUser.id, rejectReason)

      try {
        const io = req.app.get('io')
        if (io) {
          io.to('user_' + leave.userId).emit('leave_rejected', {
            type: 'leave_rejected',
            leaveId: leave.id,
            startDate: leave.startDate,
            endDate: leave.endDate,
            leaveType: leave.leaveType,
            reason: rejectReason,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (err) {
        logger.error('Failed to emit leave_rejected notification:', err)
      }

      res.status(200).json({
        success: true,
        message: 'Leave rejected by Reporting Person',
        data: { id: leave.id, status: 'Rejected' },
      })
    } catch (error) {
      next(error)
    }
  }

  /** Head HR approves - final approval (any Head HR or Admin can approve) */
  async approveHr(req, res, next) {
    try {
      const { id } = req.params
      const { comments } = req.body
      const currentUser = req.user
      const roleNorm = String(currentUser.role || '').toLowerCase().replace(/\s+/g, '_')
      const isAdmin = ['admin', 'system_admin', 'system_administrator'].includes(roleNorm)
      const isHeadHrOrHR = ['head_hr', 'headhr', 'hr'].includes(roleNorm) || roleNorm.includes('head') || roleNorm.includes('hr')

      const leave = await leaveWorkflowService.hrHeadApprove(id, currentUser.id, comments, isAdmin || isHeadHrOrHR)

      try {
        const io = req.app.get('io')
        if (io) {
          io.to('user_' + leave.userId).emit('leave_approved', {
            type: 'leave_approved',
            leaveId: leave.id,
            startDate: leave.startDate,
            endDate: leave.endDate,
            leaveType: leave.leaveType,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (err) {
        logger.error('Failed to emit leave_approved notification:', err)
      }

      res.status(200).json({
        success: true,
        message: 'Leave approved by Head HR',
        data: { id: leave.id, status: 'Approved' },
      })
    } catch (error) {
      next(error)
    }
  }

  /** Head HR rejects (any Head HR or Admin can reject) */
  async rejectHr(req, res, next) {
    try {
      const { id } = req.params
      const { reason, comments } = req.body
      const currentUser = req.user
      const roleNorm = String(currentUser.role || '').toLowerCase().replace(/\s+/g, '_')
      const isAdmin = ['admin', 'system_admin', 'system_administrator'].includes(roleNorm)
      const isHeadHrOrHR = ['head_hr', 'headhr', 'hr'].includes(roleNorm) || roleNorm.includes('head') || roleNorm.includes('hr')
      const rejectReason = (reason || comments || '').trim() || 'Rejected by Head HR'

      const leave = await leaveWorkflowService.hrHeadReject(id, currentUser.id, rejectReason, isAdmin || isHeadHrOrHR)

      try {
        const io = req.app.get('io')
        if (io) {
          io.to('user_' + leave.userId).emit('leave_rejected', {
            type: 'leave_rejected',
            leaveId: leave.id,
            startDate: leave.startDate,
            endDate: leave.endDate,
            leaveType: leave.leaveType,
            reason: rejectReason,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (err) {
        logger.error('Failed to emit leave_rejected notification:', err)
      }

      res.status(200).json({
        success: true,
        message: 'Leave rejected by Head HR',
        data: { id: leave.id, status: 'Rejected' },
      })
    } catch (error) {
      next(error)
    }
  }

  /** Legacy: auto-route approve to manager or HR based on status */
  async approveLeave(req, res, next) {
    const { id } = req.params
    const leave = await Leave.findByPk(id)
    if (!leave) throw new NotFoundError('Leave not found')
    const currentUser = req.user
    const roleNorm = String(currentUser.role || '').toLowerCase().replace(/\s+/g, '_')

    if (leave.status === 'Pending_Manager' && leave.reportingManagerId === currentUser.id) {
      return this.approveManager(req, res, next)
    }
    if (
      leave.status === 'Pending_HR' &&
      (leave.hrHeadId === currentUser.id || ['admin', 'head_hr', 'headhr', 'hr', 'system_admin', 'system_administrator'].includes(roleNorm))
    ) {
      return this.approveHr(req, res, next)
    }
    throw new ForbiddenError('You cannot approve this leave at this stage')
  }

  /** Legacy: auto-route reject to manager or HR based on status */
  async rejectLeave(req, res, next) {
    const { id } = req.params
    const leave = await Leave.findByPk(id)
    if (!leave) throw new NotFoundError('Leave not found')
    const currentUser = req.user
    const roleNorm = String(currentUser.role || '').toLowerCase().replace(/\s+/g, '_')

    if (leave.status === 'Pending_Manager' && leave.reportingManagerId === currentUser.id) {
      return this.rejectManager(req, res, next)
    }
    if (
      leave.status === 'Pending_HR' &&
      (leave.hrHeadId === currentUser.id || ['admin', 'head_hr', 'headhr', 'hr', 'system_admin', 'system_administrator'].includes(roleNorm))
    ) {
      return this.rejectHr(req, res, next)
    }
    throw new ForbiddenError('You cannot reject this leave at this stage')
  }

  async cancelLeave(req, res, next) {
    try {
      const { id } = req.params
      const currentUser = req.user

      const leave = await Leave.findByPk(id)
      if (!leave) throw new NotFoundError('Leave not found')
      if (leave.userId !== currentUser.id) {
        throw new ForbiddenError('You can only cancel your own leave')
      }
      const cancellable = ['Pending', 'Pending_Manager', 'Pending_HR'].includes(leave.status)
      if (!cancellable) {
        throw new BadRequestError('Only pending leaves can be cancelled')
      }

      await leave.update({ status: 'Cancelled' })

      res.status(200).json({
        success: true,
        message: 'Leave cancelled',
        data: { id: leave.id, status: 'Cancelled' },
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllLeaveBalances(req, res, next) {
    try {
      const currentUser = req.user
      const role = String(currentUser.role || '').toUpperCase()
      if (!['ADMIN', 'HR', 'HEAD_HR', 'HOD'].includes(role)) {
        throw new ForbiddenError('Only HR/Admin can view all users leave balance')
      }

      const { year: yearParam } = req.query
      const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
      const yearStart = `${currentYear}-01-01`
      const yearEnd = `${currentYear}-12-31`

      const users = await User.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'employeeCode', 'department'],
        order: [['name', 'ASC']],
      })

      const approvedLeaves = await Leave.findAll({
        where: {
          status: 'Approved',
          startDate: { [Op.lte]: yearEnd },
          endDate: { [Op.gte]: yearStart },
        },
        attributes: ['userId', 'startDate', 'endDate', 'leaveType'],
      })

      // Joining dates drive the earned-leave accrual below. Stored as DATETIME,
      // so format in the connection's own timezone — going via toISOString()
      // would shift an IST midnight back into the previous day.
      const employment = await EmploymentInformation.findAll({
        attributes: ['userId', 'dateOfJoining'],
      })
      const joiningByUser = {}
      employment.forEach((e) => {
        if (e.dateOfJoining) joiningByUser[e.userId] = moment(e.dateOfJoining).format('YYYY-MM-DD')
      })

      // HR-granted credits/debits for the year. Kept as their own rows rather
      // than baked into the users table so every change stays auditable and
      // reversible, and so past years keep the figures they were computed with.
      const adjustments = await LeaveBalanceAdjustment.findAll({
        where: { year: currentYear },
        order: [['createdAt', 'DESC']],
      })
      const adjustmentsByUser = {}
      adjustments.forEach((a) => {
        const uid = a.userId
        if (!adjustmentsByUser[uid]) adjustmentsByUser[uid] = []
        adjustmentsByUser[uid].push({
          id: a.id,
          userId: uid,
          year: a.year,
          leaveType: a.leaveType,
          days: Number(a.days),
          reason: a.reason || '',
          createdByName: a.createdByName || '',
          createdAt: a.createdAt,
        })
      })

      const todayStr = moment.tz(IST_TIMEZONE).format('YYYY-MM-DD')

      const toStr = (d) => {
        if (!d) return ''
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
        if (d instanceof Date) return d.toISOString().slice(0, 10)
        return String(d).slice(0, 10)
      }

      // Leave policy: Earned Leave and Comp Off are the quota-bearing types.
      // Sick and Casual were retired — Apply Leave no longer offers them.
      // Earned is per-employee (accrued monthly), so it is not a flat constant —
      // see baseQuotasFor.

      // LWP is capped rather than granted: 90 unpaid days a year is a ceiling on
      // absence, not an entitlement to spend. It is reported as used/limit and
      // stays out of the quota totals below, so "Total Remaining" keeps meaning
      // paid leave left rather than jumping to 105.
      const LWP_LIMIT = 90

      // LWP is matched BEFORE the earned fallback. It previously fell through
      // to 'earned', so every unpaid day taken was silently charged against the
      // employee's earned-leave balance.
      const normalizeType = (t) => {
        const s = String(t || '').toLowerCase().replace(/\s+/g, '')
        if (s.includes('lwp') || s.includes('withoutpay') || s.includes('unpaid')) return 'lwp'
        if (s.includes('comp')) return 'compOff'
        return 'earned'
      }

      const usedByUser = {}
      approvedLeaves.forEach((l) => {
        const uid = l.userId
        if (!usedByUser[uid]) usedByUser[uid] = { earned: 0, compOff: 0, lwp: 0 }
        const startStr = toStr(l.startDate)
        const endStr = toStr(l.endDate)
        if (!startStr || !endStr) return
        const clipStart = startStr < yearStart ? yearStart : startStr
        const clipEnd = endStr > yearEnd ? yearEnd : endStr
        if (clipStart > clipEnd) return
        const days = Math.ceil((new Date(clipEnd) - new Date(clipStart)) / (1000 * 60 * 60 * 24)) + 1
        const type = normalizeType(l.leaveType)
        usedByUser[uid][type] = (usedByUser[uid][type] || 0) + Math.max(1, days)
      })

      const data = users.map((u) => {
        const used = usedByUser[u.id] || { earned: 0, compOff: 0, lwp: 0 }
        const joining = joiningByUser[u.id]

        // Each company holiday already observed costs one day of earned leave.
        // Netted off the entitlement rather than added to `usedEarned`, which
        // tracks leave the employee actually applied for — merging the two would
        // make the "used" figure stop matching their leave history.
        const base = baseQuotasFor(joining, currentYear, todayStr)
        const { accrued, holidaysDeducted } = base

        // HR adjustments ride on top of the accrual rather than replacing it,
        // so an employee who is granted 5 comp off days still keeps whatever
        // earned leave they accrued that year.
        const userAdjustments = adjustmentsByUser[u.id] || []
        const adjEarned = userAdjustments
          .filter((a) => a.leaveType === 'earned')
          .reduce((sum, a) => sum + a.days, 0)
        const adjCompOff = userAdjustments
          .filter((a) => a.leaveType === 'compOff')
          .reduce((sum, a) => sum + a.days, 0)

        const earnedQuota = Math.max(0, base.earned + adjEarned)
        const compOffQuota = Math.max(0, base.compOff + adjCompOff)

        const remainingEarned = Math.max(0, earnedQuota - (used.earned || 0))
        const remainingCompOff = Math.max(0, compOffQuota - (used.compOff || 0))
        // LWP is unpaid time off with no entitlement to draw down, so it is
        // reported as days taken and deliberately left out of the quota totals —
        // folding it in would make `totalRemaining` disagree with the columns.
        const totalQuota = earnedQuota + compOffQuota
        const totalUsed = (used.earned || 0) + (used.compOff || 0)
        return {
          id: u.id,
          employee: u.name || 'Unknown',
          employeeCode: u.employeeCode || '',
          department: u.department || '',
          earnedLeave: remainingEarned,
          compOff: remainingCompOff,
          totalEarned: earnedQuota,
          accruedEarned: accrued,
          holidaysDeducted,
          totalCompOff: compOffQuota,
          adjustedEarned: adjEarned,
          adjustedCompOff: adjCompOff,
          totalAdjusted: adjEarned + adjCompOff,
          adjustments: userAdjustments,
          usedEarned: used.earned || 0,
          usedCompOff: used.compOff || 0,
          lwpDays: used.lwp || 0,
          totalLwp: LWP_LIMIT,
          totalQuota,
          totalUsed,
          totalRemaining: Math.max(0, totalQuota - totalUsed),
        }
      })

      res.status(200).json({
        success: true,
        message: 'All users leave balance retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getAllLeaveBalances:', error)
      next(error)
    }
  }

  /**
   * Leave balance adjustments — the editable layer on top of the derived
   * balance. Earned leave is accrued and comp off is granted, so the balance
   * itself has no row to edit; these records are what HR inserts, updates and
   * deletes, and getAllLeaveBalances folds them back in.
   */

  async listBalanceAdjustments(req, res, next) {
    try {
      const { year: yearParam, userId } = req.query
      const where = {}
      if (yearParam) {
        const year = parseInt(yearParam, 10)
        if (!Number.isInteger(year)) throw new BadRequestError('Invalid year')
        where.year = year
      }
      if (userId) {
        const uid = parseInt(userId, 10)
        if (!Number.isInteger(uid)) throw new BadRequestError('Invalid employee')
        where.userId = uid
      }

      const rows = await LeaveBalanceAdjustment.findAll({
        where,
        include: [{ model: User, as: 'employee', attributes: ['id', 'name', 'employeeCode'] }],
        order: [['createdAt', 'DESC']],
      })

      res.status(200).json({
        success: true,
        message: 'Leave balance adjustments retrieved successfully',
        data: rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          employee: r.employee ? r.employee.name : '',
          employeeCode: r.employee ? r.employee.employeeCode : '',
          year: r.year,
          leaveType: r.leaveType,
          days: Number(r.days),
          reason: r.reason || '',
          createdByName: r.createdByName || '',
          createdAt: r.createdAt,
        })),
      })
    } catch (error) {
      logger.error('Error in listBalanceAdjustments:', error)
      next(error)
    }
  }

  async createBalanceAdjustment(req, res, next) {
    try {
      const role = String(req.user.role || '').toUpperCase()
      if (!ADJUSTMENT_WRITE_ROLES.includes(role)) {
        throw new ForbiddenError('Only HR/Admin can adjust leave balances')
      }

      const payload = parseAdjustmentPayload(req.body)

      const employee = await User.findByPk(payload.userId, { attributes: ['id', 'isActive'] })
      if (!employee) throw new NotFoundError('Employee not found')

      const row = await LeaveBalanceAdjustment.create({
        ...payload,
        createdById: req.user.id,
        createdByName: req.user.name || '',
      })

      emitBalanceChanged(req, { userId: row.userId, year: row.year, action: 'created' })

      res.status(201).json({
        success: true,
        message: 'Leave balance adjustment added',
        data: { ...row.toJSON(), days: Number(row.days) },
      })
    } catch (error) {
      logger.error('Error in createBalanceAdjustment:', error)
      next(error)
    }
  }

  async updateBalanceAdjustment(req, res, next) {
    try {
      const role = String(req.user.role || '').toUpperCase()
      if (!ADJUSTMENT_WRITE_ROLES.includes(role)) {
        throw new ForbiddenError('Only HR/Admin can adjust leave balances')
      }

      const row = await LeaveBalanceAdjustment.findByPk(req.params.id)
      if (!row) throw new NotFoundError('Leave balance adjustment not found')

      const payload = parseAdjustmentPayload(req.body, { partial: true })
      if (payload.userId && payload.userId !== row.userId) {
        const employee = await User.findByPk(payload.userId, { attributes: ['id'] })
        if (!employee) throw new NotFoundError('Employee not found')
      }

      // The employee/year may move, so the row that goes stale is not always the
      // one the edit lands on — refresh both sides.
      const previousUserId = row.userId
      const previousYear = row.year

      await row.update(payload)

      emitBalanceChanged(req, { userId: row.userId, year: row.year, action: 'updated' })
      if (previousUserId !== row.userId || previousYear !== row.year) {
        emitBalanceChanged(req, { userId: previousUserId, year: previousYear, action: 'updated' })
      }

      res.status(200).json({
        success: true,
        message: 'Leave balance adjustment updated',
        data: { ...row.toJSON(), days: Number(row.days) },
      })
    } catch (error) {
      logger.error('Error in updateBalanceAdjustment:', error)
      next(error)
    }
  }

  async deleteBalanceAdjustment(req, res, next) {
    try {
      const role = String(req.user.role || '').toUpperCase()
      if (!ADJUSTMENT_WRITE_ROLES.includes(role)) {
        throw new ForbiddenError('Only HR/Admin can adjust leave balances')
      }

      const row = await LeaveBalanceAdjustment.findByPk(req.params.id)
      if (!row) throw new NotFoundError('Leave balance adjustment not found')

      const { userId, year } = row
      await row.destroy()

      emitBalanceChanged(req, { userId, year, action: 'deleted' })

      res.status(200).json({
        success: true,
        message: 'Leave balance adjustment deleted',
        data: { id: Number(req.params.id) },
      })
    } catch (error) {
      logger.error('Error in deleteBalanceAdjustment:', error)
      next(error)
    }
  }

  /**
   * Set an employee's leave balance outright — the "Edit" action on the balance
   * page, where HR types the total they want rather than a credit or a debit.
   *
   * The quota is derived (accrual - holidays + adjustments), so there is no
   * column to write. This works out the single adjustment that lands on the
   * requested total and REPLACES the employee's existing ones for that type, so
   * editing the same balance twice sets it rather than stacking on itself.
   *
   * PUT /api/leaves/balance/:userId
   */
  async setLeaveBalance(req, res, next) {
    try {
      const role = String(req.user.role || '').toUpperCase()
      if (!ADJUSTMENT_WRITE_ROLES.includes(role)) {
        throw new ForbiddenError('Only HR/Admin can edit leave balances')
      }

      const userId = parseInt(req.params.userId, 10)
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new BadRequestError('A valid employee is required')
      }

      const year = parseInt(req.body.year, 10)
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new BadRequestError('Year must be between 2000 and 2100')
      }

      const reason = String(req.body.reason || '').trim()
      if (reason.length > 500) throw new BadRequestError('Reason must be 500 characters or fewer')

      // Only the types actually sent are touched, so an edit that changes comp
      // off alone leaves earned leave — and its history — exactly as it was.
      const requested = {}
      ADJUSTABLE_TYPES.forEach((leaveType) => {
        const raw = req.body[leaveType]
        if (raw === undefined || raw === null || raw === '') return
        const label = ADJUSTABLE_TYPE_LABELS[leaveType]
        const total = Number(raw)
        if (!Number.isFinite(total)) throw new BadRequestError(`${label} total must be a number`)
        if (total < 0) throw new BadRequestError(`${label} total cannot be negative`)
        if (total > 365) throw new BadRequestError(`${label} total must be 365 days or fewer`)
        // Half-day granularity, same as a hand-entered adjustment.
        requested[leaveType] = Math.round(total * 2) / 2
      })
      if (!Object.keys(requested).length) {
        throw new BadRequestError('Enter at least one balance to update')
      }

      const employee = await User.findByPk(userId, { attributes: ['id', 'name'] })
      if (!employee) throw new NotFoundError('Employee not found')

      const employment = await EmploymentInformation.findOne({
        where: { userId },
        attributes: ['dateOfJoining'],
      })
      const joining = employment && employment.dateOfJoining
        ? moment(employment.dateOfJoining).format('YYYY-MM-DD')
        : null
      const todayStr = moment.tz(IST_TIMEZONE).format('YYYY-MM-DD')
      const base = baseQuotasFor(joining, year, todayStr)

      const applied = {}
      // One transaction so a failure cannot leave the employee with the old rows
      // deleted and no replacement — that would silently zero their balance.
      await sequelize.transaction(async (transaction) => {
        for (const leaveType of Object.keys(requested)) {
          const total = requested[leaveType]
          const days = Math.round((total - base[leaveType]) * 2) / 2
          if (Math.abs(days) > 365) {
            throw new BadRequestError(
              `${ADJUSTABLE_TYPE_LABELS[leaveType]} total is too far from the accrued ${base[leaveType]} days`
            )
          }

          await LeaveBalanceAdjustment.destroy({
            where: { userId, year, leaveType },
            transaction,
          })

          // A total that already matches the accrual needs no row at all; the
          // destroy above has put the employee back on plain accrual.
          if (days !== 0) {
            await LeaveBalanceAdjustment.create(
              {
                userId,
                year,
                leaveType,
                days,
                reason: reason || `Balance set to ${total} days by HR`,
                createdById: req.user.id,
                createdByName: req.user.name || '',
              },
              { transaction }
            )
          }

          applied[leaveType] = { total, adjustment: days, base: base[leaveType] }
        }
      })

      emitBalanceChanged(req, { userId, year, action: 'updated' })

      logger.info('Leave balance set by HR', {
        userId,
        year,
        applied,
        byUserId: req.user.id,
      })

      res.status(200).json({
        success: true,
        message: 'Leave balance updated',
        data: { userId, year, applied },
      })
    } catch (error) {
      logger.error('Error in setLeaveBalance:', error)
      next(error)
    }
  }

  async getLeaveBalance(req, res, next) {
    try {
      const { userId, year: yearParam } = req.query
      const targetUserId = userId || req.user.id
      const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
      const yearStart = `${currentYear}-01-01`
      const yearEnd = `${currentYear}-12-31`

      const approvedLeaves = await Leave.findAll({
        where: {
          userId: targetUserId,
          status: 'Approved',
          startDate: { [Op.lte]: yearEnd },
          endDate: { [Op.gte]: yearStart },
        },
        attributes: ['startDate', 'endDate', 'leaveType'],
      })

      const toStr = (d) => {
        if (!d) return ''
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
        if (d instanceof Date) return d.toISOString().slice(0, 10)
        return String(d).slice(0, 10)
      }
      let usedLeaves = 0
      approvedLeaves.forEach((l) => {
        const startStr = toStr(l.startDate)
        const endStr = toStr(l.endDate)
        if (!startStr || !endStr) return
        const clipStart = startStr < yearStart ? yearStart : startStr
        const clipEnd = endStr > yearEnd ? yearEnd : endStr
        if (clipStart > clipEnd) return
        const days = Math.ceil((new Date(clipEnd) - new Date(clipStart)) / (1000 * 60 * 60 * 24)) + 1
        usedLeaves += Math.max(1, days)
      })

      const totalLeaves = 30
      const remainingLeaves = Math.max(0, totalLeaves - usedLeaves)

      const byType = {}
      approvedLeaves.forEach((l) => {
        const start = new Date(l.startDate)
        const end = new Date(l.endDate)
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
        const type = l.leaveType || 'other'
        byType[type] = (byType[type] || 0) + Math.max(1, days)
      })

      res.status(200).json({
        success: true,
        message: 'Leave balance retrieved successfully',
        data: {
          totalLeaves,
          usedLeaves,
          remainingLeaves,
          sickLeave: remainingLeaves,
          casualLeave: 0,
          earnedLeave: 0,
          compOff: 0,
          usedByType: byType,
        },
      })
    } catch (error) {
      logger.error('Error in getLeaveBalance:', error)
      next(error)
    }
  }
}

module.exports = new LeaveController()
