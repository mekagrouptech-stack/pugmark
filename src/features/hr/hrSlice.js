import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import hrService from './hrService'

const initialState = {
  payroll: [],
  employees: [],
  salaryStructures: [],
  loading: false,
  error: null,
}

export const fetchPayroll = createAsyncThunk(
  'hr/fetchPayroll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await hrService.getPayroll(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Calculate payroll for a specific employee and month
export const calculatePayroll = createAsyncThunk(
  'hr/calculatePayroll',
  async ({ userId, year, month }, { rejectWithValue }) => {
    try {
      const response = await hrService.calculatePayroll({ userId, year, month })
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const calculateAllPayroll = createAsyncThunk(
  'hr/calculateAllPayroll',
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const response = await hrService.calculateAllPayroll({ year, month })
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchEmployees = createAsyncThunk(
  'hr/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hrService.getEmployees()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const hrSlice = createSlice({
  name: 'hr',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayroll.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPayroll.fulfilled, (state, action) => {
        state.loading = false
        state.payroll = action.payload || []
        console.log('Payroll slice updated with', action.payload?.length || 0, 'records')
      })
      .addCase(fetchPayroll.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      .addCase(calculatePayroll.pending, (state) => {
        state.loading = true
      })
      .addCase(calculatePayroll.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(calculatePayroll.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false
        state.employees = action.payload || []
        console.log('Employees stored in Redux:', action.payload?.length || 0, 'records')
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
        console.error('Failed to fetch employees:', action.payload || action.error.message)
      })
  },
})

export default hrSlice.reducer
