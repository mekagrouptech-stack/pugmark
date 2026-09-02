import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import officeService from './officeService'

const initialState = {
  offices: [],
  userOffices: [],
  selectedOffice: null,
  loading: false,
  error: null,
}

// Fetch all offices
export const fetchOffices = createAsyncThunk('office/fetchOffices', async (_, { rejectWithValue }) => {
  try {
    const response = await officeService.getOffices()
    return response
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// Fetch office by ID
export const fetchOfficeById = createAsyncThunk(
  'office/fetchOfficeById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await officeService.getOfficeById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Create office
export const createOffice = createAsyncThunk(
  'office/createOffice',
  async (officeData, { rejectWithValue }) => {
    try {
      const response = await officeService.createOffice(officeData)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Update office
export const updateOffice = createAsyncThunk(
  'office/updateOffice',
  async ({ id, officeData }, { rejectWithValue }) => {
    try {
      const response = await officeService.updateOffice(id, officeData)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Delete office
export const deleteOffice = createAsyncThunk(
  'office/deleteOffice',
  async (id, { rejectWithValue }) => {
    try {
      await officeService.deleteOffice(id)
      return id
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Fetch user's assigned offices
export const fetchUserOffices = createAsyncThunk(
  'office/fetchUserOffices',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await officeService.getUserOffices(userId)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const officeSlice = createSlice({
  name: 'office',
  initialState,
  reducers: {
    setSelectedOffice: (state, action) => {
      state.selectedOffice = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch offices
      .addCase(fetchOffices.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOffices.fulfilled, (state, action) => {
        state.loading = false
        state.offices = action.payload
      })
      .addCase(fetchOffices.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch office by ID
      .addCase(fetchOfficeById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOfficeById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedOffice = action.payload
      })
      .addCase(fetchOfficeById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create office
      .addCase(createOffice.fulfilled, (state, action) => {
        state.offices.push(action.payload)
      })
      // Update office
      .addCase(updateOffice.fulfilled, (state, action) => {
        const index = state.offices.findIndex((office) => office.id === action.payload.id)
        if (index !== -1) {
          state.offices[index] = action.payload
        }
        if (state.selectedOffice?.id === action.payload.id) {
          state.selectedOffice = action.payload
        }
      })
      // Delete office
      .addCase(deleteOffice.fulfilled, (state, action) => {
        state.offices = state.offices.filter((office) => office.id !== action.payload)
        if (state.selectedOffice?.id === action.payload) {
          state.selectedOffice = null
        }
      })
      // Fetch user offices
      .addCase(fetchUserOffices.fulfilled, (state, action) => {
        state.userOffices = action.payload
      })
  },
})

export const { setSelectedOffice, clearError } = officeSlice.actions
export default officeSlice.reducer
