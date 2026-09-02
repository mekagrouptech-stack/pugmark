import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from './authService'
import { STORAGE_KEYS } from '../../utils/constants'

const initialState = {
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || null,
  token: localStorage.getItem(STORAGE_KEYS.TOKEN) || null,
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Passwordless sign-in. requestOtp only mails the code — it does not create a
// session, so it deliberately leaves auth state untouched.
export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (email, { rejectWithValue }) => {
    try {
      return await authService.requestOtp(email)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.verifyOtp(payload)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  authService.logout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        // Normalize role to uppercase for consistency
        const normalizedUser = {
          ...action.payload.user,
          role: action.payload.user.role?.toUpperCase() || action.payload.user.role,
        }
        state.user = normalizedUser
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem(STORAGE_KEYS.TOKEN, action.payload.token)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser))
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // A code exchange yields the same session a password login does, so it
      // runs through the same reducers rather than a parallel set that could
      // drift out of sync.
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false
        const normalizedUser = {
          ...action.payload.user,
          role: action.payload.user.role?.toUpperCase() || action.payload.user.role,
        }
        state.user = normalizedUser
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem(STORAGE_KEYS.TOKEN, action.payload.token)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser))
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
