import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import dashboardService from './dashboardService'
import { PROJECT_ROLES } from '../../utils/constants'

const initialState = {
  data: null,
  attendanceTrend: [],
  workingReportStatus: [],
  loading: false,
  error: null,
}

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async ({ userId, role, department }, { rejectWithValue }) => {
    try {
      let data
      
      switch (role) {
        case PROJECT_ROLES.ADMIN:
        case 'admin':
          data = await dashboardService.getAdminDashboard(userId)
          break
        case PROJECT_ROLES.EMPLOYEE:
        case 'employee':
          data = await dashboardService.getEmployeeDashboard(userId)
          break
        case PROJECT_ROLES.HOD:
        case 'hod':
        case 'manager':
          data = await dashboardService.getHODDashboard(userId, department)
          break
        case PROJECT_ROLES.HR:
        case 'hr':
          data = await dashboardService.getHRDashboard(userId)
          break
        case PROJECT_ROLES.HEAD_HR:
        case 'head_hr':
          data = await dashboardService.getHeadHRDashboard(userId)
          break
        default:
          data = await dashboardService.getEmployeeDashboard(userId)
      }

      return { data, role, department }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchAttendanceTrend = createAsyncThunk(
  'dashboard/fetchAttendanceTrend',
  async ({ scope, userId, department }, { rejectWithValue }) => {
    try {
      const data = await dashboardService.getAttendanceTrend(scope, userId, department)
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchWorkingReportStatus = createAsyncThunk(
  'dashboard/fetchWorkingReportStatus',
  async ({ scope, userId, department }, { rejectWithValue }) => {
    try {
      const data = await dashboardService.getWorkingReportStatus(scope, userId, department)
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearDashboard: (state) => {
      state.data = null
      state.attendanceTrend = []
      state.workingReportStatus = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload.data
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchAttendanceTrend.fulfilled, (state, action) => {
        state.attendanceTrend = action.payload
      })
      .addCase(fetchWorkingReportStatus.fulfilled, (state, action) => {
        state.workingReportStatus = action.payload
      })
  },
})

export const { clearError, clearDashboard } = dashboardSlice.actions
export default dashboardSlice.reducer
