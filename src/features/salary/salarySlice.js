import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import salaryService from './salaryService'

const initialState = {
  salary: null,
  payslips: [],
  loading: false,
  error: null,
}

export const fetchSalary = createAsyncThunk(
  'salary/fetchSalary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await salaryService.getSalary()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchPayslips = createAsyncThunk(
  'salary/fetchPayslips',
  async (_, { rejectWithValue }) => {
    try {
      const response = await salaryService.getPayslips()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const salarySlice = createSlice({
  name: 'salary',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalary.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchSalary.fulfilled, (state, action) => {
        state.loading = false
        state.salary = action.payload
      })
      .addCase(fetchSalary.rejected, (state) => {
        state.loading = false
      })
      .addCase(fetchPayslips.fulfilled, (state, action) => {
        state.payslips = action.payload
      })
  },
})

export default salarySlice.reducer
