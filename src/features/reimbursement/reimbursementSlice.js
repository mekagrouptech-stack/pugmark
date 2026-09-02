import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import reimbursementService from './reimbursementService'

const initialState = {
  requests: [],
  teamRequests: [],
  loading: false,
  error: null,
}

export const fetchReimbursements = createAsyncThunk(
  'reimbursement/fetchReimbursements',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reimbursementService.getReimbursements(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchTeamReimbursements = createAsyncThunk(
  'reimbursement/fetchTeamReimbursements',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reimbursementService.getTeamReimbursements(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const createReimbursement = createAsyncThunk(
  'reimbursement/createReimbursement',
  async (data, { rejectWithValue }) => {
    try {
      const response = await reimbursementService.createReimbursement(data)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const createTravelReimbursement = createAsyncThunk(
  'reimbursement/createTravelReimbursement',
  async (data, { rejectWithValue }) => {
    try {
      const response = await reimbursementService.createTravelReimbursement(data)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const approveReimbursement = createAsyncThunk(
  'reimbursement/approveReimbursement',
  async ({ id, type }, { rejectWithValue }) => {
    try {
      const response = await reimbursementService.approveReimbursement(id)
      return { id, type, response }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const rejectReimbursement = createAsyncThunk(
  'reimbursement/rejectReimbursement',
  async ({ id, type, reason }, { rejectWithValue }) => {
    try {
      const response = await reimbursementService.rejectReimbursement(id, reason)
      return { id, type, response }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const delegateReimbursement = createAsyncThunk(
  'reimbursement/delegateReimbursement',
  async ({ id, delegateTo }, { rejectWithValue }) => {
    try {
      const response = await reimbursementService.delegateReimbursement(id, delegateTo)
      return { id, response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const reimbursementSlice = createSlice({
  name: 'reimbursement',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReimbursements.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReimbursements.fulfilled, (state, action) => {
        state.loading = false
        state.requests = action.payload
      })
      .addCase(fetchReimbursements.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchTeamReimbursements.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeamReimbursements.fulfilled, (state, action) => {
        state.loading = false
        state.teamRequests = action.payload
      })
      .addCase(fetchTeamReimbursements.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createReimbursement.fulfilled, (state, action) => {
        state.requests.unshift(action.payload)
      })
      .addCase(createTravelReimbursement.fulfilled, (state, action) => {
        state.requests.unshift(action.payload)
      })
      .addCase(approveReimbursement.fulfilled, (state, action) => {
        const { id, type } = action.payload
        if (type === 'team') {
          state.teamRequests = state.teamRequests.map((req) =>
            req.id === id ? { ...req, status: 'Approved' } : req
          )
        } else {
          state.requests = state.requests.map((req) =>
            req.id === id ? { ...req, status: 'Approved' } : req
          )
        }
      })
      .addCase(rejectReimbursement.fulfilled, (state, action) => {
        const { id, type } = action.payload
        if (type === 'team') {
          state.teamRequests = state.teamRequests.map((req) =>
            req.id === id ? { ...req, status: 'Rejected' } : req
          )
        } else {
          state.requests = state.requests.map((req) =>
            req.id === id ? { ...req, status: 'Rejected' } : req
          )
        }
      })
  },
})

export const { clearError } = reimbursementSlice.actions
export default reimbursementSlice.reducer
