import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import dayjs from 'dayjs'
import { getAntdMessage } from '../../utils/antdMessage'
import darService from './darService'

const initialState = {
  darList: [],
  teamDarList: [],
  selectedDar: null,
  projects: [],
  projectSummary: [],
  clients: [],
  stats: null,
  viewableUsers: [],
  ganttData: [],
  calendarData: [],
  loading: false,
  error: null,
}

export const fetchDarList = createAsyncThunk(
  'dar/fetchDarList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await darService.getDarList(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTeamDarList = createAsyncThunk(
  'dar/fetchTeamDarList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await darService.getTeamDarList(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchDarById = createAsyncThunk(
  'dar/fetchDarById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await darService.getDarById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createDar = createAsyncThunk(
  'dar/createDar',
  async (data, { rejectWithValue }) => {
    try {
      const response = await darService.createDar(data)
      getAntdMessage()?.success('DAR created successfully')
      return response
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to create DAR'
      getAntdMessage()?.error(errMsg)
      return rejectWithValue(errMsg)
    }
  }
)

export const updateDar = createAsyncThunk(
  'dar/updateDar',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await darService.updateDar(id, data)
      getAntdMessage()?.success('DAR updated successfully')
      return response
    } catch (error) {
      getAntdMessage()?.error('Failed to update DAR')
      return rejectWithValue(error.message)
    }
  }
)

export const submitDar = createAsyncThunk(
  'dar/submitDar',
  async (id, { rejectWithValue }) => {
    try {
      const response = await darService.submitDar(id)
      getAntdMessage()?.success('DAR submitted successfully')
      return response
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to submit DAR'
      getAntdMessage()?.error(errMsg)
      return rejectWithValue(errMsg)
    }
  }
)

export const approveDar = createAsyncThunk(
  'dar/approveDar',
  async ({ id, comments = '' }, { rejectWithValue }) => {
    try {
      const response = await darService.approveDar(id, comments)
      getAntdMessage()?.success('DAR approved successfully')
      return response
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to approve DAR'
      getAntdMessage()?.error(errMsg)
      return rejectWithValue(errMsg)
    }
  }
)

export const rejectDar = createAsyncThunk(
  'dar/rejectDar',
  async ({ id, reason = '', comments = '' }, { rejectWithValue }) => {
    try {
      const response = await darService.rejectDar(id, { reason, comments })
      getAntdMessage()?.success('DAR rejected')
      return response
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to reject DAR'
      getAntdMessage()?.error(errMsg)
      return rejectWithValue(errMsg)
    }
  }
)

export const fetchProjects = createAsyncThunk(
  'dar/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await darService.getProjects()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createProject = createAsyncThunk(
  'dar/createProject',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await darService.createProject(payload)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchDarStats = createAsyncThunk(
  'dar/fetchDarStats',
  async (params, { rejectWithValue }) => {
    try {
      const response = await darService.getDarStats(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchDarStatsForUser = createAsyncThunk(
  'dar/fetchDarStatsForUser',
  async ({ userId, ...params }, { rejectWithValue }) => {
    try {
      const response = await darService.getDarStatsForUser(userId, params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchViewableUsers = createAsyncThunk(
  'dar/fetchViewableUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await darService.getViewableUsers()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchProjectSummary = createAsyncThunk(
  'dar/fetchProjectSummary',
  async (params, { rejectWithValue }) => {
    try {
      const response = await darService.getProjectSummary(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchProjectSummaryForUser = createAsyncThunk(
  'dar/fetchProjectSummaryForUser',
  async ({ userId, ...params }, { rejectWithValue }) => {
    try {
      const response = await darService.getProjectSummaryForUser(userId, params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchClients = createAsyncThunk(
  'dar/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await darService.getClients()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createClient = createAsyncThunk(
  'dar/createClient',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await darService.createClient(payload)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Transform DAR data to Gantt format
export const transformDarToGantt = (darList) => {
  const ganttTasks = []
  
  darList.forEach((dar) => {
    // Fetch full DAR details if activities are not present
    if (dar.activities && dar.activities.length > 0) {
      dar.activities.forEach((activity, index) => {
        const startDate = dayjs(`${dar.date} ${activity.startTime || '09:00'}`)
        const endDate = activity.endTime 
          ? dayjs(`${dar.date} ${activity.endTime}`)
          : startDate.add(activity.hoursSpent || 1, 'hour')
        
        ganttTasks.push({
          id: `${dar.id}-${activity.id || index}`,
          darId: dar.id,
          projectName: dar.project,
          taskTitle: activity.taskTitle,
          description: activity.description,
          category: activity.category,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime: activity.startTime,
          endTime: activity.endTime,
          totalHours: activity.hoursSpent || 0,
          status: dar.status,
          activityStatus: activity.status,
        })
      })
    } else {
      // If no activities, create a single task for the DAR (list API returns summary only)
      const startDate = dayjs(dar.date).startOf('day')
      const hours = Number(dar.totalHours) || 8
      const endDate = startDate.add(hours, 'hour')
      
      ganttTasks.push({
        id: `dar-${dar.id}`,
        darId: dar.id,
        projectName: dar.project || 'Unassigned',
        taskTitle: dar.activityDescription ? `${dar.activityDescription.substring(0, 40)}${dar.activityDescription.length > 40 ? '...' : ''}` : `DAR - ${dar.date}`,
        description: '',
        category: 'General',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: '09:00',
        endTime: '18:00',
        totalHours: dar.totalHours || 0,
        status: dar.status,
        activityStatus: 'Completed',
      })
    }
  })
  
  return ganttTasks
}

// Transform DAR data to Calendar format
export const transformDarToCalendar = (darList) => {
  const calendarEvents = []
  
  darList.forEach((dar) => {
    calendarEvents.push({
      id: dar.id,
      date: dar.date,
      project: dar.project,
      totalHours: dar.totalHours || 0,
      status: dar.status,
      activities: dar.activities || [],
      createdAt: dar.createdAt,
    })
  })
  
  return calendarEvents
}

const darSlice = createSlice({
  name: 'dar',
  initialState,
  reducers: {
    clearSelectedDar: (state) => {
      state.selectedDar = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch DAR List
      .addCase(fetchDarList.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDarList.fulfilled, (state, action) => {
        state.loading = false
        state.darList = action.payload
        // Transform to Gantt and Calendar formats
        state.ganttData = transformDarToGantt(action.payload)
        state.calendarData = transformDarToCalendar(action.payload)
      })
      .addCase(fetchDarList.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        getAntdMessage()?.error(action.payload || 'Failed to fetch DAR list')
      })
      // Fetch Team DAR List
      .addCase(fetchTeamDarList.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTeamDarList.fulfilled, (state, action) => {
        state.loading = false
        state.teamDarList = action.payload || []
      })
      .addCase(fetchTeamDarList.rejected, (state, action) => {
        state.loading = false
        state.teamDarList = []
        getAntdMessage()?.error(action.payload || 'Failed to fetch team DAR list')
      })
      // Fetch DAR By ID
      .addCase(fetchDarById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDarById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedDar = action.payload
      })
      .addCase(fetchDarById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        getAntdMessage()?.error(action.payload || 'Failed to fetch DAR')
      })
      // Create DAR
      .addCase(createDar.fulfilled, (state, action) => {
        state.darList.unshift(action.payload)
        state.ganttData = transformDarToGantt(state.darList)
        state.calendarData = transformDarToCalendar(state.darList)
      })
      // Update DAR
      .addCase(updateDar.fulfilled, (state, action) => {
        const index = state.darList.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.darList[index] = action.payload
        }
        if (state.selectedDar && state.selectedDar.id === action.payload.id) {
          state.selectedDar = action.payload
        }
        state.ganttData = transformDarToGantt(state.darList)
        state.calendarData = transformDarToCalendar(state.darList)
      })
      // Submit DAR
      .addCase(submitDar.fulfilled, (state, action) => {
        const index = state.darList.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.darList[index] = { ...state.darList[index], ...action.payload }
        }
        if (state.selectedDar && state.selectedDar.id === action.payload.id) {
          state.selectedDar = { ...state.selectedDar, ...action.payload }
        }
        state.ganttData = transformDarToGantt(state.darList)
        state.calendarData = transformDarToCalendar(state.darList)
      })
      // Approve DAR
      .addCase(approveDar.fulfilled, (state, action) => {
        const index = state.darList.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.darList[index] = { ...state.darList[index], ...action.payload }
        }
        if (state.selectedDar && state.selectedDar.id === action.payload.id) {
          state.selectedDar = { ...state.selectedDar, ...action.payload }
        }
        state.ganttData = transformDarToGantt(state.darList)
        state.calendarData = transformDarToCalendar(state.darList)
      })
      // Reject DAR
      .addCase(rejectDar.fulfilled, (state, action) => {
        const index = state.darList.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.darList[index] = { ...state.darList[index], ...action.payload }
        }
        if (state.selectedDar && state.selectedDar.id === action.payload.id) {
          state.selectedDar = { ...state.selectedDar, ...action.payload }
        }
        state.ganttData = transformDarToGantt(state.darList)
        state.calendarData = transformDarToCalendar(state.darList)
      })
      // Fetch Projects
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload
      })
      // Create Project
      .addCase(createProject.fulfilled, (state, action) => {
        if (!state.projects) state.projects = []
        state.projects.push(action.payload)
      })
      // Fetch Stats
      .addCase(fetchDarStats.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchDarStats.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload
      })
      .addCase(fetchDarStats.rejected, (state, action) => {
        state.loading = false
        state.stats = null
        getAntdMessage()?.error(action.payload || 'Failed to fetch DAR stats')
      })
      // Fetch Stats for User
      .addCase(fetchDarStatsForUser.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchDarStatsForUser.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload
      })
      .addCase(fetchDarStatsForUser.rejected, (state, action) => {
        state.loading = false
        state.stats = null
        getAntdMessage()?.error(action.payload || 'Failed to fetch DAR stats')
      })
      // Fetch Viewable Users
      .addCase(fetchViewableUsers.fulfilled, (state, action) => {
        state.viewableUsers = action.payload || []
      })
      // Project summary
      .addCase(fetchProjectSummary.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchProjectSummary.fulfilled, (state, action) => {
        state.loading = false
        state.projectSummary = action.payload
      })
      .addCase(fetchProjectSummary.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Project summary for user
      .addCase(fetchProjectSummaryForUser.fulfilled, (state, action) => {
        state.projectSummary = action.payload || []
      })
      // Fetch Clients
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.clients = action.payload
      })
      // Create Client
      .addCase(createClient.fulfilled, (state, action) => {
        if (!state.clients) state.clients = []
        state.clients.push(action.payload)
      })
  },
})

// Selectors
export const getGanttTasks = (state) => {
  const { darList } = state.dar
  return transformDarToGantt(darList)
}

export const getCalendarEvents = (state) => {
  const { darList } = state.dar
  return transformDarToCalendar(darList)
}

export const { clearSelectedDar } = darSlice.actions
export default darSlice.reducer
