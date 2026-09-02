import { createSlice } from '@reduxjs/toolkit'
import { PROJECT_ROLES } from '../../utils/constants'

const initialState = {
  users: [
    {
      id: 1,
      email: 'admin@hrms.com',
      password: 'admin123',
      name: 'Admin User',
      role: PROJECT_ROLES.ADMIN,
      department: 'Administration',
      position: 'System Administrator',
    },
    {
      id: 2,
      email: 'headhr@hrms.com',
      password: 'headhr123',
      name: 'Head HR',
      role: PROJECT_ROLES.HEAD_HR,
      department: 'Human Resources',
      position: 'Head of HR',
    },
    {
      id: 3,
      email: 'hr@hrms.com',
      password: 'hr123',
      name: 'HR Manager',
      role: PROJECT_ROLES.HR,
      department: 'Human Resources',
      position: 'HR Manager',
    },
    {
      id: 4,
      email: 'hod@hrms.com',
      password: 'hod123',
      name: 'HOD',
      role: PROJECT_ROLES.HOD,
      department: 'Engineering',
      position: 'Head of Department',
    },
    {
      id: 5,
      email: 'employee@hrms.com',
      password: 'employee123',
      name: 'Employee',
      role: PROJECT_ROLES.EMPLOYEE,
      department: 'Engineering',
      position: 'Software Engineer',
    },
    {
      id: 6,
      email: 'employee2@hrms.com',
      password: 'employee123',
      name: 'Employee 2',
      role: PROJECT_ROLES.EMPLOYEE,
      department: 'Engineering',
      position: 'Senior Software Engineer',
    },
  ],
  currentUser: null,
}

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload
    },
    addUser: (state, action) => {
      state.users.push(action.payload)
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
    },
  },
})

export const { setCurrentUser, addUser, updateUser } = userSlice.actions
export default userSlice.reducer
