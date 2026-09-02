import api from '../../services/api'

const statusToApi = (status) => {
  if (!status) return undefined
  const map = {
    Draft: 'DRAFT',
    Submitted: 'SUBMITTED',
    Approved: 'APPROVED',
    Rejected: 'REJECTED',
  }
  return map[status] || status.toUpperCase()
}

const statusFromApi = (status) => {
  if (!status) return 'Draft'
  const map = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }
  const upper = status.toUpperCase()
  return map[upper] || status
}

const computeProjectSummaryFromList = (list) => {
  const byProject = {}
  list.forEach((dar) => {
    const projectName = dar.project || dar.projectName || 'Unassigned'
    if (!byProject[projectName]) {
      byProject[projectName] = { projectName, darCount: 0, approvedCount: 0, totalHours: 0 }
    }
    byProject[projectName].darCount += 1
    byProject[projectName].totalHours += Number(dar.totalHours || 0)
    if ((dar.status || '').toUpperCase() === 'APPROVED') {
      byProject[projectName].approvedCount += 1
    }
  })
  return Object.values(byProject).map((p) => ({
    projectName: p.projectName,
    darCount: p.darCount,
    approvedCount: p.approvedCount,
    totalHours: p.totalHours,
    averageHoursPerDay: p.darCount > 0 ? Math.round((p.totalHours / p.darCount) * 100) / 100 : 0,
    completionPercent: p.darCount > 0 ? Math.round((p.approvedCount / p.darCount) * 100) : 0,
  }))
}

const computeStatsFromList = (list, dateFrom, dateTo) => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const today = new Date(todayStr)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const weekEndStr = weekEnd.toISOString().slice(0, 10)

  let todayHours = 0
  let weekHours = 0
  let monthHours = 0
  const counts = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0 }

  list.forEach((dar) => {
    const hrs = Number(dar.totalHours || 0)
    const d = String(dar.date || '').slice(0, 10)

    monthHours += hrs
    if (d === todayStr) todayHours += hrs
    if (d >= weekStartStr && d <= weekEndStr) weekHours += hrs

    const st = (dar.status || 'Draft').toUpperCase()
    if (st === 'DRAFT') counts.DRAFT += 1
    else if (st === 'SUBMITTED') counts.SUBMITTED += 1
    else if (st === 'APPROVED') counts.APPROVED += 1
    else if (st === 'REJECTED') counts.REJECTED += 1
  })

  return {
    todayHours: Math.round(todayHours * 100) / 100,
    weekHours: Math.round(weekHours * 100) / 100,
    monthHours: Math.round(monthHours * 100) / 100,
    submittedCount: counts.SUBMITTED,
    approvedCount: counts.APPROVED,
    draftCount: counts.DRAFT,
    rejectedCount: counts.REJECTED,
  }
}

const mapDarFromApi = (dar) => ({
  id: dar.id,
  userId: dar.userId != null ? Number(dar.userId) : null,
  date: dar.date,
  project: dar.projectName || dar.project || '',
  totalHours: dar.totalHours || 0,
  status: statusFromApi(dar.status),
  remarks: dar.remarks || '',
  createdAt: dar.createdAt,
  activities: [], // detailed view will map a single activity
  // Extended fields for export
  activityDescription: dar.activityDescription || '',
  taskCategory: dar.taskCategory || '',
  startTime: dar.startTime || '',
  endTime: dar.endTime || '',
  employeeName: dar.employeeName || '',
  department: dar.department || '',
  designation: dar.designation || '',
  submittedAt: dar.submittedAt || '',
  issuesFaced: dar.issuesFaced || '',
  reportingManagerId: dar.reportingManagerId != null ? Number(dar.reportingManagerId) : null,
  approvedBy: dar.approvedBy,
  approvedAt: dar.approvedAt,
  rejectedBy: dar.rejectedBy,
  rejectedAt: dar.rejectedAt,
  rejectionReason: dar.rejectionReason || '',
  managerComments: dar.managerComments || '',
})

const darService = {
  getDarList: async (params = {}) => {
    const query = {
      page: 1,
      limit: 500,
    }
    if (params.dateFrom) query.startDate = params.dateFrom
    if (params.dateTo) query.endDate = params.dateTo
    if (params.status) query.status = statusToApi(params.status)
    if (params.search) query.search = params.search

    const { data } = await api.get('/dar/my', { params: query })
    const list = data?.data || []
    return Array.isArray(list) ? list.map(mapDarFromApi) : []
  },

  getDarById: async (id) => {
    const { data } = await api.get(`/dar/${id}`)
    const dar = data?.data
    if (!dar) throw new Error('DAR not found')

    const base = mapDarFromApi(dar)
    // Build a single high-level activity from summary fields
    const description = dar.activityDescription || base.remarks || 'Daily activities'
    const taskCat = (dar.taskCategory || '').toUpperCase()
    const categoryMap = { EXECUTION: 'Engineering', PLANNING: 'Design', MEETING: 'Admin', INSPECTION: 'QAQC', DOCUMENTATION: 'Design', OTHER: 'Other' }
    const category = categoryMap[taskCat] || 'General'
    base.activities = [
      {
        id: 1,
        taskTitle: dar.projectName || base.project || 'Work',
        description,
        category,
        startTime: dar.startTime || '09:00',
        endTime: dar.endTime || '18:00',
        hoursSpent: base.totalHours || 0,
        status: 'In Progress',
        blockers: dar.issuesFaced || '',
      },
    ]
    return base
  },

  createDar: async (data) => {
    const payload = {
      date: data.date,
      project: data.project,
      activities: data.activities || [],
      remarks: data.remarks || '',
      totalHours: data.totalHours || 0,
      status: data.status || 'Draft',
    }
    const response = await api.post('/dar/my', payload)
    const res = response?.data
    const dar = res?.data ?? res
    if (!dar || !dar.id) {
      throw new Error(res?.message || 'Failed to create DAR - no data returned')
    }
    return mapDarFromApi(dar)
  },

  updateDar: async (id, data) => {
    const payload = {
      date: data.date,
      project: data.project,
      activities: data.activities || [],
      remarks: data.remarks || '',
      totalHours: data.totalHours || 0,
      status: data.status || 'Draft',
    }
    const { data: res } = await api.put(`/dar/${id}`, payload)
    const dar = res?.data || res
    return mapDarFromApi(dar)
  },

  submitDar: async (id) => {
    const { data } = await api.post(`/dar/${id}/submit`)
    const dar = data?.data || data
    return mapDarFromApi(dar)
  },

  approveDar: async (id, comments = '') => {
    const { data } = await api.post(`/dar/${id}/approve`, { comments })
    const dar = data?.data || data
    return mapDarFromApi(dar)
  },

  rejectDar: async (id, { reason = '', comments = '' } = {}) => {
    const { data } = await api.post(`/dar/${id}/reject`, { reason, comments })
    const dar = data?.data || data
    return mapDarFromApi(dar)
  },

  getProjects: async () => {
    const { data } = await api.get('/dar/projects')
    const list = data?.data || []
    return Array.isArray(list) ? list : []
  },

  getDarStats: async (params = {}) => {
    const query = {}
    if (params.dateFrom) query.dateFrom = params.dateFrom
    if (params.dateTo) query.dateTo = params.dateTo
    if (params.project) query.project = params.project

    try {
      const { data } = await api.get('/dar/my/stats', { params: query })
      const stats = data?.data
      if (stats && typeof stats === 'object') {
        return stats
      }
    } catch (err) {
      console.warn('DAR stats API failed, falling back to list computation:', err?.message)
    }
    // Fallback: fetch DAR list and compute stats client-side
    const listParams = { dateFrom: params.dateFrom, dateTo: params.dateTo }
    let list = await this.getDarList(listParams)
    if (params.project && params.project.trim()) {
      const projectLower = params.project.trim().toLowerCase()
      list = list.filter((d) => (d.project || '').toLowerCase() === projectLower)
    }
    return computeStatsFromList(list, params.dateFrom, params.dateTo)
  },

  getDarStatsForUser: async (userId, params = {}) => {
    const query = {}
    if (params.dateFrom) query.dateFrom = params.dateFrom
    if (params.dateTo) query.dateTo = params.dateTo
    if (params.project) query.project = params.project

    try {
      const { data } = await api.get(`/dar/user/${userId}/stats`, { params: query })
      const stats = data?.data
      if (stats && typeof stats === 'object') {
        return stats
      }
    } catch (err) {
      console.warn('DAR user stats API failed, falling back to list computation:', err?.message)
    }
    // Fallback: fetch team DAR list (or my list if viewing self), filter by userId, compute stats
    try {
      const listParams = { dateFrom: params.dateFrom, dateTo: params.dateTo }
      let list = await this.getTeamDarList(listParams)
      list = list.filter((d) => Number(d.userId) === Number(userId))
      if (params.project && params.project.trim()) {
        const projectLower = params.project.trim().toLowerCase()
        list = list.filter((d) => (d.project || '').toLowerCase() === projectLower)
      }
      return computeStatsFromList(list, params.dateFrom, params.dateTo)
    } catch {
      return {
        todayHours: 0,
        weekHours: 0,
        monthHours: 0,
        submittedCount: 0,
        approvedCount: 0,
        draftCount: 0,
        rejectedCount: 0,
      }
    }
  },

  getViewableUsers: async () => {
    const { data } = await api.get('/dar/viewable-users')
    return data?.data || []
  },

  getProjectSummary: async (params = {}) => {
    const query = {}
    if (params.startDate) query.startDate = params.startDate
    if (params.endDate) query.endDate = params.endDate
    if (params.project) query.project = params.project

    try {
      const { data } = await api.get('/dar/my/projects-summary', { params: query })
      const list = data?.data || []
      if (Array.isArray(list) && list.length > 0) {
        let result = list
        if (params.project) {
          const p = String(params.project).trim().toLowerCase()
          result = result.filter((r) => (r.projectName || '').toLowerCase() === p)
        }
        return result
      }
    } catch (err) {
      console.warn('Project summary API failed, using DAR list fallback:', err?.message)
    }
    const listParams = { dateFrom: params.startDate, dateTo: params.endDate }
    let darList = await this.getDarList(listParams)
    if (params.project) {
      const p = String(params.project).trim().toLowerCase()
      darList = darList.filter((d) => (d.project || '').toLowerCase() === p)
    }
    return computeProjectSummaryFromList(darList)
  },

  getProjectSummaryForUser: async (userId, params = {}) => {
    const query = {}
    if (params.startDate) query.startDate = params.startDate
    if (params.endDate) query.endDate = params.endDate
    if (params.project) query.project = params.project

    try {
      const { data } = await api.get(`/dar/user/${userId}/projects-summary`, { params: query })
      const list = data?.data || []
      if (Array.isArray(list) && list.length > 0) {
        if (params.project) {
          const p = String(params.project).trim().toLowerCase()
          return list.filter((r) => (r.projectName || '').toLowerCase() === p)
        }
        return list
      }
    } catch (err) {
      console.warn('User project summary API failed, using DAR list fallback:', err?.message)
    }
    try {
      const listParams = { dateFrom: params.startDate, dateTo: params.endDate }
      let darList = await this.getTeamDarList(listParams)
      darList = darList.filter((d) => Number(d.userId) === Number(userId))
      if (params.project) {
        const p = String(params.project).trim().toLowerCase()
        darList = darList.filter((d) => (d.project || '').toLowerCase() === p)
      }
      return computeProjectSummaryFromList(darList)
    } catch {
      return []
    }
  },

  getTeamDarList: async (params = {}) => {
    const query = { page: 1, limit: 500 }
    if (params.dateFrom) query.startDate = params.dateFrom
    if (params.dateTo) query.endDate = params.dateTo
    if (params.status) query.status = statusToApi(params.status)
    if (params.search) query.search = params.search

    const { data } = await api.get('/dar/team', { params: query })
    const list = data?.data || []
    return Array.isArray(list) ? list.map(mapDarFromApi) : []
  },

  createProject: async (payload) => {
    const { data } = await api.post('/dar/projects', {
      name: payload.name,
      description: payload.description || '',
    })
    const proj = data?.data || data
    return proj
  },

  getClients: async () => {
    const { data } = await api.get('/dar/clients')
    const list = data?.data || []
    return Array.isArray(list) ? list : []
  },

  createClient: async (payload) => {
    const { data } = await api.post('/dar/clients', {
      name: payload.name,
      contactName: payload.contactName || '',
      email: payload.email || '',
      phone: payload.phone || '',
      description: payload.description || '',
    })
    const client = data?.data || data
    return client
  },
}

export default darService
