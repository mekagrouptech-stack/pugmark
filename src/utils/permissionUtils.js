import { PERMISSION_KEYS } from '../features/permissions/permissionService'

/**
 * Check if user has permission for a specific feature
 */
export const hasPermission = (userRole, permission, permissions) => {
  if (!userRole || !permissions) return false
  const normalizedRole = String(userRole).toLowerCase()
  // Admin / System Admin always has full access
  if (['admin', 'system admin', 'system administrator'].includes(normalizedRole)) {
    return true
  }
  const rolePermissions = permissions[normalizedRole] || permissions[userRole] || []
  return rolePermissions.includes(permission)
}

/**
 * Check if user has any of the given permissions
 */
export const hasAnyPermission = (userRole, permissionList, permissions) => {
  if (!userRole || !permissions || !permissionList.length) return false
  return permissionList.some((permission) => hasPermission(userRole, permission, permissions))
}

/**
 * Check if user has all of the given permissions
 */
export const hasAllPermissions = (userRole, permissionList, permissions) => {
  if (!userRole || !permissions || !permissionList.length) return false
  return permissionList.every((permission) => hasPermission(userRole, permission, permissions))
}

/**
 * Filter items based on permissions
 */
export const filterByPermission = (items, userRole, permissions, permissionKey = 'permission') => {
  if (!userRole || !permissions) return []
  return items.filter((item) => {
    const requiredPermission = item[permissionKey]
    if (!requiredPermission) return true // No permission required
    return hasPermission(userRole, requiredPermission, permissions)
  })
}

/**
 * Get route permission mapping
 */
export const getRoutePermission = (path) => {
  const routePermissionMap = {
    '/dashboard': PERMISSION_KEYS.DASHBOARD,
    '/project': PERMISSION_KEYS.PROJECTS,
    '/task': PERMISSION_KEYS.TASKS,
    '/approval': PERMISSION_KEYS.APPROVALS,
    '/dar': PERMISSION_KEYS.DAR,
    '/dar/timesheet': PERMISSION_KEYS.DAR,
    '/dar/client': PERMISSION_KEYS.DAR,
    '/dar/project': PERMISSION_KEYS.DAR,
    '/dar/team-timesheet': PERMISSION_KEYS.DAR,
    '/dar/edit-timesheet': PERMISSION_KEYS.DAR,
    '/dar/day-to-day': PERMISSION_KEYS.DAR,
    '/dar/incomplete': PERMISSION_KEYS.DAR,
    '/dar/import': PERMISSION_KEYS.DAR,
    '/dar/my-utilization': PERMISSION_KEYS.DAR,
    '/dar/team-utilization': PERMISSION_KEYS.DAR,
    '/dar/gantt': PERMISSION_KEYS.DAR,
    '/dar/calendar': PERMISSION_KEYS.DAR,
    '/reports': PERMISSION_KEYS.REPORTS,
    '/workflow': PERMISSION_KEYS.WORKFLOW_DIAGRAM,
    '/admin': PERMISSION_KEYS.ADMIN_SETTINGS,
    '/leaves': PERMISSION_KEYS.LEAVES,
    '/attendance': PERMISSION_KEYS.ATTENDANCE,
    '/timesheet': PERMISSION_KEYS.TIMESHEET,
    '/salary': PERMISSION_KEYS.SALARY,
    '/reimbursements': PERMISSION_KEYS.REIMBURSEMENTS,
    '/resignation': PERMISSION_KEYS.RESIGNATION,
    '/helpdesk': PERMISSION_KEYS.HELPDESK,
    '/my-team': PERMISSION_KEYS.MY_TEAM,
  }

  // Check exact match first
  if (routePermissionMap[path]) {
    return routePermissionMap[path]
  }

  // Check prefix match
  for (const [route, permission] of Object.entries(routePermissionMap)) {
    if (path.startsWith(route)) {
      return permission
    }
  }

  return null
}

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  filterByPermission,
  getRoutePermission,
}
