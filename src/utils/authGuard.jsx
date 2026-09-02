import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export const ProtectedRoute = ({ children, allowedRoles = [], allowReportingPerson = false }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0) {
    const roleUpper = (user?.role || '').toUpperCase()
    // Admin / System Admin always has access to everything
    if (roleUpper === 'ADMIN' || roleUpper === 'SYSTEM ADMIN' || roleUpper === 'SYSTEM ADMINISTRATOR') {
      return children
    }
    // Case-insensitive role check (user.role may be 'MANAGER', allowedRoles has 'manager')
    const hasAccess = allowedRoles.some((r) => String(r || '').toUpperCase() === roleUpper)
    // The team screens belong to whoever has people reporting to them, which the
    // role does not say: reporting managers here are usually stored as EMPLOYEE.
    // The API applies the same rule, so this only opens pages the server will
    // actually serve data for.
    if (!hasAccess && !(allowReportingPerson && user?.isReportingPerson)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
