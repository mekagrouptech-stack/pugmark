import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { PROJECT_ROLES } from './constants'

export const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const roleUpper = (user?.role || '').toUpperCase()
  const isSystemAdmin = roleUpper === 'ADMIN' || roleUpper === 'SYSTEM ADMIN' || roleUpper === 'SYSTEM ADMINISTRATOR'
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role) && !isSystemAdmin) {
    // Redirect to role-specific dashboard (System Admin bypasses)
    const roleDashboardMap = {
      [PROJECT_ROLES.ADMIN]: '/admin/dashboard',
      [PROJECT_ROLES.HEAD_HR]: '/head-hr/dashboard',
      [PROJECT_ROLES.HR]: '/hr/dashboard',
      [PROJECT_ROLES.HOD]: '/hod/dashboard',
      [PROJECT_ROLES.EMPLOYEE]: '/employee/dashboard',
    }
    const dashboard = roleDashboardMap[user?.role] || '/dashboard'
    return <Navigate to={dashboard} replace />
  }

  return children
}

export const getRoleDashboard = (role) => {
  const roleUpper = (role || '').toUpperCase()
  const roleLower = (role || '').toLowerCase()
  // System Admin / System Administrator → Admin Dashboard
  if (roleUpper === 'SYSTEM ADMIN' || roleUpper === 'SYSTEM ADMINISTRATOR' || roleLower === 'system admin' || roleLower === 'system administrator') {
    return '/admin/dashboard'
  }
  const roleDashboardMap = {
    [PROJECT_ROLES.ADMIN]: '/admin/dashboard',
    [PROJECT_ROLES.HEAD_HR]: '/head-hr/dashboard',
    [PROJECT_ROLES.HR]: '/hr/dashboard',
    [PROJECT_ROLES.HOD]: '/hod/dashboard',
    [PROJECT_ROLES.EMPLOYEE]: '/employee/dashboard',
    // Legacy roles
    employee: '/employee/dashboard',
    manager: '/hod/dashboard',
    hr: '/hr/dashboard',
  }
  return roleDashboardMap[role] || roleDashboardMap[roleLower] || roleDashboardMap[roleUpper] || '/dashboard'
}
