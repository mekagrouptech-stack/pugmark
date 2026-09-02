const jwt = require('jsonwebtoken')
const { UnauthorizedError } = require('../utils/errors')

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'))
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'))
    }
    next(error)
  }
}

/**
 * Optional Authentication Middleware
 * Attaches user if token is present, but doesn't require it
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      }
    }

    next()
  } catch (error) {
    // Ignore authentication errors for optional auth
    next()
  }
}

/**
 * Geofence Override Middleware
 * Determines if user can override geofence restrictions
 * Managers, Admins, and HR can override
 */
const canOverrideGeofence = (req, res, next) => {
  const userRole = req.user?.role

  // Roles that can override geofence
  const overrideRoles = ['ADMIN', 'MANAGER', 'HR', 'HEAD_HR', 'HOD']

  // Set canOverride flag on request
  req.canOverride = overrideRoles.includes(userRole)

  next()
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  canOverrideGeofence,
}
