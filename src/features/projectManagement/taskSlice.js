import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAntdMessage } from '../../utils/antdMessage'
import taskService from './taskService'
import { TASK_STATUS } from '../../utils/constants'

const initialState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
}

export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await taskService.getTasks(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTaskById = createAsyncThunk(
  'task/fetchTaskById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await taskService.getTaskById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createTask = createAsyncThunk(
  'task/createTask',
  async (data, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const taskData = {
        ...data,
        createdBy: auth.user.id,
        createdByName: auth.user.name,
        status: TASK_STATUS.TODO,
      }
      const response = await taskService.createTask(taskData)
      getAntdMessage()?.success('Task created successfully')
      return response
    } catch (error) {
      getAntdMessage()?.error('Failed to create task')
      return rejectWithValue(error.message)
    }
  }
)

export const updateTask = createAsyncThunk(
  'task/updateTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await taskService.updateTask(id, data)
      getAntdMessage()?.success('Task updated successfully')
      return response
    } catch (error) {
      getAntdMessage()?.error('Failed to update task')
      return rejectWithValue(error.message)
    }
  }
)

export const updateTaskStatus = createAsyncThunk(
  'task/updateTaskStatus',
  async ({ id, status, comment }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const response = await taskService.updateTaskStatus(id, {
        status,
        comment,
        updatedBy: auth.user.id,
        updatedByName: auth.user.name,
        timestamp: new Date().toISOString(),
      })
      getAntdMessage()?.success('Task status updated')
      return response
    } catch (error) {
      getAntdMessage()?.error('Failed to update task status')
      return rejectWithValue(error.message)
    }
  }
)

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    clearSelectedTask: (state) => {
      state.selectedTask = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.selectedTask = action.payload
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload)
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.selectedTask && state.selectedTask.id === action.payload.id) {
          state.selectedTask = action.payload
        }
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.selectedTask && state.selectedTask.id === action.payload.id) {
          state.selectedTask = action.payload
        }
      })
  },
})

export const { clearSelectedTask } = taskSlice.actions
export default taskSlice.reducer
