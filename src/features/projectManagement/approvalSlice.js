import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchProjects, approveProject } from './projectSlice'

const initialState = {
  pendingApprovals: [],
  approvalHistory: [],
  loading: false,
  error: null,
}

export const fetchPendingApprovals = createAsyncThunk(
  'approval/fetchPendingApprovals',
  async (_, { getState, dispatch }) => {
    try {
      const { auth } = getState()
      await dispatch(fetchProjects({ currentApprover: auth.user.role }))
      const { project } = getState()
      return project.projects.filter(
        (p) => p.currentApprover === auth.user.role && p.status !== 'approved' && p.status !== 'rejected'
      )
    } catch (error) {
      throw new Error(error.message)
    }
  }
)

export const processApproval = createAsyncThunk(
  'approval/processApproval',
  async ({ projectId, action, comment }, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(approveProject({ id: projectId, action, comment }))
      return { projectId, action, comment }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const approvalSlice = createSlice({
  name: 'approval',
  initialState,
  reducers: {
    clearApprovals: (state) => {
      state.pendingApprovals = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.loading = false
        state.pendingApprovals = action.payload
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(processApproval.fulfilled, (state, action) => {
        state.pendingApprovals = state.pendingApprovals.filter(
          (p) => p.id !== action.payload.projectId
        )
      })
  },
})

export const { clearApprovals } = approvalSlice.actions
export default approvalSlice.reducer
