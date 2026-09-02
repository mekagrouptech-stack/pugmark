/**
 * Dashboard Service - Real API for role-based dashboard data
 * Uses GET /api/dashboard/me for logged-in user data (salary, attendance, working reports, calendar)
 * Uses GET /api/dashboard/stats for org-level stats (admin)
 */

import api from '../../services/api'

const dashboardService = {
  /**
   * Get logged-in user's dashboard data (real API)
   */
  getMyDashboard: async () => {
    const { data } = await api.get('/dashboard/me')
    const payload = data?.data || {}
    return {
      salary: payload.salary || { monthly: 0 },
      attendance: payload.attendance || payload.ownAttendance || { present: 0, absent: 0, leave: 0, totalDays: 0 },
      ownAttendance: payload.ownAttendance || payload.attendance,
      workingReports: payload.workingReports || payload.ownWorkingReports || { submitted: 0, approved: 0, pending: 0, total: 0 },
      ownWorkingReports: payload.ownWorkingReports || payload.workingReports,
      dailyAttendanceRecords: payload.dailyAttendanceRecords || [],
    }
  },

  /**
   * Get dashboard stats (org or user) - real API
   */
  getStats: async (companyId) => {
    const { data } = await api.get('/dashboard/stats', { params: companyId ? { companyId } : {} })
    return data?.data || {}
  },

  // Admin Dashboard: merge stats + my dashboard (real data for own cards and calendar)
  getAdminDashboard: async (userId) => {
    const [stats, myData] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getMyDashboard(),
    ])
    return {
      totalEmployees: stats.totalEmployees ?? 0,
      totalDepartments: stats.totalDepartments ?? 0,
      activeUsers: stats.totalEmployees ?? 0,
      inactiveUsers: 0,
      attendance: stats.monthlyAttendance
        ? {
            present: stats.monthlyAttendance.present ?? 0,
            absent: stats.monthlyAttendance.absent ?? 0,
            leave: stats.monthlyAttendance.onLeave ?? 0,
            totalDays:
              (stats.monthlyAttendance.present ?? 0) +
              (stats.monthlyAttendance.absent ?? 0) +
              (stats.monthlyAttendance.onLeave ?? 0) ||
              1,
          }
        : { present: 0, absent: 0, leave: 0, totalDays: 0 },
      workingReports: { submitted: 0, approved: 0, pending: 0, total: 0 },
      payroll: { totalMonthly: 0, paid: 0, pending: 0 },
      departments: [],
      salary: myData.salary,
      ownAttendance: myData.ownAttendance,
      ownWorkingReports: myData.ownWorkingReports,
      teamAttendance: { present: 0, absent: 0, leave: 0, totalDays: 0, totalEmployees: 0 },
      dailyAttendanceRecords: myData.dailyAttendanceRecords,
    }
  },

  // Employee Dashboard: real API only
  getEmployeeDashboard: async (userId) => {
    return dashboardService.getMyDashboard()
  },

  // HOD Dashboard: real data for own section + department placeholder
  getHODDashboard: async (userId, department) => {
    const myData = await dashboardService.getMyDashboard()
    return {
      departmentEmployees: 0,
      attendance: { present: 0, absent: 0, leave: 0, totalDays: 0 },
      workingReports: { submitted: 0, approved: 0, pending: 0, total: 0 },
      salary: myData.salary,
      ownAttendance: myData.ownAttendance,
      ownWorkingReports: myData.ownWorkingReports,
      dailyAttendanceRecords: myData.dailyAttendanceRecords,
    }
  },

  // HR Dashboard: same as admin (real own data)
  getHRDashboard: async (userId) => {
    return dashboardService.getAdminDashboard(userId)
  },

  // Head HR Dashboard: same as admin
  getHeadHRDashboard: async (userId) => {
    return dashboardService.getAdminDashboard(userId)
  },

  // Get employee growth trend (for Admin) - optional, can keep mock or add backend later
  getEmployeeGrowthTrend: async () => {
    try {
      const { data } = await api.get('/dashboard/employee-growth')
      return data?.data || []
    } catch {
      return []
    }
  },

  // Get attendance trend for charts (no backend endpoint yet - return empty to avoid 404)
  getAttendanceTrend: async () => {
    return []
  },

  // Get working report status for charts (no backend endpoint yet - return empty to avoid 404)
  getWorkingReportStatus: async () => {
    return []
  },
}

export default dashboardService
