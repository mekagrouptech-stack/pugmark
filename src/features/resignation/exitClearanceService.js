const exitClearanceService = {
  // Exit clearance has no backend yet; the department master and the request
  // list both resolve empty rather than seeding sample rows.
  getDepartments: async () => [],

  getExitClearanceRequests: async () => [],

  createDepartment: async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          ...data,
          enabled: true,
          createdOn: new Date().toISOString().split('T')[0],
        })
      }, 500)
    })
  },

  updateDepartment: async (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Department updated successfully' })
      }, 300)
    })
  },

  toggleDepartmentStatus: async (id, enabled) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 300)
    })
  },
}

export default exitClearanceService
