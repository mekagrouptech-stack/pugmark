import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAntdMessage } from '../../utils/antdMessage'
import projectService from './projectService'
import { PROJECT_STATUS, APPROVAL_HIERARCHY, PROJECT_ROLES } from '../../utils/constants'

const initialState = {
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
}

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (params, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjects(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchProjectById = createAsyncThunk(
  'project/fetchProjectById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createProject = createAsyncThunk(
  'project/createProject',
  async (data, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const projectData = {
        ...data,
        createdBy: auth.user.id,
        createdByName: auth.user.name,
        status: PROJECT_STATUS.SUBMITTED,
        currentApprover: PROJECT_ROLES.HOD,
        approvalHistory: [
          {
            action: 'created',
            by: auth.user.name,
            byRole: auth.user.role,
            timestamp: new Date().toISOString(),
            comment: 'Project created',
          },
        ],
      }
      const response = await projectService.createProject(projectData)
      getAntdMessage()?.success('Project created and submitted for approval')
      return response
    } catch (error) {
      getAntdMessage()?.error('Failed to create project')
      return rejectWithValue(error.message)
    }
  }
)

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await projectService.updateProject(id, data)
      getAntdMessage()?.success('Project updated successfully')
      return response
    } catch (error) {
      getAntdMessage()?.error('Failed to update project')
      return rejectWithValue(error.message)
    }
  }
)

export const approveProject = createAsyncThunk(
  'project/approveProject',
  async ({ id, action, comment }, { rejectWithValue, getState }) => {
    try {
      const { auth, project } = getState()
      const currentProject = project.projects.find((p) => p.id === id) || project.selectedProject
      
      if (!currentProject) {
        throw new Error('Project not found')
      }

      const approvalData = {
        action,
        comment,
        by: auth.user.id,
        byName: auth.user.name,
        byRole: auth.user.role,
        timestamp: new Date().toISOString(),
      }

      // Determine next approver based on hierarchy
      const currentIndex = APPROVAL_HIERARCHY.indexOf(currentProject.currentApprover)
      let nextStatus = currentProject.status
      let nextApprover = null

      if (action === 'approve') {
        if (currentIndex < APPROVAL_HIERARCHY.length - 1) {
          nextApprover = APPROVAL_HIERARCHY[currentIndex + 1]
          nextStatus = `${nextApprover}_review`
        } else {
          nextStatus = PROJECT_STATUS.APPROVED
          nextApprover = null
        }
      } else if (action === 'reject') {
        nextStatus = PROJECT_STATUS.REJECTED
        nextApprover = null
      } else if (action === 'send_back') {
        if (currentIndex > 0) {
          nextApprover = APPROVAL_HIERARCHY[currentIndex - 1]
          nextStatus = `${nextApprover}_review`
        } else {
          nextStatus = PROJECT_STATUS.SUBMITTED
          nextApprover = PROJECT_ROLES.EMPLOYEE
        }
      }

      const response = await projectService.approveProject(id, {
        ...approvalData,
        status: nextStatus,
        currentApprover: nextApprover,
      })
      
      getAntdMessage()?.success(`Project ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back'} successfully`)
      return response
    } catch (error) {
      getAntdMessage()?.error('Failed to process approval')
      return rejectWithValue(error.message)
    }
  }
)

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearSelectedProject: (state) => {
      state.selectedProject = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedProject = action.payload
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload)
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        if (state.selectedProject && state.selectedProject.id === action.payload.id) {
          state.selectedProject = action.payload
        }
      })
      .addCase(approveProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        if (state.selectedProject && state.selectedProject.id === action.payload.id) {
          state.selectedProject = action.payload
        }
      })
  },
})

export const { clearSelectedProject } = projectSlice.actions
export default projectSlice.reducer
