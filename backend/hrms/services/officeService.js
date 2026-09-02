const { Office, UserOffice } = require('../models')
const { NotFoundError, BadRequestError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Office Service
 * Handles all office-related business logic
 */
class OfficeService {
  /**
   * Get office by ID
   * @param {number} officeId - Office ID
   * @returns {Promise<Object>} Office details
   */
  async getOfficeById(officeId) {
    try {
      const office = await Office.findOne({
        where: {
          id: officeId,
          isActive: true,
        },
      })

      if (!office) {
        throw new NotFoundError('Office not found or inactive')
      }

      return office
    } catch (error) {
      logger.error('Error fetching office:', error)
      throw error
    }
  }

  /**
   * Get all active offices
   * @returns {Promise<Array>} List of offices
   */
  async getAllOffices() {
    try {
      const offices = await Office.findAll({
        where: {
          isActive: true,
        },
        order: [['name', 'ASC']],
      })

      return offices
    } catch (error) {
      logger.error('Error fetching offices:', error)
      throw error
    }
  }

  /**
   * Get offices assigned to a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of office IDs
   */
  async getUserOffices(userId) {
    try {
      const userOffices = await UserOffice.findAll({
        where: {
          userId,
        },
        attributes: ['officeId'],
      })

      return userOffices.map((uo) => uo.officeId)
    } catch (error) {
      logger.error('Error fetching user offices:', error)
      throw error
    }
  }

  /**
   * Check if user has access to office
   * @param {number} userId - User ID
   * @param {number} officeId - Office ID
   * @param {string} userRole - User role
   * @returns {Promise<boolean>} True if user has access
   */
  async checkUserOfficeAccess(userId, officeId, userRole) {
    try {
      // Admins and managers can access all offices
      const adminRoles = ['ADMIN', 'MANAGER', 'HR', 'HEAD_HR', 'SUPER_ADMIN', 'COMPANY_ADMIN']
      if (adminRoles.includes((userRole || '').toUpperCase())) {
        return true
      }

      // Load all office assignments for this user
      const userAssignments = await UserOffice.findAll({
        where: { userId },
        attributes: ['officeId'],
      })

      if (userAssignments.length === 0) {
        // No explicit office assignments configured for this user.
        // To avoid blocking attendance during initial setup, allow access.
        return true
      }

      // Otherwise, ensure the requested office is explicitly assigned
      const assignment = userAssignments.find((uo) => uo.officeId === officeId)
      return !!assignment
    } catch (error) {
      logger.error('Error checking office access:', error)
      throw error
    }
  }

  /**
   * Get office location data for map rendering
   * Optimized for frontend map usage
   * @param {number} officeId - Office ID
   * @returns {Promise<Object>} Office location data
   */
  async getOfficeLocationForMap(officeId) {
    try {
      const office = await this.getOfficeById(officeId)

      return {
        id: office.id,
        name: office.name,
        country: office.country,
        address: office.address,
        latitude: parseFloat(office.latitude),
        longitude: parseFloat(office.longitude),
        radius: parseInt(office.radius),
        strictGeofencing: Boolean(office.strictGeofencing),
      }
    } catch (error) {
      logger.error('Error fetching office location for map:', error)
      throw error
    }
  }

  /**
   * Create office
   * @param {Object} officeData - Office data
   * @returns {Promise<Object>} Created office
   */
  async createOffice(officeData) {
    try {
      const office = await Office.create(officeData)
      return office
    } catch (error) {
      logger.error('Error creating office:', error)
      throw error
    }
  }

  /**
   * Update office
   * @param {number} officeId - Office ID
   * @param {Object} officeData - Office data
   * @returns {Promise<Object>} Updated office
   */
  async updateOffice(officeId, officeData) {
    try {
      const office = await this.getOfficeById(officeId)
      await office.update(officeData)
      return office.reload()
    } catch (error) {
      logger.error('Error updating office:', error)
      throw error
    }
  }

  /**
   * Delete office (soft delete by setting isActive to false)
   * @param {number} officeId - Office ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteOffice(officeId) {
    try {
      const office = await this.getOfficeById(officeId)
      await office.update({ isActive: false })
      return true
    } catch (error) {
      logger.error('Error deleting office:', error)
      throw error
    }
  }
}

module.exports = new OfficeService()
