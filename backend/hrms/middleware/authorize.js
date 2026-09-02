const { ForbiddenError } = require('../utils/errors')

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'))
    }

    // Flatten array if first element is an array (handles both authorize(['ADMIN']) and authorize('ADMIN', 'HR'))
    let rolesArray = allowedRoles
    if (allowedRoles.length === 1 && Array.isArray(allowedRoles[0])) {
      rolesArray = allowedRoles[0]
    }

    // Normalize roles to uppercase for comparison (case-insensitive)
    const userRole = req.user.role ? String(req.user.role).toUpperCase() : null
    const normalizedAllowedRoles = rolesArray
      .filter(role => role) // Filter out undefined/null
      .map(role => String(role).toUpperCase())

    if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Access denied. Required roles: ${rolesArray.join(', ')}. Your role: ${req.user.role || 'none'}`
        )
      )
    }

    next()
  }
}

/**
 * Like authorize(), but also lets through anyone who has people reporting to
 * them, whatever their role label says.
 *
 * Being a reporting person is a property of the org chart, not of the role: most
 * managers in this system are stored as EMPLOYEE and only become a manager by
 * having `reportingManagerId` point at them. A plain role check therefore locked
 * real reporting persons out of the team screens that exist for them, while the
 * sidebar still offered the menu.
 */
const authorizeOrReportingPerson = (...allowedRoles) => {
  const roleGate = authorize(...allowedRoles)

  return async (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'))
    }

    // The role check is the cheap path — only ask the database about the org
    // chart for users the roles alone would have rejected.
    roleGate(req, res, (err) => {
      if (!err) return next()

      // Required late: this module is loaded before the models are wired up.
      const { User } = require('../models')
      User.count({ where: { reportingManagerId: req.user.id, isActive: true } })
        .then((reports) => {
          if (reports === 0) return next(err)
          // Flags that the caller got in on the org chart rather than on their
          // role. Handlers that would otherwise return company-wide data MUST
          // narrow it to this user's own reports when they see this — the role
          // check that normally guarantees that breadth did not pass.
          req.viaReportingPerson = true
          next()
        })
        .catch(next)
    })
  }
}

/**
 * Check if user is admin or manager
 */
const isAdminOrManager = (req, res, next) => {
  if (!req.user) {
    return next(new ForbiddenError('Authentication required'))
  }

  // Case-insensitive role check
  const userRole = req.user.role ? String(req.user.role).toUpperCase() : null
  const adminRoles = ['ADMIN', 'MANAGER', 'HR', 'HEAD_HR']
  if (!userRole || !adminRoles.includes(userRole)) {
    return next(new ForbiddenError('Admin or Manager access required'))
  }

  next()
}

/**
 * Check if user can override geofence
 * Admins, Managers, and HR can override
 */
const canOverrideGeofence = (req, res, next) => {
  if (!req.user) {
    return next(new ForbiddenError('Authentication required'))
  }

  // Case-insensitive role check
  const userRole = req.user.role ? String(req.user.role).toUpperCase() : null
  const overrideRoles = ['ADMIN', 'MANAGER', 'HR', 'HEAD_HR']
  req.canOverride = userRole ? overrideRoles.includes(userRole) : false

  next()
}

module.exports = {
  authorize,
  authorizeOrReportingPerson,
  isAdminOrManager,
  canOverrideGeofence,
}
