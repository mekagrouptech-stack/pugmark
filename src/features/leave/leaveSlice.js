import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import leaveService from './leaveService'

const initialState = {
  leaves: [],
  pendingApprovalLeaves: [],
  teamLeavesForManager: [],
  leaveBalance: null,
  leaveHistory: [],
  holidays: [],
  loading: false,
  error: null,
}

export const fetchLeaves = createAsyncThunk(
  'leave/fetchLeaves',
  async (params, { rejectWithValue }) => {
    try {
      const response = await leaveService.getLeaves(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchLeaveBalance = createAsyncThunk(
  'leave/fetchLeaveBalance',
  async (year, { rejectWithValue }) => {
    try {
      const response = await leaveService.getLeaveBalance(year)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const applyLeave = createAsyncThunk(
  'leave/applyLeave',
  async (data, { rejectWithValue }) => {
    try {
      const response = await leaveService.applyLeave(data)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchPendingApprovalLeaves = createAsyncThunk(
  'leave/fetchPendingApprovalLeaves',
  async (_, { rejectWithValue }) => {
    try {
      return await leaveService.getPendingApprovalLeaves()
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchTeamLeavesForManager = createAsyncThunk(
  'leave/fetchTeamLeavesForManager',
  async (params, { rejectWithValue }) => {
    try {
      return await leaveService.getTeamLeavesForManager(params)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const approveLeave = createAsyncThunk(
  'leave/approveLeave',
  async (id, { rejectWithValue }) => {
    try {
      await leaveService.approveLeave(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const rejectLeave = createAsyncThunk(
  'leave/rejectLeave',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      await leaveService.rejectLeave(id, reason)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false
        state.leaves = action.payload
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.leaveBalance = action.payload
      })
      .addCase(applyLeave.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchPendingApprovalLeaves.fulfilled, (state, action) => {
        state.pendingApprovalLeaves = action.payload
      })
      .addCase(fetchTeamLeavesForManager.fulfilled, (state, action) => {
        state.teamLeavesForManager = action.payload
      })
      .addCase(approveLeave.fulfilled, (state, action) => {
        const id = action.payload
        if (state.pendingApprovalLeaves) {
          state.pendingApprovalLeaves = state.pendingApprovalLeaves.filter((l) => l.id !== id)
        }
        if (state.teamLeavesForManager) {
          const idx = state.teamLeavesForManager.findIndex((l) => l.id === id)
          if (idx !== -1) state.teamLeavesForManager[idx].status = 'Approved'
        }
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const id = action.payload
        if (state.pendingApprovalLeaves) {
          state.pendingApprovalLeaves = state.pendingApprovalLeaves.filter((l) => l.id !== id)
        }
        if (state.teamLeavesForManager) {
          const idx = state.teamLeavesForManager.findIndex((l) => l.id === id)
          if (idx !== -1) state.teamLeavesForManager[idx].status = 'Rejected'
        }
      })
  },
})

export default leaveSlice.reducer
