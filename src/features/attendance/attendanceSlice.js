import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import attendanceService from './attendanceService'

const initialState = {
  attendance: [],
  currentPunch: null,
  loading: false,
  error: null,
}

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAttendance(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const punchIn = createAsyncThunk('attendance/punchIn', async (punchData, { rejectWithValue }) => {
  try {
    const response = await attendanceService.punchIn(punchData)
    return response
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const punchOut = createAsyncThunk('attendance/punchOut', async (punchData, { rejectWithValue }) => {
  try {
    const response = await attendanceService.punchOut(punchData)
    return response
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearCurrentPunch: (state) => {
      state.currentPunch = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false
        state.attendance = action.payload
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(punchIn.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(punchIn.fulfilled, (state, action) => {
        state.loading = false
        state.currentPunch = action.payload
      })
      .addCase(punchIn.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(punchOut.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(punchOut.fulfilled, (state, action) => {
        state.loading = false
        state.currentPunch = action.payload
      })
      .addCase(punchOut.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearCurrentPunch, clearError } = attendanceSlice.actions
export default attendanceSlice.reducer
