const { ForbiddenError } = require('../utils/errors')
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('../config/rbac')

/**
 * Check if user has required role(s)
 * @param {...string} allowedRoles - Role(s) that can access (ADMIN, HEAD_HR, HR, MANAGER, EMPLOYEE)
 */
const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat()
  return (req, res, next) => {
    if (!req.user) return next(new ForbiddenError('Authentication required'))
    const userRole = String(req.user.role || '').toUpperCase()
    if (!userRole || !roles.map((r) => String(r).toUpperCase()).includes(userRole)) {
      return next(new ForbiddenError(`Access denied. Required role(s): ${roles.join(', ')}`))
    }
    next()
  }
}

/**
 * Check if user has required permission
 * @param {string} permission - Permission key (e.g. 'leave:approve_hr')
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) return next(new ForbiddenError('Authentication required'))
    const userRole = String(req.user.role || '').toUpperCase()
    const perms = ROLE_PERMISSIONS[userRole] || []
    const hasFullAccess = perms.includes('*')
    const hasPermission = hasFullAccess || perms.includes(permission) || perms.includes(permission.split(':')[0] + ':*')
    if (!hasPermission) {
      return next(new ForbiddenError(`Permission denied: ${permission}`))
    }
    next()
  }
}

/**
 * Super Admin only
 */
const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN)

/**
 * HR Head or Super Admin (for final approvals)
 */
const requireHRHeadOrAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.HR_HEAD, 'HR')

/**
 * Reporting Manager or higher
 */
const requireManagerOrAbove = requireRole(ROLES.SUPER_ADMIN, ROLES.HR_HEAD, 'HR', ROLES.REPORTING_MANAGER, 'HOD')

module.exports = {
  requireRole,
  requirePermission,
  requireSuperAdmin,
  requireHRHeadOrAbove: requireHRHeadOrAdmin,
  requireManagerOrAbove,
  ROLES,
  PERMISSIONS,
}
