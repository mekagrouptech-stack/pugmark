import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import exitClearanceService from './exitClearanceService'

const initialState = {
  departments: [],
  requests: [],
  loading: false,
  error: null,
}

export const fetchDepartments = createAsyncThunk(
  'exitClearance/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await exitClearanceService.getDepartments()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchExitClearanceRequests = createAsyncThunk(
  'exitClearance/fetchExitClearanceRequests',
  async (params, { rejectWithValue }) => {
    try {
      const response = await exitClearanceService.getExitClearanceRequests(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createDepartment = createAsyncThunk(
  'exitClearance/createDepartment',
  async (data, { rejectWithValue }) => {
    try {
      const response = await exitClearanceService.createDepartment(data)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateDepartment = createAsyncThunk(
  'exitClearance/updateDepartment',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await exitClearanceService.updateDepartment(id, data)
      return { id, data: response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const toggleDepartmentStatus = createAsyncThunk(
  'exitClearance/toggleDepartmentStatus',
  async ({ id, enabled }, { rejectWithValue }) => {
    try {
      const response = await exitClearanceService.toggleDepartmentStatus(id, enabled)
      return { id, enabled }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const exitClearanceSlice = createSlice({
  name: 'exitClearance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false
        state.departments = action.payload
      })
      .addCase(fetchExitClearanceRequests.fulfilled, (state, action) => {
        state.requests = action.payload
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload)
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const { id, data } = action.payload
        state.departments = state.departments.map((dept) =>
          dept.id === id ? { ...dept, ...data } : dept
        )
      })
      .addCase(toggleDepartmentStatus.fulfilled, (state, action) => {
        const { id, enabled } = action.payload
        state.departments = state.departments.map((dept) =>
          dept.id === id ? { ...dept, enabled } : dept
        )
      })
  },
})

export const { clearError } = exitClearanceSlice.actions
export default exitClearanceSlice.reducer
