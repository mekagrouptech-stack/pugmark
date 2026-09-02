import api from '../../services/api'

const hrService = {
  // Fetch payrolls from backend
  getPayroll: async (params = {}) => {
    try {
      const response = await api.get('/payroll', { params })
      // Backend returns { success: true, count: X, data: [...] }
      const payrolls = response.data?.data || []
      console.log('Fetched payrolls:', payrolls.length, 'records')
      return payrolls
    } catch (error) {
      console.error('Error fetching payrolls:', error)
      throw error
    }
  },

  // Fetch all active users (for dropdowns like extra earnings)
  getAllActiveUsers: async () => {
    try {
      const response = await api.get('/users', { params: { isActive: true } })
      const list = response.data?.data || response.data || []
      return Array.isArray(list) ? list : []
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  // Fetch employees (active only by default)
  getEmployees: async (params = {}) => {
    try {
      console.log('Fetching employees with params:', params)
      const response = await api.get('/users', {
        params: {
          role: params.role || 'EMPLOYEE',
          isActive: params.isActive ?? true,
          ...params,
        },
      })
      console.log('Employees API response:', response.data)
      const employees = response.data?.data || response.data || []
      console.log('Parsed employees:', employees.length, 'records')
      return employees
    } catch (error) {
      console.error('Error fetching employees:', error)
      console.error('Error response:', error.response?.data)
      throw error
    }
  },

  // Get attendance summary before payroll generation
  getAttendanceSummary: async ({ userId, year, month }) => {
    try {
      console.log('Fetching attendance summary:', { userId, year, month })
      const response = await api.get(`/payroll/attendance-summary/${userId}/${year}/${month}`)
      console.log('Attendance summary response:', response.data)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error in getAttendanceSummary service:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else if (error.message) {
        throw error
      } else {
        throw new Error('Failed to fetch attendance summary. Please try again.')
      }
    }
  },

  // Calculate payroll for a specific employee and month
  calculatePayroll: async ({ userId, year, month, forceUpdate = true }) => {
    try {
      console.log('Calling payroll calculate API:', { userId, year, month, forceUpdate })
      const response = await api.post('/payroll/calculate', {
        userId,
        year,
        month,
        forceUpdate, // Always force update for manual generation
      })
      console.log('Payroll calculate API response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error in calculatePayroll service:', error)
      // Re-throw with better error message
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else if (error.message) {
        throw error
      } else {
        throw new Error('Failed to calculate payroll. Please try again.')
      }
    }
  },

  // Calculate payroll for ALL active employees for a given month
  calculateAllPayroll: async ({ year, month }) => {
    try {
      const response = await api.post('/payroll/calculate-all', { year, month })
      return response.data
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  // Set the two inputs the whole CTC structure is derived from
  // (see backend/utils/salaryStructure.js).
  updateSalaryStructure: async (userId, { monthlySalary, pfEnabled, monthlyTds }) => {
    const { data } = await api.put(`/users/${userId}`, { monthlySalary, pfEnabled, monthlyTds })
    return data?.data || data
  },

  // Extra Earnings / Deductions
  getExtraEarnings: async (params = {}) => {
    const { data } = await api.get('/extra-earnings', { params })
    return data?.data || []
  },

  createExtraEarning: async (payload) => {
    const { data } = await api.post('/extra-earnings', payload)
    return data?.data || data
  },

  updateExtraEarning: async (id, payload) => {
    const { data } = await api.put(`/extra-earnings/${id}`, payload)
    return data?.data || data
  },

  deleteExtraEarning: async (id) => {
    await api.delete(`/extra-earnings/${id}`)
  },

  // Invoice Employees — daily-wage workers and contractors who are NOT
  // registered as HRMS users. They have their own master record and bill the
  // company by invoice; nothing here touches payroll.
  getInvoiceEmployees: async (params = {}) => {
    const { data } = await api.get('/invoices/employees', { params })
    return data?.data || []
  },

  createInvoiceEmployee: async (payload) => {
    const { data } = await api.post('/invoices/employees', payload)
    return data?.data || data
  },

  updateInvoiceEmployee: async (id, payload) => {
    const { data } = await api.put(`/invoices/employees/${id}`, payload)
    return data?.data || data
  },

  deleteInvoiceEmployee: async (id) => {
    await api.delete(`/invoices/employees/${id}`)
  },

  // Our own companies, used as the bill-to party on an invoice. Served by the
  // companies module rather than the invoice one, so it is a separate call.
  getCompanies: async (params = { isActive: true }) => {
    const { data } = await api.get('/companies', { params })
    return data?.data || []
  },

  getInvoices: async (params = {}) => {
    const { data } = await api.get('/invoices', { params })
    return data?.data || []
  },

  getInvoiceSummary: async (params = {}) => {
    const { data } = await api.get('/invoices/summary', { params })
    return data?.data || {}
  },

  createInvoice: async (payload) => {
    const { data } = await api.post('/invoices', payload)
    return data?.data || data
  },

  updateInvoice: async (id, payload) => {
    const { data } = await api.put(`/invoices/${id}`, payload)
    return data?.data || data
  },

  deleteInvoice: async (id) => {
    await api.delete(`/invoices/${id}`)
  },

  getMaintenanceTasks: async (params = {}) => {
    const { data } = await api.get('/maintenance', { params })
    return data?.data || []
  },
  createMaintenanceTask: async (payload) => {
    const { data } = await api.post('/maintenance', payload)
    return data?.data || data
  },
  updateMaintenanceTask: async (id, payload) => {
    const { data } = await api.put(`/maintenance/${id}`, payload)
    return data?.data || data
  },
  deleteMaintenanceTask: async (id) => {
    await api.delete(`/maintenance/${id}`)
  },

  // Send letter via email
  sendLetterEmail: async ({ to, employee, letterType }) => {
    const { data } = await api.post('/letters/send-email', { to, employee, letterType })
    return data
  },

  // Maintenance Tasks
  getMaintenanceTasks: async (params = {}) => {
    const { data } = await api.get('/maintenance', { params })
    return data?.data || []
  },
  createMaintenanceTask: async (payload) => {
    const { data } = await api.post('/maintenance', payload)
    return data?.data || data
  },
  updateMaintenanceTask: async (id, payload) => {
    const { data } = await api.put(`/maintenance/${id}`, payload)
    return data?.data || data
  },
  deleteMaintenanceTask: async (id) => {
    await api.delete(`/maintenance/${id}`)
  },
}

export default hrService
