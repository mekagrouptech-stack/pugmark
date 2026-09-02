import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import helpdeskService from './helpdeskService'

const initialState = {
  tickets: [],
  closedTickets: [],
  loading: false,
  error: null,
}

export const fetchTickets = createAsyncThunk(
  'helpdesk/fetchTickets',
  async (params, { rejectWithValue }) => {
    try {
      const response = await helpdeskService.getTickets(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchClosedTickets = createAsyncThunk(
  'helpdesk/fetchClosedTickets',
  async (params, { rejectWithValue }) => {
    try {
      const response = await helpdeskService.getClosedTickets(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createTicket = createAsyncThunk(
  'helpdesk/createTicket',
  async (data, { rejectWithValue }) => {
    try {
      const response = await helpdeskService.createTicket(data)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateTicket = createAsyncThunk(
  'helpdesk/updateTicket',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await helpdeskService.updateTicket(id, data)
      return { id, data: response }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const helpdeskSlice = createSlice({
  name: 'helpdesk',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false
        state.tickets = action.payload
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchClosedTickets.fulfilled, (state, action) => {
        state.closedTickets = action.payload
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload)
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        const { id, data } = action.payload
        state.tickets = state.tickets.map((ticket) =>
          ticket.id === id ? { ...ticket, ...data } : ticket
        )
        state.closedTickets = state.closedTickets.map((ticket) =>
          ticket.id === id ? { ...ticket, ...data } : ticket
        )
      })
  },
})

export const { clearError } = helpdeskSlice.actions
export default helpdeskSlice.reducer
