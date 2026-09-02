import api from '../../services/api'

const reimbursementService = {
  getReimbursements: async (params = {}) => {
    const { data } = await api.get('/reimbursements', { params })
    return data
  },

  getTeamReimbursements: async (params = {}) => {
    const { data } = await api.get('/reimbursements/team', { params })
    return data
  },

  createReimbursement: async (payload) => {
    const { data } = await api.post('/reimbursements', payload)
    return data
  },

  createTravelReimbursement: async (payload) => {
    const { data } = await api.post('/reimbursements', { ...payload, requestType: 'Travel' })
    return data
  },

  approveReimbursement: async (id) => {
    const { data } = await api.patch(`/reimbursements/${id}/approve`)
    return data
  },

  rejectReimbursement: async (id, reason) => {
    const { data } = await api.patch(`/reimbursements/${id}/reject`, {
      rejectionReason: reason || undefined,
    })
    return data
  },

  delegateReimbursement: async (id, delegateTo) => {
    // Backend does not implement delegate yet; keep as no-op or future endpoint
    return { success: true, message: 'Delegation not implemented' }
  },
}

export default reimbursementService
