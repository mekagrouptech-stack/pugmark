import React, { useState, useEffect } from 'react'
import { Menu, Badge } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  WalletOutlined,
  LogoutOutlined,
  SettingOutlined,
  CalculatorOutlined,
  QuestionCircleOutlined,
  BarChartOutlined,
  SwapOutlined,
  FileSearchOutlined,
  UsergroupAddOutlined,
  FileDoneOutlined,
  NotificationOutlined,
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { ROLES, PROJECT_ROLES } from '../utils/constants'
import { fetchPendingRequests } from '../features/myTeam/myTeamSlice'
import { filterByPermission, getRoutePermission } from '../utils/permissionUtils'
import { PERMISSION_KEYS } from '../features/permissions/permissionService'
import { fetchPermissions } from '../features/permissions/permissionSlice'

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const myTeamState = useSelector((state) => state.myTeam) || {}
  const badgeCounts = myTeamState.badgeCounts || { attendancePending: 0, compoffPending: 0, leavePending: 0 }
  const [selectedKeys, setSelectedKeys] = useState([location.pathname])
  const [openKeys, setOpenKeys] = useState([])

  useEffect(() => {
    setSelectedKeys([location.pathname])
    const pathParts = location.pathname.split('/').filter(Boolean)
    const newOpenKeys = []
    
    // Always open parent menus for nested routes
    if (pathParts.length > 1) {
      const parentPath = `/${pathParts[0]}`
      if (!newOpenKeys.includes(parentPath)) {
        newOpenKeys.push(parentPath)
      }
    }
    
    // Ensure My Team is open if on any my-team route
    if (pathParts[0] === 'my-team' || pathParts.includes('my-team')) {
      if (!newOpenKeys.includes('/my-team')) {
        newOpenKeys.push('/my-team')
      }
    }
    // Ensure Attendance is open if on any attendance route
    if (pathParts[0] === 'attendance') {
      if (!newOpenKeys.includes('/attendance')) {
        newOpenKeys.push('/attendance')
      }
    }

    
    // Update open keys
    if (newOpenKeys.length > 0) {
      setOpenKeys((prevKeys) => {
        const combined = [...new Set([...prevKeys, ...newOpenKeys])]
        return combined
      })
    }
  }, [location.pathname])

  const permissions = useSelector((state) => state.permission.permissions)
  const userRole = user?.role
  const userRoleLower = userRole?.toLowerCase()
  
  // Role checks - case insensitive
  const isManager = userRoleLower === ROLES.MANAGER || userRoleLower === 'manager'
  const isHR = userRoleLower === ROLES.HR || userRoleLower === 'hr'
  // Admin check - handle ADMIN, admin, System Administrator, System Admin
  const isAdmin = userRoleLower === PROJECT_ROLES.ADMIN || 
                  userRoleLower === 'admin' || 
                  userRole === 'ADMIN' ||
                  userRole === PROJECT_ROLES.ADMIN ||
                  userRoleLower === 'system administrator' ||
                  userRoleLower === 'system admin'
  const isHeadHR = userRoleLower === PROJECT_ROLES.HEAD_HR || userRoleLower === 'head_hr'
  const isHOD = userRoleLower === PROJECT_ROLES.HOD || userRoleLower === 'hod' || isManager
  const isEmployee = userRoleLower === PROJECT_ROLES.EMPLOYEE || userRoleLower === 'employee'

  // Helper function to check permission
  const hasPermission = (permissionKey) => {
    if (!user || !permissions || !permissionKey) return true // Default to visible if no permission key
    if (isAdmin) return true // Admin always has access
    const rolePermissions = permissions[user.role] || []
    return rolePermissions.includes(permissionKey)
  }

  // Only "My" items - no filtering, same sidebar for all logins
  const filterMenuByPermission = (items) => items

  useEffect(() => {
    // Managers: team requests; Head HR/Admin: attendance regulation goes to Head HR
    if (isManager || isHeadHR || isAdmin) {
      dispatch(fetchPendingRequests('attendance'))
      dispatch(fetchPendingRequests('compoff'))
      dispatch(fetchPendingRequests('leave'))
    }
  }, [dispatch, isManager, isHeadHR, isAdmin])

  // Fetch permissions on mount
  useEffect(() => {
    dispatch(fetchPermissions())
  }, [dispatch])

  // Base "My" items - visible for ALL logins
  const baseMenuItems = [
    {
      key: '/leaves',
      icon: <CalendarOutlined />,
      label: 'My Leaves',
      children: [
        { key: '/leaves/apply', label: 'Apply for Leave' },
        // { key: '/leaves/balance', label: 'My Leave Balance' },
        { key: '/leaves/history', label: 'My Leave History' },
        { key: '/leaves/pending-approval', label: 'Pending Leave Approval' },
        { key: '/leaves/balance-log', label: 'Leave Balance Log' },
      ],
    },
    {
      key: '/attendance',
      icon: <ClockCircleOutlined />,
      label: 'My Attendance',
      children: [
        { key: '/attendance/my-attendance', label: 'My Attendance' },
        { key: '/attendance/request-regulation', label: 'Request Attendance Regulation' },
        ...(isManager || isHR || isAdmin || isHOD || isHeadHR
          ? [
              {
                key: '/my-team/attendance-pending',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Attendance Regulation Pending
                    {badgeCounts.attendancePending > 0 && (
                      <Badge count={badgeCounts.attendancePending} size="small" />
                    )}
                  </span>
                ),
              },
            ]
          : []),
        { key: '/attendance/report-map', label: 'Attendance Report with Map' },
        ...(isHR || isAdmin || isHOD || isHeadHR || isManager
          ? [{ key: '/attendance/biometric', label: 'Biometric Attendance' }]
          : []),
      ],
    },
    {
      key: '/my-team',
      icon: <UsergroupAddOutlined />,
      label: 'My Team',
      children: [
        { key: '/my-team/members', label: 'My Team Members' },
        { key: '/my-team/attendance', label: "My Team's Attendance" },
        { key: '/my-team/daily-attendance', label: 'Daily Attendance Report' },
        ...(isManager || isHR || isAdmin || isHOD || isHeadHR
          ? [
              {
                key: '/my-team/attendance-pending',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Attendance Regulation Pending
                    {badgeCounts.attendancePending > 0 && (
                      <Badge count={badgeCounts.attendancePending} size="small" />
                    )}
                  </span>
                ),
              },
            ]
          : []),
        { key: '/my-team/compoff-pending', label: 'Compoff Pending Request' },
        { key: '/my-team/leave-history', label: "My Team's Leave History" },
        {
          key: '/my-team/pending-requests',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              My Team Pending Request
              {badgeCounts.leavePending > 0 && (
                <Badge count={badgeCounts.leavePending} size="small" />
              )}
            </span>
          ),
        },
        { key: '/my-team/biometric-requests', label: 'Virtual Biometric Attendance Punches Request' },
        { key: '/my-team/team-leave-history', label: 'Team Leave History' },
        { key: '/my-team/late-mark', label: 'List Late Mark' },
      ],
    },
    {
      key: '/salary',
      icon: <DollarOutlined />,
      label: 'Salary',
      children: [
        { key: '/salary/my-salary', label: 'My Salary' },
        { key: '/salary/payslips', label: 'My Payslips' },
      ],
    },
    {
      key: '/reimbursements',
      icon: <WalletOutlined />,
      label: 'Reimbursements',
      children: [
        { key: '/reimbursements/non-ctc', label: 'Non-CTC Reimbursement' },
        { key: '/reimbursements/travel', label: 'Travel Reimbursement' },
        { key: '/reimbursements/my-requests', label: 'My Reimbursement Request' },
        { key: '/reimbursements/team-requests', label: 'My Team Reimbursement Request' },
      ],
    },
    {
      key: '/notices',
      icon: <NotificationOutlined />,
      label: 'Notices',
      children: [
        { key: '/notices/my', label: 'My Notices' },
        ...(isAdmin || isHR || isHeadHR
          ? [{ key: '/notices/send', label: 'Send Notice' }]
          : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            key: '/hr',
            icon: <SettingOutlined />,
            label: 'HR Manager',
            children: [
              { key: '/hr/payroll', label: 'Payroll' },
              { key: '/hr/generate-letters', label: 'Generate Letters' },
              { key: '/hr/leave-balance-all', label: 'Leave Balance of All Users' },
              { key: '/hr/extra-earnings', label: 'Extra Earnings / Deductions' },
              { key: '/hr/invoice-employees', label: 'Invoice Employees' },
              { key: '/hr/configure-salary-heads', label: 'Configure Salary Heads' },
              { key: '/hr/salary-structures', label: 'Salary Structures' },
              { key: '/hr/hold-salaries', label: 'Hold Salaries' },
              { key: '/hr/salary-reports', label: 'List Salary Reports' },
              { key: '/hr/designation-master', label: 'Designation Master' },
              { key: '/hr/employee-code-series', label: 'Employee Code Series' },
              { key: '/hr/pending-requests', label: 'List Pending User Requests' },
            ],
          },
          { key: '/admin/users', icon: <UserOutlined />, label: 'User Management' },
          {
            key: '/project-management',
            icon: <FileTextOutlined />,
            label: 'Project Management',
            children: [
              { key: '/admin/dashboard', label: 'Admin Dashboard' },
              { key: '/head-hr/dashboard', label: 'Head HR Dashboard' },
              { key: '/hr/dashboard', label: 'HR Dashboard' },
              { key: '/hod/dashboard', label: 'HOD Dashboard' },
              { key: '/employee/dashboard', label: 'Employee Dashboard' },
              { key: '/project/list', label: 'Projects' },
              { key: '/project/create', label: 'Create Project' },
              { key: '/approval/inbox', label: 'Approval Inbox' },
              { key: '/task/board', label: 'Task Board' },
              { key: '/workflow', label: 'Workflow Diagram' },
              { key: '/admin/access-control', label: 'Access Control Manager' },
            ],
          },
        ]
      : []),
    // {
    //   key: '/shift-manager',
    //   icon: <ClockCircleOutlined />,
    //   label: 'Shift Manager',
    // },
    // {
    //   key: '/overtime-calculator',
    //   icon: <CalculatorOutlined />,
    //   label: 'Overtime Calculator',
    // },
    {
      key: '/dar',
      icon: <FileDoneOutlined />,
      label: 'DAR (Daily Activity Report)',
      children: [
        { key: '/dar/dashboard', label: 'Dashboard' },
        { key: '/dar/list', label: 'DAR List' },
        { key: '/dar/pending-approvals', label: 'Pending Approvals' },
        { key: '/dar/client', label: 'Client' },
        { key: '/dar/project', label: 'Project' },
        { key: '/dar/my-utilization', label: 'My Utilization' },
        { key: '/dar/team-utilization', label: 'My Team Utilization' },
        { key: '/dar/gantt', label: 'Gantt Chart' },
        { key: '/dar/calendar', label: 'Calendar View' },
      ],
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      children: [
        { key: '/hr/leave-balance-all', label: 'Leave Report' },
        { key: '/reports/late-mark', label: 'Late Mark Report' },
        { key: '/hr/salary-reports', label: 'Salary Report' },
        { key: '/admin/users', label: 'Active User List' },
      ],
    },
    ...(isAdmin
      ? [
          {
            key: '/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            children: [
              { key: '/admin/companies', label: 'Company Management' },
              { key: '/settings/roles', label: 'Roles' },
              { key: '/settings/departments', label: 'Departments' },
            ],
          },
        ]
      : []),
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const permissionFilteredItems = filterMenuByPermission(baseMenuItems)

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      onClick={handleMenuClick}
      items={permissionFilteredItems}
      style={{
        flex: 1,
        borderRight: 0,
        overflow: 'auto',
        paddingLeft: 24,
        paddingRight: 24,
      }}
    />
  )
}

export default Sidebar
