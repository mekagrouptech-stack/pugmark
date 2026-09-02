const { Leave, User } = require('../models')
const { ForbiddenError } = require('../utils/errors')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

/**
 * Approval Controller - HR Head approvals
 * Salary, Attendance, Payroll, Employee records
 */
class ApprovalController {
  /**
   * Get pending approvals by type (HR Head only)
   * GET /api/approvals?type=leave|attendance|salary|payroll
   */
  async getPendingApprovals(req, res, next) {
    try {
      const { type = 'leave' } = req.query
      const currentUser = req.user
      const role = String(currentUser.role || '').toUpperCase()

      if (!['ADMIN', 'HEAD_HR', 'HR'].includes(role)) {
        throw new ForbiddenError('Only HR Head or Admin can view pending approvals')
      }

      if (type === 'leave') {
        const leaves = await Leave.findAll({
          where: {
            status: 'Pending',
          },
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'employeeCode', 'department'] },
            { model: User, as: 'reportingManager', attributes: ['id', 'name'], required: false },
          ],
          order: [['createdAt', 'DESC']],
        })
        return res.status(200).json({
          success: true,
          data: { leaves: leaves.map((l) => l.get({ plain: true })) },
          count: leaves.length,
        })
      }

      if (type === 'attendance') {
        return res.status(200).json({
          success: true,
          data: { attendance: [] },
          message: 'Attendance approval integration - use /api/attendance/requests',
        })
      }

      if (type === 'salary') {
        return res.status(200).json({
          success: true,
          data: { salary: [] },
          message: 'Salary approval integration - use payroll routes',
        })
      }

      res.status(200).json({
        success: true,
        data: {},
        message: 'Approval type not implemented',
      })
    } catch (error) {
      logger.error('Error in getPendingApprovals:', error)
      next(error)
    }
  }
}

module.exports = new ApprovalController()
