const officeService = require('../services/officeService')
const { BadRequestError } = require('../utils/errors')

/**
 * Office Controller
 * Handles HTTP requests for office operations
 */
class OfficeController {
  /**
   * Get office location for map rendering
   * GET /api/offices/:id/location
   */
  async getOfficeLocation(req, res, next) {
    try {
      const { id } = req.params
      const officeId = parseInt(id)

      if (isNaN(officeId)) {
        throw new BadRequestError('Invalid office ID')
      }

      const location = await officeService.getOfficeLocationForMap(officeId)

      res.status(200).json({
        success: true,
        message: 'Office location retrieved successfully',
        data: location,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all offices
   * GET /api/offices
   */
  async getAllOffices(req, res, next) {
    try {
      const offices = await officeService.getAllOffices()

      res.status(200).json({
        success: true,
        message: 'Offices retrieved successfully',
        data: offices,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user's assigned offices
   * GET /api/offices/user/:userId
   */
  async getUserOffices(req, res, next) {
    try {
      const { userId } = req.params
      const userIdInt = parseInt(userId)

      if (isNaN(userIdInt)) {
        throw new BadRequestError('Invalid user ID')
      }

      const officeIds = await officeService.getUserOffices(userIdInt)

      res.status(200).json({
        success: true,
        message: 'User offices retrieved successfully',
        data: officeIds,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Check if user has access to office
   * GET /api/offices/:id/access
   */
  async checkOfficeAccess(req, res, next) {
    try {
      const { id } = req.params
      const officeId = parseInt(id)
      const userId = req.user.id
      const userRole = req.user.role

      if (isNaN(officeId)) {
        throw new BadRequestError('Invalid office ID')
      }

      const hasAccess = await officeService.checkUserOfficeAccess(userId, officeId, userRole)

      res.status(200).json({
        success: true,
        message: hasAccess ? 'User has access to office' : 'User does not have access to office',
        data: { hasAccess },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create office (Admin only)
   * POST /api/offices
   */
  async createOffice(req, res, next) {
    try {
      const officeData = req.body
      const office = await officeService.createOffice(officeData)

      res.status(201).json({
        success: true,
        message: 'Office created successfully',
        data: office,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update office (Admin only)
   * PUT /api/offices/:id
   */
  async updateOffice(req, res, next) {
    try {
      const { id } = req.params
      const officeId = parseInt(id)
      const officeData = req.body

      if (isNaN(officeId)) {
        throw new BadRequestError('Invalid office ID')
      }

      const office = await officeService.updateOffice(officeId, officeData)

      res.status(200).json({
        success: true,
        message: 'Office updated successfully',
        data: office,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete office (Admin only)
   * DELETE /api/offices/:id
   */
  async deleteOffice(req, res, next) {
    try {
      const { id } = req.params
      const officeId = parseInt(id)

      if (isNaN(officeId)) {
        throw new BadRequestError('Invalid office ID')
      }

      await officeService.deleteOffice(officeId)

      res.status(200).json({
        success: true,
        message: 'Office deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new OfficeController()
