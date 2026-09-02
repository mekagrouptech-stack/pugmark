const payrollService = require('../services/payrollService')
const payrollScheduler = require('../services/payrollScheduler')
const { Payroll, User } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const { asyncHandler } = require('../utils/asyncHandler')

/**
 * Manually trigger payroll calculation for previous month
 * POST /api/payroll/run-auto
 */
const runAutoPayroll = asyncHandler(async (req, res) => {
  try {
    const result = await payrollScheduler.triggerManualCalculation()

    res.status(200).json({
      success: true,
      message: 'Payroll calculation completed successfully',
      data: result,
    })
  } catch (error) {
    logger.error('Error in runAutoPayroll:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run payroll calculation',
    })
  }
})

/**
 * Get payroll status and scheduler information
 * GET /api/payroll/status
 */
const getPayrollStatus = asyncHandler(async (req, res) => {
  try {
    const schedulerStatus = payrollScheduler.getStatus()
    const { year, month } = payrollService.getPreviousMonth()

    // Get count of payrolls for previous month
    const payrollCount = await Payroll.count({
      where: {
        payrollYear: year,
        payrollMonth: month,
      },
    })

    res.status(200).json({
      success: true,
      data: {
        scheduler: schedulerStatus,
        previousMonth: {
          year,
          month,
          monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }),
        },
        payrollCount,
      },
    })
  } catch (error) {
    logger.error('Error in getPayrollStatus:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payroll status',
    })
  }
})

/**
 * Get all payrolls with filters
 * GET /api/payroll
 */
const getPayrolls = asyncHandler(async (req, res) => {
  try {
    const { month, year, userId, status, companyId } = req.query
    const user = req.user // From authentication middleware

    const whereClause = {}

    if (month) {
      whereClause.payrollMonth = parseInt(month)
    }

    if (year) {
      whereClause.payrollYear = parseInt(year)
    }

    if (userId) {
      whereClause.userId = parseInt(userId)
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    // Company boundary check: Non-admin users can only see their company's payroll
    if (companyId) {
      whereClause.companyId = parseInt(companyId)
    } else if (user.role !== 'ADMIN' && user.role !== 'HEAD_HR' && user.role !== 'HR') {
      // Regular employees and managers can only see their own company's payroll
      if (user.companyId) {
        whereClause.companyId = user.companyId
      } else {
        // User has no company, return empty
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        })
      }
    }

    const payrolls = await Payroll.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'employeeCode', 'department', 'designation', 'companyId'],
        },
      ],
      order: [['payrollYear', 'DESC'], ['payrollMonth', 'DESC'], ['createdAt', 'DESC']],
    })

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
    })
  } catch (error) {
    logger.error('Error in getPayrolls:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payrolls',
    })
  }
})

/**
 * Get payroll by ID
 * GET /api/payroll/:id
 */
const getPayrollById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user // From authentication middleware

    const payroll = await Payroll.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'employeeCode', 'department', 'designation', 'companyId'],
        },
      ],
    })

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found',
      })
    }

    // Company boundary check: Non-admin users can only access their company's payroll
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_HR' && user.role !== 'HR') {
      if (user.companyId !== payroll.companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view payrolls from your company.',
        })
      }
      
      // Employees can only view their own payroll
      if (user.role === 'EMPLOYEE' && user.id !== payroll.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own payroll.',
        })
      }
    }

    res.status(200).json({
      success: true,
      data: payroll,
    })
  } catch (error) {
    logger.error('Error in getPayrollById:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payroll',
    })
  }
})

/**
 * Get attendance summary before payroll generation
 * GET /api/payroll/attendance-summary/:userId/:year/:month
 */
const getAttendanceSummary = asyncHandler(async (req, res) => {
  try {
    const { userId, year, month } = req.params

    if (!userId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'userId, year, and month are required',
      })
    }

    const userIdNum = parseInt(userId)
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)

    if (isNaN(userIdNum) || isNaN(yearNum) || isNaN(monthNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId, year, or month',
      })
    }

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12',
      })
    }

    // Get attendance summary
    const summary = await payrollService.getAttendanceSummary(userIdNum, yearNum, monthNum)

    res.status(200).json({
      success: true,
      message: 'Attendance summary retrieved successfully',
      data: summary,
    })
  } catch (error) {
    logger.error('Error in getAttendanceSummary:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance summary',
    })
  }
})

/**
 * Calculate payroll for specific employee and month
 * POST /api/payroll/calculate
 */
const calculatePayroll = asyncHandler(async (req, res) => {
  try {
    const { userId, year, month, forceUpdate } = req.body

    if (!userId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'userId, year, and month are required',
      })
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12',
      })
    }

    // For manual generation, always allow force update
    const shouldForceUpdate = forceUpdate === true || forceUpdate === 'true'

    try {
      const payroll = await payrollService.calculatePayrollForEmployee(userId, year, month, shouldForceUpdate)

      // If payroll exists and is locked, but we didn't force update, inform the user
      if (payroll && payroll.status === 'LOCKED' && !shouldForceUpdate) {
        return res.status(200).json({
          success: true,
          message: 'Payroll already exists and is locked. Use forceUpdate=true to regenerate.',
          data: payroll,
          locked: true,
        })
      }

      res.status(200).json({
        success: true,
        message: payroll.id ? 'Payroll updated successfully' : 'Payroll calculated successfully',
        data: payroll,
      })
    } catch (error) {
      // Catch specific validation errors and return them with 400 status
      if (
        error.message.includes('no company assigned') ||
        error.message.includes('Company') ||
        error.message.includes('monthly salary') ||
        error.message.includes('not found') ||
        error.message.includes('not active')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message || 'User is not eligible for payroll calculation',
          data: null,
        })
      }
      // Re-throw other errors to be handled by error handler
      throw error
    }
  } catch (error) {
    logger.error('Error in calculatePayroll:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate payroll',
    })
  }
})

/**
 * Calculate payroll for ALL active employees for a given month
 * POST /api/payroll/calculate-all
 */
const calculateAllPayroll = asyncHandler(async (req, res) => {
  try {
    const { year, month } = req.body

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year and month are required',
      })
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12',
      })
    }

    const results = await payrollService.calculatePayrollForAllEmployees(parseInt(year), parseInt(month))

    res.status(200).json({
      success: true,
      message: `Payroll calculated for ${results.processed} employee(s). ${results.failed} failed, ${results.skipped} skipped.`,
      data: results,
    })
  } catch (error) {
    logger.error('Error in calculateAllPayroll:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate payroll for all employees',
    })
  }
})

module.exports = {
  runAutoPayroll,
  getPayrollStatus,
  getPayrolls,
  getPayrollById,
  getAttendanceSummary,
  calculatePayroll,
  calculateAllPayroll,
}
