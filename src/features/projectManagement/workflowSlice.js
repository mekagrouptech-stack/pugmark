import { createSlice } from '@reduxjs/toolkit'
import { APPROVAL_HIERARCHY, PROJECT_ROLES } from '../../utils/constants'

const initialState = {
  workflow: {
    nodes: APPROVAL_HIERARCHY.map((role, index) => ({
      id: role,
      type: 'default',
      position: { x: index * 200, y: 100 },
      data: {
        label: role.toUpperCase().replace('_', ' '),
        role,
      },
    })),
    edges: APPROVAL_HIERARCHY.slice(0, -1).map((role, index) => ({
      id: `e${index}-${index + 1}`,
      source: role,
      target: APPROVAL_HIERARCHY[index + 1],
      type: 'smoothstep',
      animated: true,
    })),
  },
  editable: false,
}

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    updateWorkflow: (state, action) => {
      state.workflow = action.payload
    },
    setEditable: (state, action) => {
      state.editable = action.payload
    },
    resetWorkflow: (state) => {
      state.workflow = initialState.workflow
    },
  },
})

export const { updateWorkflow, setEditable, resetWorkflow } = workflowSlice.actions
export default workflowSlice.reducer
