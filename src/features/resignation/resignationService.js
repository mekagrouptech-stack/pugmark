import api from '../../services/api'

const resignationService = {
  // Resignations have no backend yet; both lists resolve empty so the screens
  // show their empty states rather than sample employees.
  getResignations: async () => [],

  getTeamResignations: async () => [],

  applyResignation: async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          ...data,
          status: 'Pending',
          appliedDate: new Date().toISOString().split('T')[0],
        })
      }, 500)
    })
  },

  approveResignation: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Resignation approved successfully' })
      }, 300)
    })
  },

  rejectResignation: async (id, reason) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Resignation rejected' })
      }, 300)
    })
  },
}

export default resignationService
