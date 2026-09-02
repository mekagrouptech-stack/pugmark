const logger = require('../utils/logger')

/**
 * Notification Service
 * Emits real-time notifications via Socket.IO
 */
class NotificationService {
  /**
   * Get Socket.IO instance from app
   */
  getIO(app) {
    try {
      return app ? app.get('io') : null
    } catch {
      return null
    }
  }

  /**
   * Notify when employee applies for leave -> Reporting Manager
   */
  notifyLeaveApplied(app, leave, applicant) {
    const io = this.getIO(app)
    if (!io) return
    const payload = {
      type: 'leave_applied',
      leaveId: leave.id,
      applicantId: leave.userId,
      applicantName: applicant?.name,
      applicantEmployeeCode: applicant?.employeeCode,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
      reason: leave.reason,
      status: leave.status,
      timestamp: new Date().toISOString(),
    }
    if (leave.reportingManagerId) {
      io.to('user_' + leave.reportingManagerId).emit('leave_applied', payload)
    }
    io.to('admin_notifications').emit('leave_applied', payload)
    logger.info('Leave applied notification sent', { leaveId: leave.id })
  }

  /**
   * Notify when Manager approves -> HR Head
   */
  notifyManagerApproved(app, leave, applicant) {
    const io = this.getIO(app)
    if (!io) return
    const payload = {
      type: 'leave_manager_approved',
      leaveId: leave.id,
      applicantId: leave.userId,
      applicantName: applicant?.name,
      applicantEmployeeCode: applicant?.employeeCode,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
      status: leave.status,
      timestamp: new Date().toISOString(),
    }
    if (leave.hrHeadId) {
      io.to('user_' + leave.hrHeadId).emit('leave_pending_hr', payload)
    }
    io.to('admin_notifications').emit('leave_pending_hr', payload)
    logger.info('Manager approved notification sent', { leaveId: leave.id })
  }

  /**
   * Notify when Manager rejects -> Employee
   */
  notifyManagerRejected(app, leave, reason) {
    const io = this.getIO(app)
    if (!io) return
    io.to('user_' + leave.userId).emit('leave_rejected', {
      type: 'leave_rejected',
      leaveId: leave.id,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
      reason: reason || leave.rejectionReason,
      rejectedBy: 'manager',
      timestamp: new Date().toISOString(),
    })
    logger.info('Manager rejected notification sent', { leaveId: leave.id })
  }

  /**
   * Notify when HR Head approves -> Employee
   */
  notifyHRApproved(app, leave) {
    const io = this.getIO(app)
    if (!io) return
    io.to('user_' + leave.userId).emit('leave_approved', {
      type: 'leave_approved',
      leaveId: leave.id,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
      status: 'Approved',
      timestamp: new Date().toISOString(),
    })
    logger.info('HR approved notification sent', { leaveId: leave.id })
  }

  /**
   * Notify when HR Head rejects -> Employee
   */
  notifyHRRejected(app, leave, reason) {
    const io = this.getIO(app)
    if (!io) return
    io.to('user_' + leave.userId).emit('leave_rejected', {
      type: 'leave_rejected',
      leaveId: leave.id,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
      reason: reason || leave.rejectionReason,
      rejectedBy: 'hr_head',
      timestamp: new Date().toISOString(),
    })
    logger.info('HR rejected notification sent', { leaveId: leave.id })
  }
}

module.exports = new NotificationService()
