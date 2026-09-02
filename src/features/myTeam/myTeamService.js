import api from '../../services/api'
import { STORAGE_KEYS } from '../../utils/constants'

const myTeamService = {
  // Get companies list
  getCompanies: async () => {
    try {
      const response = await api.get('/companies')
      return response.data?.data || []
    } catch (error) {
      console.error('Error fetching companies:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch companies')
    }
  },

  // Get team members - REAL data from backend
  getTeamMembers: async () => {
    try {
      console.log('Fetching team members from backend...')

      // Who counts as "my team" depends on the role. HR, Head HR and Admin
      // oversee the whole company, so they get the full staff list. Everyone
      // else is a reporting person, and their team is the people who report to
      // them — asking for every employee would show a manager thirty names when
      // they have three.
      let params = { isActive: true }
      try {
        const storedUserRaw = localStorage.getItem(STORAGE_KEYS.USER)
        const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null
        const currentRole = storedUser?.role?.toUpperCase()

        if (currentRole === 'ADMIN') {
          // Super Admin sees every active user, whatever their role.
        } else if (currentRole === 'HR' || currentRole === 'HEAD_HR') {
          params.role = 'EMPLOYEE'
        } else {
          // No role filter alongside the reporting-line one: a manager's reports
          // are not always EMPLOYEE, and filtering on both would hide anyone who
          // manages a team of their own.
          params.reportingManagerId = 'me'
        }
      } catch (e) {
        // Storage unreadable — fall back to the narrowest view rather than the
        // whole company.
        params.reportingManagerId = 'me'
      }

      const response = await api.get('/users', { params })
      
      const users = response.data?.data || []
      console.log('Fetched team members:', users.length, 'records')
      
      // Map backend data to frontend format
      const mappedMembers = users.map((user) => {
        const contactInfo = user.contactInformation || {}
        const employmentInfo = user.employmentInformation || {}
        
        // Format join date
        let joinDate = null
        if (employmentInfo.dateOfJoining) {
          const date = new Date(employmentInfo.dateOfJoining)
          joinDate = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
        }
        
        // Get phone number (prefer mobileNo, fallback to officialMobileNo)
        const phone = contactInfo.mobileNo || contactInfo.officialMobileNo || null
        
        return {
          id: user.id,
          name: user.name || 'N/A',
          employeeCode: user.employeeCode || 'N/A',
          email: user.email || 'N/A',
          designation: user.designation || 'N/A',
          department: user.department || 'N/A',
          status: user.isActive ? 'Active' : 'Inactive',
          joinDate: joinDate,
          phone: phone,
          companyId: user.companyId || null,
          companyName: user.company?.companyName || 'N/A',
          monthlySalary: user.monthlySalary || null,
          reportingManagerId: user.reportingManagerId ?? user.reportingManager?.id ?? null,
          reportingManagerName: user.reportingManager?.name || user.reportingManagerName || null,
          // How much of the employee's account/profile is filled in, scored by
          // the backend so every screen reports the same number.
          profileCompletion: user.profileCompletion?.percentage ?? 0,
          profileMissing: user.profileCompletion?.missing || [],
          profileSections: user.profileCompletion?.sections || [],
        }
      })
      
      return mappedMembers
    } catch (error) {
      console.error('Error fetching team members:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch team members')
    }
  },

  // Team attendance list (admin / manager view) - REAL data from backend
  getAttendance: async (params = {}) => {
    try {
      const response = await api.get('/attendance/team', { params })
      return response.data?.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch team attendance')
    }
  },

  // Delete a single attendance record (Admin / HR / Manager only)
  deleteAttendance: async (id) => {
    try {
      const response = await api.delete(`/attendance/records/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete attendance API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete attendance record')
    }
  },

  /**
   * Import attendance from a spreadsheet.
   *
   * Resolves with the per-row report ({total, imported, skipped, errors}) even
   * when rows failed — a partially-successful import is the normal case, not an
   * error, and the caller renders the failures. Only an unreadable file or a
   * server fault rejects.
   */
  importAttendanceExcel: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/attendance/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data?.data || { total: 0, imported: 0, skipped: 0, errors: [] }
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to import attendance file'
      )
    }
  },

  // Blank import template (.xlsx), returned as a Blob for the browser to save.
  downloadImportTemplate: async () => {
    try {
      const response = await api.get('/attendance/import-template', { responseType: 'blob' })
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to download template'
      )
    }
  },

  /**
   * Fill a whole month for a set of employees.
   * Resolves with { month, employees, days, written, preserved, byStatus }.
   */
  bulkFillMonth: async (payload) => {
    try {
      const response = await api.post('/attendance/bulk-month', payload)
      return response.data?.data || {}
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fill the month'
      )
    }
  },

  /**
   * Monthly matrix workbook (employees down, days across) as a Blob.
   * Pass prefill to pre-populate working days with a status; omit it for a blank
   * sheet where only the non-working days are filled in.
   */
  downloadMonthlySheet: async ({ month, prefill, weekOffDays }) => {
    try {
      const params = { month }
      if (prefill) params.prefill = prefill
      if (Array.isArray(weekOffDays)) params.weekOffDays = weekOffDays.join(',')

      const response = await api.get('/attendance/monthly-template', {
        params,
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to download the monthly sheet'
      )
    }
  },

  /**
   * Export a month's actual attendance as a matrix workbook (Blob).
   * Same layout as the monthly sheet, so it can be corrected and re-imported.
   */
  exportMonthlyMatrix: async ({ month, userIds, markAbsent }) => {
    try {
      const params = { month }
      if (Array.isArray(userIds) && userIds.length) params.userIds = userIds.join(',')
      if (markAbsent) params.markAbsent = 'true'

      const response = await api.get('/attendance/monthly-export', {
        params,
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to export the month'
      )
    }
  },

  /** Analyse a pasted block without writing anything. */
  previewPaste: async (payload) => {
    try {
      const response = await api.post('/attendance/paste-preview', payload)
      return response.data?.data || {}
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Could not read the pasted data'
      )
    }
  },

  /** Apply a pasted block. */
  applyPaste: async (payload) => {
    try {
      const response = await api.post('/attendance/paste', payload)
      return response.data?.data || {}
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to apply the pasted data'
      )
    }
  },

  // Daily attendance report (all employees for selected date) - REAL data
  getDailyAttendanceReport: async (params = {}) => {
    const date = params?.date
    const query = {}
    if (date) {
      query.startDate = date
      query.endDate = date
    }
    try {
      const response = await api.get('/attendance/team', { params: query })
      return response.data?.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch daily team attendance')
    }
  },

  getPendingRequests: async (type, params = {}) => {
    if (type === 'attendance') {
      try {
        const { data } = await api.get('/attendance/requests/pending', {
          params: { page: params.page || 1, limit: params.limit || 50 },
        })
        const list = data?.data || []
        const total = data?.total ?? list.length
        return Array.isArray(list) ? list : []
      } catch (error) {
        console.error('Error fetching pending attendance requests:', error)
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to fetch pending attendance requests'
        )
      }
    }
    if (type === 'compoff') {
      // Compensatory off is applied for through Apply Leave, so it lives in the
      // leaves table like any other type. Pull the same pending-approval list
      // the leave screens use and keep only the comp-off rows.
      try {
        const { data } = await api.get('/leaves', { params: { scope: 'pendingApproval' } })
        const list = data?.data || []
        if (!Array.isArray(list)) return []

        return list
          .filter((l) => String(l.leaveType || '').toLowerCase().replace(/[^a-z]/g, '') === 'compoff')
          .map((l) => ({
            id: l.id,
            employeeName: l.userName,
            employeeCode: l.userEmployeeCode,
            workDate: l.startDate,
            reason: l.reason,
            status: l.status,
            requestedDate: typeof l.createdAt === 'string' ? l.createdAt.slice(0, 10) : null,
          }))
      } catch (error) {
        console.error('Error fetching pending comp-off requests:', error)
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to fetch pending comp-off requests'
        )
      }
    }
    if (type === 'leave') {
      try {
        const { data } = await api.get('/leaves', { params: { scope: 'pendingApproval' } })
        const list = data?.data || []
        return (Array.isArray(list) ? list : []).map((l) => {
          const start = new Date(l.startDate)
          const end = new Date(l.endDate)
          const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
          return {
            id: l.id,
            employeeName: l.userName,
            employeeCode: l.userEmployeeCode,
            leaveType: l.leaveType,
            startDate: l.startDate,
            endDate: l.endDate,
            days,
            reason: l.reason,
            status: l.status,
            appliedDate: l.createdAt ? (l.createdAt.slice ? l.createdAt.slice(0, 10) : (l.createdAt.toISOString && l.createdAt.toISOString().slice(0, 10))) : null,
          }
        })
      } catch (error) {
        console.error('Error fetching pending leave requests:', error)
        return []
      }
    }
    return []
  },

  approveRequest: async (type, requestId, note) => {
    if (type === 'attendance') {
      try {
        const { data } = await api.patch(`/attendance/requests/${requestId}/approve`, {
          note: note || '',
        })
        return data
      } catch (error) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to approve request'
        )
      }
    }
    if (type === 'leave' || type === 'compoff') {
      try {
        await api.patch(`/leaves/${requestId}/approve`)
        return { success: true }
      } catch (error) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to approve leave'
        )
      }
    }
    // No endpoint backs the remaining request types, so fail loudly rather than
    // reporting a success that never reached the server.
    throw new Error(`Approvals are not available for ${type} requests yet`)
  },

  getMyAttendanceRequests: async (params = {}) => {
    try {
      const response = await api.get('/attendance/requests/my', { params })
      const body = response?.data
      const list = body?.data
      if (!Array.isArray(list)) return []
      return list
    } catch (error) {
      console.error('Error fetching my attendance requests:', error?.response?.data || error)
      return []
    }
  },

  createAttendanceRequest: async (payload) => {
    try {
      const { data } = await api.post(
        '/attendance/requests',
        {
          date: payload.date,
          requestType: payload.requestType,
          reason: payload.reason,
          checkIn: payload.checkIn || undefined,
          checkOut: payload.checkOut || undefined,
        },
        { timeout: 15000 }
      )
      return data?.data || data
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your connection and try again.')
      }
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to submit attendance request'
      )
    }
  },

  rejectRequest: async (type, requestId, reason) => {
    if (type === 'attendance') {
      try {
        const { data } = await api.patch(`/attendance/requests/${requestId}/reject`, { reason: reason || '' })
        return data
      } catch (error) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to reject request'
        )
      }
    }
    if (type === 'leave' || type === 'compoff') {
      try {
        await api.patch(`/leaves/${requestId}/reject`, { reason: reason || '' })
        return { success: true }
      } catch (error) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to reject leave'
        )
      }
    }
    // No endpoint backs the remaining request types, so fail loudly rather than
    // reporting a success that never reached the server.
    throw new Error(`Rejections are not available for ${type} requests yet`)
  },

  /**
   * Punch-correction requests.
   *
   * These records live in attendance_requests and are already approved/rejected
   * on the Attendance Pending Request screen, which collects the mandatory
   * regularization note this screen has no field for. Rather than show rows the
   * buttons here cannot act on, this resolves empty until the screen is either
   * pointed at that flow or retired.
   */
  getBiometricRequests: async () => [],

  getLateMarkRecords: async (params = {}) => {
    try {
      const { startDate, endDate } = params
      const query = {}
      if (startDate) query.startDate = startDate
      if (endDate) query.endDate = endDate
      const response = await api.get('/attendance/late-marks', { params: query })
      const data = response.data?.data || []
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching late mark records:', error)
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fetch late mark records'
      )
    }
  },

  // Leave history for the people the current user can see: everyone for
  // Admin/HR, direct reports for a reporting manager.
  getTeamLeaveHistory: async (params = {}) => {
    try {
      let scope = 'team'
      try {
        const storedUserRaw = localStorage.getItem(STORAGE_KEYS.USER)
        const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null
        const role = String(storedUser?.role || '').toUpperCase()
        if (['ADMIN', 'HR', 'HEAD_HR'].includes(role)) scope = 'all'
      } catch (e) {
        // Unreadable storage just means we fall back to the narrower scope.
      }

      const { data } = await api.get('/leaves', { params: { ...params, scope } })
      const list = data?.data || []
      if (!Array.isArray(list)) return []

      return list.map((l) => {
        const start = new Date(l.startDate)
        const end = new Date(l.endDate)
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
        return {
          id: l.id,
          employeeName: l.userName,
          employeeCode: l.userEmployeeCode,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          days,
          status: l.status,
          appliedDate: typeof l.createdAt === 'string' ? l.createdAt.slice(0, 10) : null,
        }
      })
    } catch (error) {
      console.error('Error fetching team leave history:', error)
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fetch team leave history'
      )
    }
  },

  // Update team member
  updateTeamMember: async (userId, updateData) => {
    try {
      const response = await api.put(`/users/${userId}`, updateData)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Update team member API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update team member'
      throw new Error(errorMessage)
    }
  },

  // Update attendance record
  updateAttendance: async (updateData) => {
    try {
      const response = await api.put('/attendance/update', updateData)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Update attendance API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update attendance'
      const errorDetails = error.response?.data?.errors || []
      throw new Error(errorDetails.length > 0 ? `${errorMessage}: ${errorDetails.map(e => e.message || e).join(', ')}` : errorMessage)
    }
  },
}

export default myTeamService
