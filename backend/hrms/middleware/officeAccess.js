const officeService = require('../services/officeService')
const { ForbiddenError } = require('../utils/errors')

/**
 * Office Access Middleware
 * Validates that user has access to the requested office
 */
const validateOfficeAccess = async (req, res, next) => {
  try {
    const { officeId } = req.body
    const userId = req.user.id
    const userRole = req.user.role

    if (!officeId) {
      return next()
    }

    const hasAccess = await officeService.checkUserOfficeAccess(userId, officeId, userRole)

    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this office')
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  validateOfficeAccess,
}
