const { User, Leave, LeaveApproval } = require('../models')
const { sequelize } = require('../config/database')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

let _leavesColumnsEnsured = false
async function ensureLeavesColumns() {
  if (_leavesColumnsEnsured) return
  const alters = [
    'ALTER TABLE users ADD COLUMN hr_head_id INT NULL',
    'ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL',
    'ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL',
    'ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL',
  ]
  for (const sql of alters) {
    try {
      await sequelize.query(sql)
      logger.info('Added column:', sql.split('ADD COLUMN ')[1]?.split(' ')[0])
    } catch (e) {
      const msg = e.message || e.original?.message || ''
      if (!msg.includes('Duplicate column')) throw e
    }
  }
  // Ensure leave_approvals table exists (for approval history)
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS leave_approvals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        leave_id INT NOT NULL,
        approved_by INT NOT NULL,
        approval_level ENUM('manager','hr_head') NOT NULL,
        action ENUM('approved','rejected') NOT NULL,
        comments TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leave_id) REFERENCES leaves(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_leave_approvals_leave_id (leave_id),
        INDEX idx_leave_approvals_approved_by (approved_by)
      )
    `)
    logger.info('Ensured leave_approvals table exists')
  } catch (e) {
    const msg = e.message || e.original?.message || ''
    if (!msg.includes('already exists') && !msg.includes('Duplicate')) logger.warn('leave_approvals:', msg)
  }
  _leavesColumnsEnsured = true
}

/**
 * Leave Workflow Service
 * Two-step approval: Manager -> HR Head
 */
class LeaveWorkflowService {
  /**
   * Find HR Head for a user (from same company, or first HEAD_HR/HR)
   */
  async findHrHeadForUser(userId) {
    const user = await User.findByPk(userId, { attributes: ['id', 'companyId', 'hrHeadId'] })
    if (!user) return null
    if (user.hrHeadId) {
      const hr = await User.findByPk(user.hrHeadId, { where: { isActive: true } })
      return hr ? hr.id : null
    }
    // Prioritize HEAD_HR for leave approval; fallback to HR if no HEAD_HR
    let hrHead = await User.findOne({
      where: {
        isActive: true,
        role: 'HEAD_HR',
        ...(user.companyId ? { companyId: user.companyId } : {}),
      },
      attributes: ['id'],
    })
    if (!hrHead) {
      hrHead = await User.findOne({
        where: {
          isActive: true,
          role: { [Op.in]: ['HR', 'ADMIN'] },
          ...(user.companyId ? { companyId: user.companyId } : {}),
        },
        order: [['role', 'ASC']],
        attributes: ['id'],
      })
    }
    return hrHead ? hrHead.id : null
  }

  /**
   * Apply leave - status Pending_Manager, notify Reporting Manager
   */
  async applyLeave(userId, data) {
    const applicant = await User.findByPk(userId, {
      attributes: ['id', 'reportingManagerId', 'companyId'],
    })
    if (!applicant) throw new Error('User not found')
    if (!applicant.reportingManagerId) {
      throw new Error('Reporting Person is not assigned. Please contact HR to set your Reporting Person.')
    }

    const hrHeadId = await this.findHrHeadForUser(userId)

    try {
      return await Leave.create({
        userId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'Pending_Manager',
        reportingManagerId: applicant.reportingManagerId,
        hrHeadId,
      })
    } catch (err) {
      if (err.message?.includes("Unknown column 'hr_head_id'") || err.original?.message?.includes("Unknown column 'hr_head_id'")) {
        await ensureLeavesColumns()
        return await Leave.create({
          userId,
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          status: 'Pending_Manager',
          reportingManagerId: applicant.reportingManagerId,
          hrHeadId,
        })
      }
      throw err
    }
  }

  /**
   * Manager approves -> status Pending_HR, notify HR Head
   */
  async managerApprove(leaveId, managerId, comments = null) {
    const leave = await Leave.findByPk(leaveId)
    if (!leave) throw new Error('Leave not found')
    if (leave.status !== 'Pending_Manager') {
      throw new Error('Only Pending_Manager leaves can be approved by manager')
    }
    if (leave.reportingManagerId !== managerId) {
      throw new Error('Only the reporting manager can approve at this stage')
    }

    await leave.update({
      status: 'Pending_HR',
      managerApprovedBy: managerId,
      managerApprovedAt: new Date(),
    })

    await LeaveApproval.create({
      leaveId,
      approvedBy: managerId,
      approvalLevel: 'manager',
      action: 'approved',
      comments,
    })
    return leave
  }

  /**
   * Manager rejects -> status Rejected
   */
  async managerReject(leaveId, managerId, reason) {
    const leave = await Leave.findByPk(leaveId)
    if (!leave) throw new Error('Leave not found')
    if (leave.status !== 'Pending_Manager') {
      throw new Error('Only Pending_Manager leaves can be rejected by manager')
    }
    if (leave.reportingManagerId !== managerId) {
      throw new Error('Only the reporting manager can reject')
    }

    await leave.update({
      status: 'Rejected',
      approvedBy: managerId,
      approvedAt: new Date(),
      rejectionReason: reason,
    })

    await LeaveApproval.create({
      leaveId,
      approvedBy: managerId,
      approvalLevel: 'manager',
      action: 'rejected',
      comments: reason,
    })
    return leave
  }

  /**
   * HR Head final approve -> status Approved
   * ADMIN can approve any; otherwise must be assigned hrHeadId
   */
  async hrHeadApprove(leaveId, approverId, comments = null, isAdmin = false) {
    const leave = await Leave.findByPk(leaveId)
    if (!leave) throw new Error('Leave not found')
    if (leave.status !== 'Pending_HR') {
      throw new Error('Only Pending_HR leaves can be finally approved')
    }
    if (!isAdmin && leave.hrHeadId !== approverId) {
      throw new Error('Only the assigned HR Head can give final approval')
    }

    await leave.update({
      status: 'Approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      rejectionReason: null,
    })

    await LeaveApproval.create({
      leaveId,
      approvedBy: approverId,
      approvalLevel: 'hr_head',
      action: 'approved',
      comments,
    })
    return leave
  }

  /**
   * HR Head final reject -> status Rejected
   */
  async hrHeadReject(leaveId, approverId, reason, isAdmin = false) {
    const leave = await Leave.findByPk(leaveId)
    if (!leave) throw new Error('Leave not found')
    if (leave.status !== 'Pending_HR') {
      throw new Error('Only Pending_HR leaves can be finally rejected')
    }
    if (!isAdmin && leave.hrHeadId !== approverId) {
      throw new Error('Only the assigned HR Head can reject')
    }

    await leave.update({
      status: 'Rejected',
      approvedBy: approverId,
      approvedAt: new Date(),
      rejectionReason: reason,
    })

    await LeaveApproval.create({
      leaveId,
      approvedBy: approverId,
      approvalLevel: 'hr_head',
      action: 'rejected',
      comments: reason,
    })
    return leave
  }

  /**
   * Get leaves by role - Employee: own, Manager: team, HR/Admin: all
   */
  async getLeavesByRole(userId, userRole, filters = {}) {
    const { status, scope = 'my' } = filters
    const where = {}
    const uid = Number(userId) || userId

    if (status && ['Pending_Manager', 'Pending_HR', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
      where.status = status
    }

    const role = String(userRole || '').toUpperCase().replace(/\s+/g, '_')
    const roleOriginal = String(userRole || '').toUpperCase()
    const isAdminOrHR = ['ADMIN', 'HEAD_HR', 'HEADHR', 'HR', 'SYSTEM_ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(role) ||
      roleOriginal.includes('ADMIN') || roleOriginal.includes('HEAD') || roleOriginal.includes('HR')
    if (scope === 'pendingApproval') {
      if (isAdminOrHR) {
        // Admin/Head HR: show ALL pending leaves (including legacy 'Pending')
        where.status = { [Op.in]: ['Pending', 'Pending_Manager', 'Pending_HR'] }
      } else {
        // Reporting Person: Pending/Pending_Manager where reportingManagerId = me
        // Head HR: Pending_HR where hrHeadId = me (uid handles number/string)
        where[Op.or] = [
          { status: { [Op.in]: ['Pending', 'Pending_Manager'] }, reportingManagerId: uid },
          { status: 'Pending_HR', hrHeadId: uid },
        ]
      }
    } else if (scope === 'pendingManager') {
      where.status = 'Pending_Manager'
      where.reportingManagerId = userId
    } else if (scope === 'pendingHR') {
      where.status = 'Pending_HR'
      where.hrHeadId = userId
    } else if (scope === 'team') {
      where.reportingManagerId = userId
    } else if (scope === 'all' && isAdminOrHR) {
      // All leaves
    } else {
      where.userId = userId
    }

    return Leave.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'employeeCode', 'department'] },
        { model: User, as: 'reportingManager', attributes: ['id', 'name'], required: false },
        { model: User, as: 'hrHead', attributes: ['id', 'name'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    })
  }
}

module.exports = new LeaveWorkflowService()
module.exports.ensureLeavesColumns = ensureLeavesColumns
