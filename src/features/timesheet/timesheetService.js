import api from '../../services/api'

const timesheetService = {
  // No timesheet API exists yet, so this resolves empty rather than fabricating
  // entries. Wire it to the real endpoint once one is available.
  getTimesheets: async () => [],

  // Clients and projects are the same masters the DAR module already uses, so
  // both screens stay in sync instead of each carrying its own hardcoded list.
  getClients: async () => {
    try {
      const { data } = await api.get('/dar/clients')
      return data?.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch clients')
    }
  },

  getProjects: async () => {
    try {
      const { data } = await api.get('/dar/projects')
      return data?.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch projects')
    }
  },
}

export default timesheetService
