import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import resignationService from './resignationService'

const initialState = {
  resignations: [],
  teamResignations: [],
  loading: false,
  error: null,
}

export const fetchResignations = createAsyncThunk(
  'resignation/fetchResignations',
  async (params, { rejectWithValue }) => {
    try {
      const response = await resignationService.getResignations(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTeamResignations = createAsyncThunk(
  'resignation/fetchTeamResignations',
  async (params, { rejectWithValue }) => {
    try {
      const response = await resignationService.getTeamResignations(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const applyResignation = createAsyncThunk(
  'resignation/applyResignation',
  async (data, { rejectWithValue }) => {
    try {
      const response = await resignationService.applyResignation(data)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const approveResignation = createAsyncThunk(
  'resignation/approveResignation',
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await resignationService.approveResignation(id)
      return { id, response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const rejectResignation = createAsyncThunk(
  'resignation/rejectResignation',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await resignationService.rejectResignation(id, reason)
      return { id, response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const resignationSlice = createSlice({
  name: 'resignation',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResignations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchResignations.fulfilled, (state, action) => {
        state.loading = false
        state.resignations = action.payload
      })
      .addCase(fetchTeamResignations.fulfilled, (state, action) => {
        state.teamResignations = action.payload
      })
      .addCase(applyResignation.fulfilled, (state, action) => {
        state.resignations.unshift(action.payload)
      })
      .addCase(approveResignation.fulfilled, (state, action) => {
        const { id } = action.payload
        state.teamResignations = state.teamResignations.map((res) =>
          res.id === id ? { ...res, status: 'Approved' } : res
        )
      })
      .addCase(rejectResignation.fulfilled, (state, action) => {
        const { id } = action.payload
        state.teamResignations = state.teamResignations.map((res) =>
          res.id === id ? { ...res, status: 'Rejected' } : res
        )
      })
  },
})

export const { clearError } = resignationSlice.actions
export default resignationSlice.reducer
