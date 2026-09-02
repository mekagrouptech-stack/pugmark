import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAntdMessage } from '../../utils/antdMessage'
import permissionService, { DEFAULT_PERMISSIONS } from './permissionService'

const initialState = {
  // Start with defaults; real data will be loaded from backend
  permissions: DEFAULT_PERMISSIONS,
  loading: false,
  error: null,
}

export const fetchPermissions = createAsyncThunk(
  'permission/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const permissions = await permissionService.fetchPermissionsFromServer()
      return permissions
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateRolePermission = createAsyncThunk(
  'permission/updateRolePermission',
  async ({ role, permission, enabled }, { rejectWithValue }) => {
    try {
      const permissions = await permissionService.updateRolePermission(
        role,
        permission,
        enabled
      )
      getAntdMessage()?.success(`Permission ${enabled ? 'enabled' : 'disabled'} for ${role}`)
      return permissions
    } catch (error) {
      getAntdMessage()?.error('Failed to update permission')
      return rejectWithValue(error.message)
    }
  }
)

export const resetRolePermissions = createAsyncThunk(
  'permission/resetRolePermissions',
  async (role, { rejectWithValue }) => {
    try {
      const updated = await permissionService.resetRolePermissions(role)
      getAntdMessage()?.success(`Permissions reset for ${role}`)
      return updated
    } catch (error) {
      getAntdMessage()?.error('Failed to reset permissions')
      return rejectWithValue(error.message)
    }
  }
)

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false
        state.permissions = action.payload
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateRolePermission.fulfilled, (state, action) => {
        state.permissions = action.payload
      })
      .addCase(resetRolePermissions.fulfilled, (state, action) => {
        state.permissions = action.payload
      })
  },
})

export const { clearError } = permissionSlice.actions

// Selectors
export const selectPermissions = (state) => state.permission.permissions
export const selectPermissionsForRole = (state, role) => {
  const permissions = state.permission.permissions
  return permissions[role] || []
}
export const selectHasPermission = (state, role, permission) => {
  const rolePermissions = selectPermissionsForRole(state, role)
  return rolePermissions.includes(permission)
}

export default permissionSlice.reducer
