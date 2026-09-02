import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import profileService from './profileService'

const initialState = {
  profileData: null,
  loading: false,
  error: null,
}

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileService.getProfile()
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateField = createAsyncThunk(
  'profile/updateField',
  async ({ group, field, value }, { rejectWithValue }) => {
    try {
      const response = await profileService.updateField(group, field, value)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateGroup = createAsyncThunk(
  'profile/updateGroup',
  async ({ group, data }, { rejectWithValue }) => {
    try {
      const response = await profileService.updateGroup(group, data)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const uploadDocument = createAsyncThunk(
  'profile/uploadDocument',
  async ({ field, file }, { rejectWithValue }) => {
    try {
      const response = await profileService.uploadDocument(field, file)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profileData = action.payload
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateField.fulfilled, (state, action) => {
        if (state.profileData) {
          const { group, field, value } = action.payload
          if (!state.profileData[group]) {
            state.profileData[group] = {}
          }
          state.profileData[group][field] = value
        }
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        if (state.profileData) {
          const { group, data } = action.payload
          state.profileData[group] = { ...state.profileData[group], ...data }
        }
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        if (state.profileData) {
          const { field, url } = action.payload
          if (field === 'avatar') {
            if (!state.profileData.basicInformation) {
              state.profileData.basicInformation = {}
            }
            state.profileData.basicInformation.avatar = url
          } else {
            if (!state.profileData.documents) {
              state.profileData.documents = {}
            }
            state.profileData.documents[field] = url
          }
        }
      })
  },
})

export const { clearError } = profileSlice.actions
export default profileSlice.reducer
