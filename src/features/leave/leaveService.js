import api from '../../services/api'

function mapLeaveToFrontend(leave) {
  const start = new Date(leave.startDate)
  const end = new Date(leave.endDate)
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
  return {
    id: leave.id,
    type: leave.leaveType,
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate,
    days,
    reason: leave.reason,
    status: leave.status,
    appliedDate: leave.createdAt ? (typeof leave.createdAt === 'string' ? leave.createdAt.slice(0, 10) : leave.createdAt.toISOString?.()?.slice(0, 10)) : null,
    userName: leave.userName,
    userEmployeeCode: leave.userEmployeeCode,
    reportingManagerId: leave.reportingManagerId,
    reportingManagerName: leave.reportingManagerName,
    hrHeadId: leave.hrHeadId,
    hrHeadName: leave.hrHeadName,
    rejectionReason: leave.rejectionReason,
  }
}

const leaveService = {
  getLeaves: async (params = {}) => {
    const { data } = await api.get('/leaves', { params: { scope: 'my', ...params } })
    const list = data?.data || []
    return Array.isArray(list) ? list.map(mapLeaveToFrontend) : []
  },

  getPendingApprovalLeaves: async () => {
    const { data } = await api.get('/leaves', { params: { scope: 'pendingApproval' } })
    const list = data?.data || []
    return Array.isArray(list) ? list.map(mapLeaveToFrontend) : []
  },

  getAllLeavesForAdmin: async (params = {}) => {
    const { data } = await api.get('/leaves', { params: { scope: 'all', ...params } })
    const list = data?.data || []
    return Array.isArray(list) ? list.map(mapLeaveToFrontend) : []
  },

  getTeamLeavesForManager: async (params = {}) => {
    const { data } = await api.get('/leaves', { params: { scope: 'team', ...params } })
    const list = data?.data || []
    return Array.isArray(list) ? list.map(mapLeaveToFrontend) : []
  },

  getLeaveBalance: async (year) => {
    const params = year ? { year } : {}
    const { data } = await api.get('/leaves/balance', { params })
    const raw = data?.data || {}
    return {
      totalLeaves: raw.totalLeaves ?? 30,
      usedLeaves: raw.usedLeaves ?? 0,
      remainingLeaves: raw.remainingLeaves ?? 30,
      sickLeave: raw.sickLeave ?? 0,
      casualLeave: raw.casualLeave ?? 0,
      earnedLeave: raw.earnedLeave ?? 0,
      compOff: raw.compOff ?? 0,
    }
  },

  getLeaveBalanceAllUsers: async (year) => {
    const params = year ? { year } : {}
    const { data } = await api.get('/leaves/balance/all', { params })
    const list = data?.data || []
    return Array.isArray(list) ? list : []
  },

  // Leave balance adjustments — HR credits/debits layered on the derived
  // balance. Days is signed: positive credits, negative debits.
  getBalanceAdjustments: async (params = {}) => {
    const { data } = await api.get('/leaves/balance/adjustments', { params })
    const list = data?.data || []
    return Array.isArray(list) ? list : []
  },

  createBalanceAdjustment: async (payload) => {
    const { data } = await api.post('/leaves/balance/adjustments', payload)
    return data?.data
  },

  updateBalanceAdjustment: async (id, payload) => {
    const { data } = await api.put(`/leaves/balance/adjustments/${id}`, payload)
    return data?.data
  },

  deleteBalanceAdjustment: async (id) => {
    const { data } = await api.delete(`/leaves/balance/adjustments/${id}`)
    return data?.data
  },

  // Set a balance to an exact total rather than crediting/debiting days. The
  // server converts it to the adjustment that lands on that figure, replacing
  // whatever was there for the type — so calling this twice sets, not stacks.
  // payload: { year, earned?, compOff?, reason? }
  setLeaveBalance: async (userId, payload) => {
    const { data } = await api.put(`/leaves/balance/${userId}`, payload)
    return data?.data
  },

  applyLeave: async (payload) => {
    const body = {
      leaveType: payload.leaveType || payload.type,
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
    }
    const { data } = await api.post('/leaves', body)
    return data?.data || data
  },

  approveLeave: async (id, comments) => {
    const { data } = await api.patch(`/leaves/${id}/approve`, comments ? { comments } : {})
    return data?.data || data
  },

  rejectLeave: async (id, reason) => {
    const { data } = await api.patch(`/leaves/${id}/reject`, { reason: reason || '' })
    return data?.data || data
  },

  cancelLeave: async (id) => {
    const { data } = await api.patch(`/leaves/${id}/cancel`)
    return data?.data || data
  },
}

export default leaveService
