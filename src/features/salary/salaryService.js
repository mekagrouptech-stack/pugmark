import api from '../../services/api'

const salaryService = {
  getSalary: async () => {
    const { data } = await api.get('/salary/me')
    // Pass through the full CTC structure object (earnings/net/headline boxes).
    return data?.data || {}
  },
  // Latest salary-slip structure for a specific employee (HR/Admin).
  getUserSalaryStructure: async (userId, { month, year } = {}) => {
    const { data } = await api.get(`/salary/structure/${userId}`, { params: { month, year } })
    return data?.data || {}
  },
  // Payroll exposes no employee-facing list endpoint yet (only /payroll/:id),
  // so this resolves empty instead of listing months that were never run.
  getPayslips: async () => [],

  // Salary heads
  getSalaryHeads: async (params = {}) => {
    const { data } = await api.get('/salary/heads', { params })
    return data?.data || []
  },

  createSalaryHead: async (payload) => {
    const { data } = await api.post('/salary/heads', payload)
    return data?.data || data
  },

  updateSalaryHead: async (id, payload) => {
    const { data } = await api.put(`/salary/heads/${id}`, payload)
    return data?.data || data
  },

  deleteSalaryHead: async (id) => {
    await api.delete(`/salary/heads/${id}`)
  },

  // Salary structures
  getSalaryStructures: async (params = {}) => {
    const { data } = await api.get('/salary/structures', { params })
    return data?.data || []
  },
  getSalaryStructure: async (id) => {
    const { data } = await api.get(`/salary/structures/${id}`)
    return data?.data
  },
  createSalaryStructure: async (payload) => {
    const { data } = await api.post('/salary/structures', payload)
    return data?.data || data
  },
  updateSalaryStructure: async (id, payload) => {
    const { data } = await api.put(`/salary/structures/${id}`, payload)
    return data?.data || data
  },
  deleteSalaryStructure: async (id) => {
    await api.delete(`/salary/structures/${id}`)
  },
  duplicateSalaryStructure: async (id) => {
    const { data } = await api.post(`/salary/structures/${id}/duplicate`)
    return data?.data || data
  },
  bulkDeleteSalaryStructures: async (ids) => {
    await api.post('/salary/structures/bulk-delete', { ids })
  },
}

export default salaryService
