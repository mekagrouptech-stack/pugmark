const { User, AttendanceRecord, Payroll, EmploymentInformation, Company } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const companyService = require('./companyService')
const { computePayrollStructure } = require('../utils/salaryStructure')

/**
 * Build a calendar date key (YYYY-MM-DD) from the LOCAL date components.
 * Using toISOString() here would convert to UTC and shift the day for any
 * non-UTC server timezone (e.g. IST +5:30 pushes local-midnight to the
 * previous day), which previously mis-attributed punches and inflated LOP.
 */
const toLocalDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Payroll Service
 * Handles automatic payroll calculation based on attendance
 */
class PayrollService {
  /**
   * Get total working days in a month based on company configuration
   * @param {number} companyId - Company ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<number>} Total working days
   */
  async getTotalWorkingDays(companyId, year, month) {
    let workingDays = null

    if (companyId) {
      // Try company-specific working days configuration first
      try {
        workingDays = await companyService.getTotalWorkingDays(companyId, year, month)
      } catch (error) {
        logger.warn(
          `getTotalWorkingDays: Error getting company-specific working days for company ${companyId}, falling back to default. Error: ${error.message}`
        )
      }
    }

    // If company-specific configuration is missing or returned 0/invalid, fallback to default
    if (!workingDays || workingDays <= 0) {
      const daysInMonth = new Date(year, month, 0).getDate()
      workingDays = 0

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day)
        const dayOfWeek = date.getDay()
        // Count Monday (1) to Friday (5) as working days
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          workingDays++
        }
      }

      logger.info(
        `getTotalWorkingDays: Using default Monday-Friday working days for year=${year}, month=${month}. Total=${workingDays}`
      )
    }

    return workingDays
  }

  /**
   * Get attendance summary for a user in a specific month
   * @param {number} userId - User ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} totalWorkingDays - Total working days (optional, will calculate if not provided)
   * @returns {Promise<Object>} Attendance summary
   */
  async getAttendanceSummary(userId, year, month, totalWorkingDays = null) {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(year, month, 0)
    endDate.setHours(23, 59, 59, 999)

    logger.info(`Fetching attendance for user ${userId}, month ${month}/${year}`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })

    // Materialize biometric punches for the month so payroll counts device
    // attendance (first=IN / last=OUT). Non-fatal — manual rows still counted.
    try {
      const biometricSync = require('./biometricAttendanceSync')
      const pad = (n) => String(n).padStart(2, '0')
      const startStr = `${year}-${pad(month)}-01`
      const endStr = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`
      await biometricSync.syncUserRange(userId, startStr, endStr)
    } catch (e) {
      logger.warn(`Biometric sync before payroll skipped for user ${userId}: ${e.message}`)
    }

    // Fetch all attendance records for the month
    // Check createdAt, checkInTime, and checkOutTime to catch all records
    const records = await AttendanceRecord.findAll({
      where: {
        userId,
        [Op.or]: [
          {
            createdAt: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
          {
            checkInTime: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
          {
            checkOutTime: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
        ],
      },
      order: [['createdAt', 'ASC']],
    })

    logger.info(`Found ${records.length} attendance records for user ${userId} in month ${month}/${year}`)

    // Group records by date
    const attendanceByDate = {}
    records.forEach((record) => {
      // Determine the date - use checkInTime/checkOutTime if available, otherwise createdAt
      let recordDate = record.createdAt
      if (record.punchType === 'IN' && record.checkInTime) {
        recordDate = record.checkInTime
      } else if (record.punchType === 'OUT' && record.checkOutTime) {
        recordDate = record.checkOutTime
      }
      
      const date = new Date(recordDate)
      const dateKey = toLocalDateKey(date)

      // Only process records that fall within the target month
      const recordMonth = date.getMonth() + 1 // JavaScript months are 0-indexed
      const recordYear = date.getFullYear()
      
      if (recordMonth !== month || recordYear !== year) {
        logger.debug(`Skipping record ${record.id} - date ${dateKey} is not in month ${month}/${year}`)
        return
      }

      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = {
          punches: [],
          date: dateKey,
        }
      }

      attendanceByDate[dateKey].punches.push({
        type: record.punchType,
        time: recordDate,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
      })
    })

    logger.info(`Grouped attendance into ${Object.keys(attendanceByDate).length} unique dates`)

    // Calculate attendance days
    let fullDays = 0
    let halfDays = 0
    let absentDays = 0

    // Get user's company to check working days config
    const user = await User.findByPk(userId, {
      include: [{ model: Company, as: 'company' }],
    })
    
    let workingDaysConfig = null
    if (user && user.company && user.company.workingDaysConfig) {
      workingDaysConfig = user.company.workingDaysConfig
    }

    // Default working days config (Monday–Friday) for backward compatibility.
    // Also handle the case where company.workingDaysConfig exists but is empty
    // or has all days set to false (which would make every day "non-working").
    const hasValidWorkingDaysConfig =
      workingDaysConfig &&
      Object.values(workingDaysConfig).some((val) => val === true)

    if (!hasValidWorkingDaysConfig) {
      workingDaysConfig = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      }
      logger.info(
        `getAttendanceSummary: using default Monday–Friday workingDaysConfig for user ${userId} (companyId: ${
          user ? user.companyId : 'N/A'
        })`
      )
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    // Calculate total working days if not provided
    // IMPORTANT: Use getTotalWorkingDays so company config + default fallback are both respected
    let workingDays = totalWorkingDays
    if (workingDays === null) {
      workingDays = await this.getTotalWorkingDays(user.companyId, year, month)
      logger.info(
        `getAttendanceSummary: computed workingDays via getTotalWorkingDays for user ${userId}, ` +
          `company ${user.companyId}, month ${month}/${year}: ${workingDays}`
      )
    }

    // Check each day in the month
    for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay()
      const dayName = dayNames[dayOfWeek]

      // Skip non-working days based on company configuration
      if (!workingDaysConfig[dayName]) {
        continue
      }

      const dateKey = toLocalDateKey(date)
      const dayAttendance = attendanceByDate[dateKey]

      if (!dayAttendance || dayAttendance.punches.length === 0) {
        absentDays++
      } else {
        // Check if there's both IN and OUT punch
        const hasIn = dayAttendance.punches.some((p) => p.type === 'IN')
        const hasOut = dayAttendance.punches.some((p) => p.type === 'OUT')

        if (hasIn && hasOut) {
          fullDays++
        } else if (hasIn || hasOut) {
          halfDays++
        } else {
          // This case should not occur, but handle it as absent
          absentDays++
        }
      }
    }

    const summary = {
      fullDays,
      halfDays,
      absentDays,
      totalWorkingDays: workingDays,
    }

    logger.info(`Attendance summary for user ${userId}, month ${month}/${year}:`, summary)
    logger.info(`Records found: ${records.length}, Dates with attendance: ${Object.keys(attendanceByDate).length}`)

    return summary
  }

  /**
   * Calculate payroll for a single employee
   * @param {number} userId - User ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {boolean} forceUpdate - Force update even if payroll is LOCKED (for manual generation)
   * @returns {Promise<Object>} Payroll calculation result
   */
  async calculatePayrollForEmployee(userId, year, month, forceUpdate = false) {
    try {
      // Fetch user with salary and company
      const user = await User.findByPk(userId, {
        include: [
          {
            model: EmploymentInformation,
            as: 'employmentInformation',
          },
          {
            model: Company,
            as: 'company',
          },
        ],
      })

      if (!user) {
        throw new Error(`User with ID ${userId} not found`)
      }

      if (!user.isActive) {
        throw new Error(`User ${userId} is not active`)
      }

      // Validate user has a company assigned
      if (!user.companyId) {
        const errorMsg = `User ${userId} (${user.name}) has no company assigned. Please assign a company to the user.`
        logger.warn(errorMsg)
        throw new Error(errorMsg)
      }

      // Fetch company details
      const company = user.company || (await Company.findByPk(user.companyId))
      if (!company) {
        const errorMsg = `Company ${user.companyId} not found for user ${userId}. Please check company assignment.`
        logger.warn(errorMsg)
        throw new Error(errorMsg)
      }
      if (!company.isActive) {
        const errorMsg = `Company ${user.companyId} is inactive for user ${userId}. Please activate the company.`
        logger.warn(errorMsg)
        throw new Error(errorMsg)
      }

      // Check if user has monthly salary
      if (!user.monthlySalary || user.monthlySalary <= 0) {
        const errorMsg = `User ${userId} (${user.name}) has no monthly salary set. Please set a monthly salary for the user.`
        logger.warn(errorMsg)
        throw new Error(errorMsg)
      }

      // Check if user joined before the payroll month (only warn, don't block for manual generation)
      const employmentInfo = user.employmentInformation
      if (employmentInfo && employmentInfo.dateOfJoining) {
        const joiningDate = new Date(employmentInfo.dateOfJoining)
        const payrollDate = new Date(year, month - 1, 1)
        if (joiningDate > payrollDate) {
          logger.warn(
            `User ${userId} joined on ${joiningDate.toISOString()}, after payroll month ${month}/${year}. Proceeding with manual generation.`
          )
          // Don't return null - allow manual generation even if joining date is after payroll month
        }
      }

      // Check if payroll already exists (company-aware)
      const existingPayroll = await Payroll.findOne({
        where: {
          userId,
          payrollMonth: month,
          payrollYear: year,
          companyId: user.companyId,
        },
      })

      // For manual generation with forceUpdate, allow updating even if LOCKED
      // Without forceUpdate, we still proceed to update if it exists (for manual generation flexibility)
      if (existingPayroll && existingPayroll.status === 'LOCKED' && !forceUpdate) {
        logger.info(
          `Payroll already processed and locked for user ${userId}, month ${month}/${year}. Proceeding with update for manual generation.`
        )
        // Continue to update the payroll even if locked (for manual generation)
      }

      // Get company-specific working days first
      const totalWorkingDays = await this.getTotalWorkingDays(user.companyId, year, month)
      
      // Get attendance summary (will use company-specific working days)
      const attendanceSummary = await this.getAttendanceSummary(userId, year, month, totalWorkingDays)

      // Validate attendance days
      const totalAttendanceDays = attendanceSummary.fullDays + attendanceSummary.halfDays + attendanceSummary.absentDays
      if (totalAttendanceDays > totalWorkingDays) {
        logger.warn(
          `Attendance days (${totalAttendanceDays}) exceed working days (${totalWorkingDays}) for user ${userId}. Using working days.`
        )
      }

      // Calculate payroll
      const monthlySalary = parseFloat(user.monthlySalary)
      const perDaySalary = monthlySalary / totalWorkingDays

      // Payable days = Full days + (Half days × 0.5)
      const payableDays = attendanceSummary.fullDays + attendanceSummary.halfDays * 0.5
      const lopDays = totalWorkingDays - payableDays

      // Final salary = Payable days × Per day salary
      const finalSalary = Math.round(payableDays * perDaySalary * 100) / 100 // Round to 2 decimals

      // Break the pay period down using the company salary structure (the same
      // one the salary slip renders) prorated by attendance. monthlySalary is
      // the Monthly CTC — the structure reverses it to Gross before splitting.
      const { earned } = computePayrollStructure(
        monthlySalary,
        user.pfEnabled,
        { payableDays, totalWorkingDays },
        user.monthlyTds
      )

      // Prepare company branding information
      const companyAddress = [
        company.address,
        company.city,
        company.state,
        company.postalCode,
        company.country,
      ]
        .filter(Boolean)
        .join(', ')

      const payrollData = {
        userId,
        companyId: user.companyId,
        payrollMonth: month,
        payrollYear: year,
        monthlySalary: monthlySalary,
        totalWorkingDays,
        fullDays: attendanceSummary.fullDays,
        halfDays: attendanceSummary.halfDays,
        absentDays: attendanceSummary.absentDays,
        payableDays: Math.round(payableDays * 100) / 100,
        lopDays: Math.round(lopDays * 100) / 100,
        perDaySalary: Math.round(perDaySalary * 100) / 100,
        finalSalary,
        // Salary structure breakup for this period
        pfEnabled: !!user.pfEnabled,
        basic: earned.basic,
        hra: earned.hra,
        specialAllowance: earned.specialAllowance,
        cca: earned.cca,
        conveyance: earned.conveyance,
        education: earned.education,
        bonus: earned.bonus,
        grossEarned: earned.grossEarned,
        employeePF: earned.employeePF,
        employerPF: earned.employerPF,
        professionalTax: earned.professionalTax,
        tds: earned.tds,
        gratuity: earned.gratuity,
        totalDeductions: earned.totalDeductions,
        netPayable: earned.netPayable,
        status: 'LOCKED',
        processedAt: new Date(),
        // Store company branding information at time of payroll generation
        companyName: company.companyName,
        companyAddress: companyAddress,
        companyLogoUrl: company.logoUrl,
        companyRegistrationNumber: company.registrationNumber,
      }

      // Create or update payroll record
      let payroll
      if (existingPayroll) {
        // If forceUpdate is true, update even if LOCKED
        if (forceUpdate && existingPayroll.status === 'LOCKED') {
          payrollData.status = 'LOCKED' // Keep it locked after update
        }
        payroll = await existingPayroll.update(payrollData)
        logger.info(`Updated payroll for user ${userId}, month ${month}/${year}${forceUpdate ? ' (forced update)' : ''}`)
      } else {
        payroll = await Payroll.create(payrollData)
        logger.info(`Created payroll for user ${userId}, month ${month}/${year}`)
      }

      return payroll
    } catch (error) {
      logger.error(`Error calculating payroll for user ${userId}, month ${month}/${year}:`, error)
      throw error
    }
  }

  /**
   * Calculate payroll for all active employees for a specific month (company-wise)
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} companyId - Optional company ID to process only specific company
   * @returns {Promise<Object>} Calculation summary
   */
  async calculatePayrollForAllEmployees(year, month, companyId = null) {
    try {
      logger.info(`Starting payroll calculation for month ${month}/${year}${companyId ? ` (Company: ${companyId})` : ''}`)

      // Build where clause
      const whereClause = {
        isActive: true,
      }

      // Filter by company if specified
      if (companyId) {
        whereClause.companyId = companyId
      } else {
        // Only process employees with companies assigned
        whereClause.companyId = { [Op.ne]: null }
      }

      // Fetch all active employees with companies
      const activeUsers = await User.findAll({
        where: whereClause,
        include: [
          {
            model: EmploymentInformation,
            as: 'employmentInformation',
          },
          {
            model: Company,
            as: 'company',
            where: { isActive: true },
            required: true, // Only include users with active companies
          },
        ],
      })

      logger.info(`Found ${activeUsers.length} active employees${companyId ? ` for company ${companyId}` : ''}`)

      // Group by company for better logging
      const companyGroups = {}
      activeUsers.forEach((user) => {
        const cid = user.companyId
        if (!companyGroups[cid]) {
          companyGroups[cid] = []
        }
        companyGroups[cid].push(user)
      })

      logger.info(`Processing ${Object.keys(companyGroups).length} company(ies)`)

      const results = {
        total: activeUsers.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        byCompany: {},
      }

      // Process each employee
      for (const user of activeUsers) {
        try {
          const payroll = await this.calculatePayrollForEmployee(user.id, year, month)
          if (payroll) {
            results.processed++
            // Track by company
            const cid = user.companyId
            if (!results.byCompany[cid]) {
              results.byCompany[cid] = { processed: 0, skipped: 0, failed: 0 }
            }
            results.byCompany[cid].processed++
          } else {
            results.skipped++
            const cid = user.companyId
            if (!results.byCompany[cid]) {
              results.byCompany[cid] = { processed: 0, skipped: 0, failed: 0 }
            }
            results.byCompany[cid].skipped++
          }
        } catch (error) {
          results.failed++
          const cid = user.companyId
          if (!results.byCompany[cid]) {
            results.byCompany[cid] = { processed: 0, skipped: 0, failed: 0 }
          }
          results.byCompany[cid].failed++
          results.errors.push({
            userId: user.id,
            employeeCode: user.employeeCode,
            name: user.name,
            companyId: user.companyId,
            error: error.message,
          })
          logger.error(`Failed to calculate payroll for user ${user.id} (${user.name}):`, error)
        }
      }

      logger.info(`Payroll calculation completed for month ${month}/${year}`, results)

      return results
    } catch (error) {
      logger.error(`Error in calculatePayrollForAllEmployees:`, error)
      throw error
    }
  }

  /**
   * Get payroll for previous month (N+1 execution)
   * @returns {Promise<Object>} Previous month details
   */
  getPreviousMonth() {
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    return {
      year: previousMonth.getFullYear(),
      month: previousMonth.getMonth() + 1, // JavaScript months are 0-indexed
    }
  }
}

module.exports = new PayrollService()
