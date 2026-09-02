import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getRoleDashboard } from './roleGuard'
import { getRoutePermission, hasPermission } from './permissionUtils'
import { PERMISSION_KEYS } from '../features/permissions/permissionService'

/**
 * Enhanced ProtectedRoute with permission checking
 */
export const PermissionProtectedRoute = ({ 
  children, 
  allowedRoles = [],
  requiredPermission = null,
  fallbackPath = null 
}) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const permissions = useSelector((state) => state.permission.permissions)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Admin / System Admin always has access
    const roleUpper = (user?.role || '').toUpperCase()
    if (roleUpper === 'ADMIN' || roleUpper === 'SYSTEM ADMIN' || roleUpper === 'SYSTEM ADMINISTRATOR') {
      return children
    }
    const dashboard = getRoleDashboard(user?.role)
    return <Navigate to={dashboard} replace />
  }

  // Check permission-based access
  if (requiredPermission) {
    const hasAccess = hasPermission(user?.role, requiredPermission, permissions)
    // Admin always has access to everything
    if (user?.role === 'ADMIN' || user?.role === 'admin') {
      return children
    }
    if (!hasAccess) {
      const redirectPath = fallbackPath || getRoleDashboard(user?.role) || '/dashboard'
      return <Navigate to={redirectPath} replace />
    }
  }

  // Auto-detect permission from route
  if (!requiredPermission) {
    const currentPath = window.location.pathname
    const routePermission = getRoutePermission(currentPath)
    if (routePermission) {
      const hasAccess = hasPermission(user?.role, routePermission, permissions)
      if (!hasAccess) {
        // Admin / System Admin always has access
        const roleUpper = (user?.role || '').toUpperCase()
        if (roleUpper === 'ADMIN' || roleUpper === 'SYSTEM ADMIN' || roleUpper === 'SYSTEM ADMINISTRATOR') {
          return children
        }
        const redirectPath = fallbackPath || getRoleDashboard(user?.role) || '/dashboard'
        return <Navigate to={redirectPath} replace />
      }
    }
  }

  return children
}

export default PermissionProtectedRoute
