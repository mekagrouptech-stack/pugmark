import React from 'react'
import { useSelector } from 'react-redux'
import { hasPermission } from '../../utils/permissionUtils'
import { PERMISSION_KEYS } from '../../features/permissions/permissionService'

/**
 * Wrapper component that shows/hides children based on permission
 */
const PermissionWrapper = ({ 
  permission, 
  children, 
  fallback = null,
  requireAll = false,
  permissions = null 
}) => {
  const { user } = useSelector((state) => state.auth)
  const permissionState = useSelector((state) => state.permission.permissions)

  if (!user) {
    return fallback
  }

  const userRole = user.role
  const permissionsToCheck = permissions || permissionState

  // Handle array of permissions (requireAll determines if all or any)
  if (Array.isArray(permission)) {
    if (requireAll) {
      const hasAll = permission.every((p) => 
        hasPermission(userRole, p, permissionsToCheck)
      )
      return hasAll ? children : fallback
    } else {
      const hasAny = permission.some((p) => 
        hasPermission(userRole, p, permissionsToCheck)
      )
      return hasAny ? children : fallback
    }
  }

  // Single permission check
  const hasAccess = hasPermission(userRole, permission, permissionsToCheck)
  return hasAccess ? children : fallback
}

export default PermissionWrapper
