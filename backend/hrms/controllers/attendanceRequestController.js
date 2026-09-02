const { AttendanceRequest, User } = require('../models')
const { Op } = require('sequelize')
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors')
const logger = require('../utils/logger')
const attendanceService = require('../services/attendanceService')

/**
 * Get current user's own attendance regulation requests (for calendar display).
 * GET /api/attendance/requests/my
 */
async function getMyRequests(req, res, next) {
  try {
    const userId = req.user.id
    const { startDate, endDate } = req.query

    const where = { userId }
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] }
    } else if (startDate) {
      where.date = { [Op.gte]: startDate }
    } else if (endDate) {
      where.date = { [Op.lte]: endDate }
    }

    const rows = await AttendanceRequest.findAll({
      where,
      attributes: ['id', 'date', 'requestType', 'status', 'reason', 'checkIn', 'approvalNote', 'rejectionReason', 'createdAt'],
      order: [['date', 'DESC']],
      limit: 200,
    })

    const toDateStr = (v) => {
      if (!v) return null
      if (typeof v === 'string') return v.slice(0, 10)
      if (v instanceof Date) return v.toISOString().slice(0, 10)
      return null
    }
    const data = rows.map((r) => {
      const plain = r.get ? r.get({ plain: true }) : r
      const dateStr = toDateStr(plain.date)
      return {
        id: plain.id,
        date: dateStr,
        requestType: plain.requestType,
        status: plain.status,
        reason: plain.reason,
        checkIn: plain.checkIn || null,
        approvalNote: plain.approvalNote || null,
        rejectionReason: plain.rejectionReason || null,
        requestedDate: plain.createdAt ? (typeof plain.createdAt === 'string' ? plain.createdAt.slice(0, 10) : plain.createdAt.toISOString?.()?.slice(0, 10)) : null,
      }
    })

    logger.info('getMyRequests: returning regulations', { userId, count: data.length })
    res.status(200).json({
      success: true,
      message: 'My attendance regulation requests retrieved',
      data,
    })
  } catch (error) {
    logger.error('Error in getMyRequests:', error)
    next(error)
  }
}

/**
 * Get pending attendance requests for the current user (as reporting manager or ADMIN sees all).
 * GET /api/attendance/requests/pending
 */
async function getPendingRequests(req, res, next) {
  try {
    const currentUser = req.user
    const { page = 1, limit = 10 } = req.query
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))

    // Attendance regulation goes directly to Head HR for approval (not reporting manager)
    const roleNorm = String(currentUser.role || '').toLowerCase().replace(/\s+/g, '_')
    const isHeadHrOrAdmin = ['admin', 'head_hr', 'headhr', 'hr', 'system_admin', 'system_administrator'].includes(roleNorm) ||
      roleNorm.includes('admin') || roleNorm.includes('head') || roleNorm.includes('hr')
    const where = { status: 'Pending' }
    if (!isHeadHrOrAdmin) {
      where.id = -1 // Non-Head HR sees nothing (requests go to Head HR only)
    }

    const { count, rows } = await AttendanceRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'employeeCode'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    })

    const data = rows.map((r) => {
      const plain = r.get ? r.get({ plain: true }) : r
      return {
        id: plain.id,
        employeeName: plain.user?.name || 'N/A',
        employeeCode: plain.user?.employeeCode || 'N/A',
        date: plain.date,
        requestType: plain.requestType,
        reason: plain.reason,
        checkIn: plain.checkIn || '-',
        checkOut: plain.checkOut || '-',
        requestedDate: plain.createdAt ? (typeof plain.createdAt === 'string' ? plain.createdAt.slice(0, 10) : plain.createdAt.toISOString?.()?.slice(0, 10)) : null,
        status: plain.status,
      }
    })

    res.status(200).json({
      success: true,
      message: 'Pending attendance requests retrieved',
      data,
      total: count,
      page: parseInt(page, 10),
      limit: limitNum,
    })
  } catch (error) {
    logger.error('Error in getPendingRequests:', error)
    next(error)
  }
}

/**
 * Approve an attendance request. Reporting manager or ADMIN only.
 * PATCH /api/attendance/requests/:id/approve
 */
async function approveRequest(req, res, next) {
  try {
    const { id } = req.params
    const { note } = req.body || {}
    const currentUser = req.user
    // A regularization must always carry a written note from the approver.
    const approvalNote = String(note || '').trim()
    if (!approvalNote) {
      throw new BadRequestError('A note is required to regularize attendance')
    }
    const request = await AttendanceRequest.findByPk(id)
    if (!request) throw new NotFoundError('Attendance request not found')
    if (request.status !== 'Pending') {
      throw new BadRequestError('Only pending requests can be approved')
    }
    // Only Head HR or Admin can approve (attendance regulation goes directly to Head HR)
    const roleNorm = String(currentUser.role || '').toLowerCase().replace(/\s+/g, '_')
    const isHeadHrOrAdmin = ['admin', 'head_hr', 'headhr', 'hr', 'system_admin', 'system_administrator'].includes(roleNorm) ||
      roleNorm.includes('admin') || roleNorm.includes('head') || roleNorm.includes('hr')
    if (!isHeadHrOrAdmin) throw new ForbiddenError('Only Head HR or Admin can approve attendance regulation requests')

    await request.update({
      status: 'Approved',
      approvedBy: currentUser.id,
      approvedAt: new Date(),
      approvalNote,
      rejectionReason: null,
      rejectedBy: null,
      rejectedAt: null,
    })

    try {
      await attendanceService.createAttendanceForRegulation(request.userId, request.date, {
        checkIn: request.checkIn || undefined,
        checkOut: request.checkOut || undefined,
      })
    } catch (err) {
      logger.error('Error creating regulation attendance (request already approved):', err)
      return res.status(200).json({
        success: true,
        message: 'Request approved. Attendance could not be auto-created: ' + (err.message || 'see logs'),
        data: { id: request.id, status: 'Approved' },
      })
    }

    try {
      const io = req.app.get('io')
      if (io) {
        io.to('user_' + request.userId).emit('attendance_regulation_approved', {
          type: 'attendance_regulation_approved',
          requestId: request.id,
          date: request.date,
          checkIn: request.checkIn,
          checkOut: request.checkOut,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (err) {
      logger.error('Failed to emit attendance_regulation_approved:', err)
    }

    res.status(200).json({
      success: true,
      message: 'Attendance request approved successfully. Day will count as attendance.',
      data: { id: request.id, status: 'Approved' },
    })
  } catch (error) {
    logger.error('Error in approveRequest:', error)
    next(error)
  }
}

/**
 * Reject an attendance request. Reporting manager or ADMIN only.
 * PATCH /api/attendance/requests/:id/reject
 */
async function rejectRequest(req, res, next) {
  try {
    const { id } = req.params
    const { reason } = req.body || {}
    const currentUser = req.user
    const rejectionNote = String(reason || '').trim()
    if (!rejectionNote) {
      throw new BadRequestError('A note is required to reject a regularization request')
    }
    const request = await AttendanceRequest.findByPk(id)
    if (!request) throw new NotFoundError('Attendance request not found')
    if (request.status !== 'Pending') {
      throw new BadRequestError('Only pending requests can be rejected')
    }
    // Attendance regulation goes to Head HR - only Head HR or Admin can reject
    const roleNorm = String(currentUser.role || '').toLowerCase().replace(/\s+/g, '_')
    const isHeadHrOrAdmin = ['admin', 'head_hr', 'headhr', 'hr', 'system_admin', 'system_administrator'].includes(roleNorm) ||
      roleNorm.includes('admin') || roleNorm.includes('head') || roleNorm.includes('hr')
    if (!isHeadHrOrAdmin) throw new ForbiddenError('Only Head HR or Admin can reject attendance regulation requests')

    await request.update({
      status: 'Rejected',
      rejectedBy: currentUser.id,
      rejectedAt: new Date(),
      rejectionReason: rejectionNote,
    })

    res.status(200).json({
      success: true,
      message: 'Attendance request rejected',
      data: { id: request.id, status: 'Rejected' },
    })
  } catch (error) {
    logger.error('Error in rejectRequest:', error)
    next(error)
  }
}

/**
 * Create an attendance request (Late Mark / Absent Regularization). Employee submits.
 * POST /api/attendance/requests
 */
async function createRequest(req, res, next) {
  try {
    const userId = req.user.id
    const { date, requestType, reason, checkIn, checkOut } = req.body
    if (!date || !requestType || !reason) {
      throw new BadRequestError('Date, request type, and reason are required')
    }
    const allowedTypes = ['Late Mark', 'Absent Regularization', 'Time Regulation']
    if (!allowedTypes.includes(requestType)) {
      throw new BadRequestError('Request type must be "Late Mark", "Absent Regularization", or "Time Regulation"')
    }

    const applicant = await User.findByPk(userId, { attributes: ['id'] })
    if (!applicant) throw new NotFoundError('User not found')

    const existing = await AttendanceRequest.findOne({
      where: { userId, date, status: 'Pending' },
    })
    if (existing) {
      throw new BadRequestError('You already have a pending request for this date')
    }

    // Attendance regulation goes directly to Head HR for approval (not reporting manager)
    const request = await AttendanceRequest.create({
      userId,
      date,
      requestType,
      reason: (reason || '').trim(),
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      status: 'Pending',
      reportingManagerId: null, // Routed to Head HR, not reporting manager
    })

    res.status(201).json({
      success: true,
      message: 'Attendance request submitted successfully',
      data: {
        id: request.id,
        date: request.date,
        requestType: request.requestType,
        status: request.status,
      },
    })
  } catch (error) {
    logger.error('Error in createRequest:', error)
    next(error)
  }
}

module.exports = {
  getMyRequests,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  createRequest,
}
