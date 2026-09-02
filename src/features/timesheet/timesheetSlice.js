import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import timesheetService from './timesheetService'

const initialState = {
  timesheets: [],
  clients: [],
  projects: [],
  loading: false,
  error: null,
}

export const fetchTimesheets = createAsyncThunk(
  'timesheet/fetchTimesheets',
  async (params, { rejectWithValue }) => {
    try {
      const response = await timesheetService.getTimesheets(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchClients = createAsyncThunk(
  'timesheet/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await timesheetService.getClients()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchProjects = createAsyncThunk(
  'timesheet/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await timesheetService.getProjects()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimesheets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTimesheets.fulfilled, (state, action) => {
        state.loading = false
        state.timesheets = action.payload
      })
      .addCase(fetchTimesheets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.clients = action.payload
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload
      })
  },
})

export default timesheetSlice.reducer
