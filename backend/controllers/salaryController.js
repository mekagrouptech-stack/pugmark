const { User, EmploymentInformation, PersonalInformation, Payroll, Leave } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const { computeSalaryStructure } = require('../utils/salaryStructure')

const EL_MONTHLY_ACCRUAL = 2.5 // earned-leave accrued per month (30/yr)

// Count how many days of an approved leave fall inside [monthStart, monthEnd].
const overlapDays = (leave, monthStart, monthEnd) => {
  const s = new Date(leave.startDate)
  const e = new Date(leave.endDate)
  const from = s > monthStart ? s : monthStart
  const to = e < monthEnd ? e : monthEnd
  if (to < from) return 0
  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1
}

// Classify a leave_type into EL (earned), CO (comp-off) or LWP (unpaid).
const isEarnedLeave = (type = '') => /earn|(^|\W)el(\W|$)/i.test(String(type))
const isCompOff = (type = '') => /comp|(^|\W)co(\W|$)/i.test(String(type))
const isUnpaidLeaveType = (type = '') => /lwp|without\s*pay|unpaid/i.test(String(type))

/**
 * Build the attendance + leave "days summary" for the slip, based on the most
 * recent processed payroll month and the approved leaves in that month.
 */
async function buildDaysSummary(userId, monthArg = null, yearArg = null) {
  const order = [
    ['payrollYear', 'DESC'],
    ['payrollMonth', 'DESC'],
  ]
  let payroll = null
  if (monthArg && yearArg) {
    // Specific pay period requested (e.g. from the HR Payroll download).
    payroll = await Payroll.findOne({
      where: { userId, payrollMonth: Number(monthArg), payrollYear: Number(yearArg) },
    })
  }
  if (!payroll) {
    // Prefer the most recent payroll that reflects actual pay (payable days > 0);
    // fall back to the latest payroll of any kind so a genuinely-zero month still shows.
    payroll = await Payroll.findOne({
      where: { userId, payableDays: { [Op.gt]: 0 } },
      order,
    })
  }
  if (!payroll) {
    payroll = await Payroll.findOne({ where: { userId }, order })
  }
  if (!payroll) return null

  const year = payroll.payrollYear
  const month = payroll.payrollMonth
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  // Leaves availed in the month, split by type (EL / CO / LWP).
  let availedEL = 0
  let availedCO = 0
  let availedLWP = 0
  try {
    const leaves = await Leave.findAll({
      where: {
        userId,
        status: 'Approved',
        startDate: { [Op.lte]: monthEnd },
        endDate: { [Op.gte]: monthStart },
      },
    })
    leaves.forEach((lv) => {
      const days = overlapDays(lv, monthStart, monthEnd)
      if (isEarnedLeave(lv.leaveType)) availedEL += days
      else if (isCompOff(lv.leaveType)) availedCO += days
      else if (isUnpaidLeaveType(lv.leaveType)) availedLWP += days
    })
  } catch (err) {
    logger.warn('buildDaysSummary: leave lookup failed', err.message)
  }

  const monthLabel = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return {
    period: monthLabel,
    paidDays: Number(payroll.payableDays) || 0,
    // Unpaid days = LOP (no punch) plus any approved unpaid leave in the month.
    unpaidDaysLWP: (Number(payroll.lopDays) || 0) + availedLWP,
    // Leaves availed this month
    availed: {
      el: availedEL, // Earned Leave
      co: availedCO, // Compensatory Off
      nh: 0, // National Holiday — no holiday calendar table yet (placeholder)
    },
    // Leave accrued this month (no accrual/comp-off tables yet — EL is a nominal accrual)
    accrued: {
      co: 0,
      el: EL_MONTHLY_ACCRUAL,
    },
  }
}

/**
 * Build the full salary-slip data object for a user. Shared by the employee's
 * own "My Salary" page and the HR Payroll download so both render the SAME
 * latest salary-slip design. `month`/`year` pin the attendance-leave summary to
 * a specific pay period (e.g. the payroll row being downloaded).
 */
async function buildSalaryResponse(userId, { month = null, year = null } = {}) {
  const user = await User.findByPk(userId, {
    attributes: [
      'id',
      'name',
      'employeeCode',
      'department',
      'designation',
      'monthlySalary',
      'pfEnabled',
      'monthlyTds',
    ],
  })
  if (!user) return null

  const monthlyCTC = user.monthlySalary != null ? Number(user.monthlySalary) : 0
  const structure = computeSalaryStructure(monthlyCTC, user.pfEnabled, user.monthlyTds)

  // Optional employee detail tables — fall back to null when a row is missing.
  let employment = null
  let personal = null
  try {
    employment = await EmploymentInformation.findOne({ where: { userId } })
  } catch (err) {
    logger.warn('buildSalaryResponse: employment_information lookup failed', err.message)
  }
  try {
    personal = await PersonalInformation.findOne({ where: { userId } })
  } catch (err) {
    logger.warn('buildSalaryResponse: personal_information lookup failed', err.message)
  }

  let daysSummary = null
  try {
    daysSummary = await buildDaysSummary(userId, month, year)
  } catch (err) {
    logger.warn('buildSalaryResponse: days summary build failed', err.message)
  }

  return {
    employee: {
      id: user.id,
      name: user.name || null,
      employeeCode: user.employeeCode || null,
      department: user.department || null,
      designation: user.designation || null,
      dateOfJoining: employment?.dateOfJoining || null,
      location: employment?.workLocation || null,
      pan: personal?.panNumber || null,
    },
    hasStructure: monthlyCTC > 0,
    daysSummary,
    ...structure,
    // Backward-compatible flat fields for any legacy consumer
    basic: structure.basic,
    hra: structure.hra,
    allowances: structure.allowances,
    deductions: structure.deductions,
    netSalary: structure.takeHomeMonthly,
  }
}

/**
 * Salary Controller
 * Serves logged-in user's salary data for "My Salary" page.
 */
class SalaryController {
  /**
   * Get my salary (logged-in user)
   * GET /api/salary/me
   */
  async getMySalary(req, res, next) {
    try {
      const data = await buildSalaryResponse(req.user.id)
      res.status(200).json({
        success: true,
        message: 'Salary retrieved successfully',
        data: data || {},
      })
    } catch (error) {
      logger.error('Error in getMySalary:', error)
      next(error)
    }
  }

  /**
   * Get the salary-slip structure for a specific employee (HR/Admin use).
   * GET /api/salary/structure/:userId?month=&year=
   * Returns the SAME shape as /salary/me so the HR Payroll page can render the
   * latest salary-slip design. month/year pin the attendance-leave summary.
   */
  async getUserSalaryStructure(req, res, next) {
    try {
      const userId = Number(req.params.userId)
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' })
      }
      const { month, year } = req.query
      const data = await buildSalaryResponse(userId, { month, year })
      if (!data) {
        return res.status(404).json({ success: false, message: 'Employee not found' })
      }
      res.status(200).json({
        success: true,
        message: 'Salary structure retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getUserSalaryStructure:', error)
      next(error)
    }
  }
}

module.exports = new SalaryController()
