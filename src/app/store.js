import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import attendanceReducer from '../features/attendance/attendanceSlice'
import timesheetReducer from '../features/timesheet/timesheetSlice'
import leaveReducer from '../features/leave/leaveSlice'
import salaryReducer from '../features/salary/salarySlice'
import reimbursementReducer from '../features/reimbursement/reimbursementSlice'
import resignationReducer from '../features/resignation/resignationSlice'
import hrReducer from '../features/hr/hrSlice'
import helpdeskReducer from '../features/helpdesk/helpdeskSlice'
import profileReducer from '../features/profile/profileSlice'
import myTeamReducer from '../features/myTeam/myTeamSlice'
import exitClearanceReducer from '../features/resignation/exitClearanceSlice'
import darReducer from '../features/dar/darSlice'
// Project Management
import userReducer from '../features/projectManagement/userSlice'
import projectReducer from '../features/projectManagement/projectSlice'
import taskReducer from '../features/projectManagement/taskSlice'
import approvalReducer from '../features/projectManagement/approvalSlice'
import workflowReducer from '../features/projectManagement/workflowSlice'
import permissionReducer from '../features/permissions/permissionSlice'
import dashboardReducer from '../features/dashboard/dashboardSlice'
import officeReducer from '../features/office/officeSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    timesheet: timesheetReducer,
    leave: leaveReducer,
    salary: salaryReducer,
    reimbursement: reimbursementReducer,
    resignation: resignationReducer,
    exitClearance: exitClearanceReducer,
    hr: hrReducer,
    helpdesk: helpdeskReducer,
    profile: profileReducer,
    myTeam: myTeamReducer,
    dar: darReducer,
    // Project Management
    users: userReducer,
    project: projectReducer,
    task: taskReducer,
    approval: approvalReducer,
    workflow: workflowReducer,
    permission: permissionReducer,
    dashboard: dashboardReducer,
    office: officeReducer,
  },
})
