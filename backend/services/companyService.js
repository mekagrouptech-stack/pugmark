const { Company, User, sequelize } = require('../models')
const { NotFoundError, BadRequestError } = require('../utils/errors')
const logger = require('../utils/logger')
const { Op } = require('sequelize')

/**
 * Company Service
 * Handles company-related business logic
 */
class CompanyService {
  /**
   * Generate a new unique company code
   * Format: COMP001, COMP002, ...
   * @returns {Promise<string>} New company code
   */
  async generateCompanyCode() {
    const prefix = 'COMP'

    // Find the last company code starting with the prefix
    const lastCompany = await Company.findOne({
      where: {
        companyCode: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [['companyCode', 'DESC']],
    })

    let nextNumber = 1

    if (lastCompany && lastCompany.companyCode) {
      const match = lastCompany.companyCode.match(/(\d+)$/)
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const paddedNumber = String(nextNumber).padStart(3, '0')
    return `${prefix}${paddedNumber}`
  }

  /**
   * Get all companies
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of companies
   */
  async getAllCompanies(filters = {}) {
    try {
      const { isActive, country, search } = filters
      const whereClause = {}

      if (isActive !== undefined) {
        whereClause.isActive = isActive
      }

      if (country) {
        whereClause.country = country
      }

      if (search) {
        whereClause[Op.or] = [
          { companyName: { [Op.like]: `%${search}%` } },
          { companyCode: { [Op.like]: `%${search}%` } },
        ]
      }

      const companies = await Company.findAll({
        where: whereClause,
        order: [['companyName', 'ASC']],
      })

      return companies
    } catch (error) {
      logger.error('Error fetching companies:', error)
      throw error
    }
  }

  /**
   * Get company by ID
   * @param {number} companyId - Company ID
   * @returns {Promise<Object>} Company details
   */
  async getCompanyById(companyId) {
    try {
      const company = await Company.findByPk(companyId, {
        include: [
          {
            model: User,
            as: 'employees',
            attributes: ['id', 'name', 'email', 'employeeCode', 'isActive'],
            where: { isActive: true },
            required: false,
          },
        ],
      })

      if (!company) {
        throw new NotFoundError('Company not found')
      }

      return company
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('Error fetching company:', error)
      throw error
    }
  }

  /**
   * Get company by code
   * @param {string} companyCode - Company code
   * @returns {Promise<Object>} Company details
   */
  async getCompanyByCode(companyCode) {
    try {
      const company = await Company.findOne({
        where: { companyCode },
      })

      if (!company) {
        throw new NotFoundError('Company not found')
      }

      return company
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('Error fetching company by code:', error)
      throw error
    }
  }

  /**
   * Create a new company
   * @param {Object} companyData - Company data
   * @returns {Promise<Object>} Created company
   */
  async createCompany(companyData) {
    try {
      // Auto-generate company code if not provided
      if (!companyData.companyCode) {
        companyData.companyCode = await this.generateCompanyCode()
      }

      // Check if company code already exists
      const existingCompany = await Company.findOne({
        where: { companyCode: companyData.companyCode },
      })

      if (existingCompany) {
        throw new BadRequestError('Company code already exists')
      }

      // Set default working days config if not provided
      if (!companyData.workingDaysConfig) {
        companyData.workingDaysConfig = {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        }
      }

      const company = await Company.create(companyData)

      logger.info(`Company created: ${company.companyName} (${company.companyCode})`)

      return company
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error
      }
      logger.error('Error creating company:', error)
      throw error
    }
  }

  /**
   * Update company
   * @param {number} companyId - Company ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated company
   */
  async updateCompany(companyId, updateData) {
    try {
      const company = await this.getCompanyById(companyId)

      // Whitelist allowed fields for update (includes logoUrl for company logo)
      const allowedFields = [
        'companyCode', 'companyName', 'logoUrl', 'address', 'city', 'state', 'country',
        'postalCode', 'phone', 'email', 'website', 'currency', 'registrationNumber',
        'taxId', 'employeeCodePrefix', 'workingDaysConfig', 'payrollCycle', 'payrollDay', 'payslipTemplate', 'isActive',
      ]
      const sanitized = {}
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
          sanitized[key] = updateData[key]
        }
      }

      // Check if company code is being changed and if it already exists
      if (sanitized.companyCode && sanitized.companyCode !== company.companyCode) {
        const existingCompany = await Company.findOne({
          where: { companyCode: sanitized.companyCode },
        })

        if (existingCompany) {
          throw new BadRequestError('Company code already exists')
        }
      }

      await company.update(sanitized)

      logger.info(`Company updated: ${company.companyName} (ID: ${companyId})`)

      return company.reload()
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error
      }
      logger.error('Error updating company:', error)
      throw error
    }
  }

  /**
   * Delete company (soft delete by setting isActive to false)
   * @param {number} companyId - Company ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCompany(companyId) {
    try {
      const company = await this.getCompanyById(companyId) // throws NotFound if missing

      // Clear references so the hard delete doesn't orphan data or hit FK errors.
      // (all these company_id columns are nullable — employees/payrolls just get
      // unassigned from the deleted company.)
      await sequelize.query('UPDATE users SET company_id = NULL WHERE company_id = ?', {
        replacements: [companyId],
      })
      await sequelize.query('UPDATE employment_information SET company_id = NULL WHERE company_id = ?', {
        replacements: [companyId],
      })
      await sequelize.query('UPDATE payrolls SET company_id = NULL WHERE company_id = ?', {
        replacements: [companyId],
      })

      // Permanently remove the company row.
      await company.destroy()

      logger.info(`Company deleted: ${company.companyName} (ID: ${companyId})`)

      return true
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error
      }
      logger.error('Error deleting company:', error)
      throw error
    }
  }

  /**
   * Get working days configuration for a company
   * @param {number} companyId - Company ID
   * @returns {Promise<Object>} Working days configuration
   */
  async getWorkingDaysConfig(companyId) {
    try {
      const company = await this.getCompanyById(companyId)
      return company.workingDaysConfig || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      }
    } catch (error) {
      logger.error('Error fetching working days config:', error)
      throw error
    }
  }

  /**
   * Calculate total working days for a month based on company configuration
   * @param {number} companyId - Company ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<number>} Total working days
   */
  async getTotalWorkingDays(companyId, year, month) {
    try {
      const workingDaysConfig = await this.getWorkingDaysConfig(companyId)
      const daysInMonth = new Date(year, month, 0).getDate()
      let workingDays = 0

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day)
        const dayOfWeek = date.getDay()
        const dayName = dayNames[dayOfWeek]

        if (workingDaysConfig[dayName]) {
          workingDays++
        }
      }

      return workingDays
    } catch (error) {
      logger.error('Error calculating working days:', error)
      throw error
    }
  }
}

module.exports = new CompanyService()
