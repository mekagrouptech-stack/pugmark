import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import myTeamService from './myTeamService'

const initialState = {
  teamMembers: [],
  attendanceData: [],
  pendingRequests: {
    attendance: [],
    compoff: [],
    leave: [],
  },
  badgeCounts: {
    attendancePending: 0,
    compoffPending: 0,
    leavePending: 0,
  },
  biometricRequests: [],
  lateMarkRecords: [],
  loading: false,
  error: null,
}

export const fetchTeamMembers = createAsyncThunk(
  'myTeam/fetchTeamMembers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await myTeamService.getTeamMembers()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchAttendance = createAsyncThunk(
  'myTeam/fetchAttendance',
  async (params, { rejectWithValue }) => {
    try {
      const response = await myTeamService.getAttendance(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchDailyAttendanceReport = createAsyncThunk(
  'myTeam/fetchDailyAttendanceReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await myTeamService.getDailyAttendanceReport(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchPendingRequests = createAsyncThunk(
  'myTeam/fetchPendingRequests',
  async (type, { rejectWithValue }) => {
    try {
      const response = await myTeamService.getPendingRequests(type)
      return { type, data: response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const approveRequest = createAsyncThunk(
  'myTeam/approveRequest',
  async ({ type, requestId, note }, { rejectWithValue }) => {
    try {
      const response = await myTeamService.approveRequest(type, requestId, note)
      return { type, requestId, response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createAttendanceRequest = createAsyncThunk(
  'myTeam/createAttendanceRequest',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await myTeamService.createAttendanceRequest(payload)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const rejectRequest = createAsyncThunk(
  'myTeam/rejectRequest',
  async ({ type, requestId, reason }, { rejectWithValue }) => {
    try {
      const response = await myTeamService.rejectRequest(type, requestId, reason)
      return { type, requestId, response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchBiometricRequests = createAsyncThunk(
  'myTeam/fetchBiometricRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await myTeamService.getBiometricRequests()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchLateMarkRecords = createAsyncThunk(
  'myTeam/fetchLateMarkRecords',
  async (params, { rejectWithValue }) => {
    try {
      const response = await myTeamService.getLateMarkRecords(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTeamLeaveHistory = createAsyncThunk(
  'myTeam/fetchTeamLeaveHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await myTeamService.getTeamLeaveHistory(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateAttendance = createAsyncThunk(
  'myTeam/updateAttendance',
  async (updateData, { rejectWithValue }) => {
    try {
      const response = await myTeamService.updateAttendance(updateData)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const myTeamSlice = createSlice({
  name: 'myTeam',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateBadgeCounts: (state, action) => {
      state.badgeCounts = { ...state.badgeCounts, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false
        state.teamMembers = action.payload
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.attendanceData = action.payload
      })
      .addCase(fetchDailyAttendanceReport.fulfilled, (state, action) => {
        state.attendanceData = action.payload
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        const { type, data } = action.payload
        state.pendingRequests[type] = data
        if (type === 'attendance') {
          state.badgeCounts.attendancePending = data.length
        } else if (type === 'compoff') {
          state.badgeCounts.compoffPending = data.length
        } else if (type === 'leave') {
          state.badgeCounts.leavePending = data.length
        }
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        const { type, requestId } = action.payload
        state.pendingRequests[type] = state.pendingRequests[type].filter(
          (req) => req.id !== requestId
        )
        if (type === 'attendance') {
          state.badgeCounts.attendancePending = Math.max(0, state.badgeCounts.attendancePending - 1)
        } else if (type === 'compoff') {
          state.badgeCounts.compoffPending = Math.max(0, state.badgeCounts.compoffPending - 1)
        } else if (type === 'leave') {
          state.badgeCounts.leavePending = Math.max(0, state.badgeCounts.leavePending - 1)
        }
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        const { type, requestId } = action.payload
        state.pendingRequests[type] = state.pendingRequests[type].filter(
          (req) => req.id !== requestId
        )
        if (type === 'attendance') {
          state.badgeCounts.attendancePending = Math.max(0, state.badgeCounts.attendancePending - 1)
        } else if (type === 'compoff') {
          state.badgeCounts.compoffPending = Math.max(0, state.badgeCounts.compoffPending - 1)
        } else if (type === 'leave') {
          state.badgeCounts.leavePending = Math.max(0, state.badgeCounts.leavePending - 1)
        }
      })
      .addCase(fetchBiometricRequests.fulfilled, (state, action) => {
        state.biometricRequests = action.payload
      })
      .addCase(fetchLateMarkRecords.fulfilled, (state, action) => {
        state.lateMarkRecords = action.payload
      })
      .addCase(fetchTeamLeaveHistory.fulfilled, (state, action) => {
        state.pendingRequests.leave = action.payload
        state.badgeCounts.leavePending = action.payload.filter((req) => req.status === 'Pending').length
      })
      .addCase(updateAttendance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        state.loading = false
        // Refresh attendance data after update
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, updateBadgeCounts } = myTeamSlice.actions
export default myTeamSlice.reducer
