import React, { useEffect } from 'react'
import { Tabs, Badge } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  AlertOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { fetchPendingRequests } from '../../features/myTeam/myTeamSlice'
import TeamMembers from './TeamMembers'
import TeamAttendance from './TeamAttendance'
import DailyAttendanceReport from './DailyAttendanceReport'
import AttendancePendingRequest from './AttendancePendingRequest'
import CompoffPendingRequest from './CompoffPendingRequest'
import TeamLeaveHistory from './TeamLeaveHistory'
import PendingRequests from './PendingRequests'
import BiometricRequests from './BiometricRequests'
import TeamLeaveHistoryList from './TeamLeaveHistoryList'
import LateMark from './LateMark'
import DashboardLayout from '../../layouts/DashboardLayout'

const MyTeam = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const myTeamState = useSelector((state) => state.myTeam) || {}
  const badgeCounts = myTeamState.badgeCounts || { attendancePending: 0, compoffPending: 0, leavePending: 0 }

  useEffect(() => {
    dispatch(fetchPendingRequests('attendance'))
    dispatch(fetchPendingRequests('compoff'))
    dispatch(fetchPendingRequests('leave'))
  }, [dispatch])

  useEffect(() => {
    if (location.pathname === '/my-team') {
      navigate('/my-team/members', { replace: true })
    }
  }, [location.pathname, navigate])

  const getActiveKey = () => {
    const path = location.pathname
    if (path === '/my-team' || path.includes('/members')) return 'members'
    if (path.includes('/attendance') && !path.includes('pending') && !path.includes('daily')) return 'attendance'
    if (path.includes('/daily-attendance')) return 'daily-attendance'
    if (path.includes('/attendance-pending')) return 'attendance-pending'
    if (path.includes('/compoff-pending')) return 'compoff-pending'
    if (path.includes('/leave-history') && !path.includes('team-leave-history')) return 'leave-history'
    if (path.includes('/pending-requests')) return 'pending-requests'
    if (path.includes('/biometric-requests')) return 'biometric-requests'
    if (path.includes('/team-leave-history')) return 'team-leave-history'
    if (path.includes('/late-mark')) return 'late-mark'
    return 'members'
  }

  const handleTabChange = (key) => {
    const routes = {
      members: '/my-team/members',
      attendance: '/my-team/attendance',
      'daily-attendance': '/my-team/daily-attendance',
      'attendance-pending': '/my-team/attendance-pending',
      'compoff-pending': '/my-team/compoff-pending',
      'leave-history': '/my-team/leave-history',
      'pending-requests': '/my-team/pending-requests',
      'biometric-requests': '/my-team/biometric-requests',
      'team-leave-history': '/my-team/team-leave-history',
      'late-mark': '/my-team/late-mark',
    }
    navigate(routes[key] || '/my-team/members')
  }

  const getTabContent = (key) => {
    switch (key) {
      case 'members':
        return <TeamMembers />
      case 'attendance':
        return <TeamAttendance />
      case 'daily-attendance':
        return <DailyAttendanceReport />
      case 'attendance-pending':
        return <AttendancePendingRequest />
      case 'compoff-pending':
        return <CompoffPendingRequest />
      case 'leave-history':
        return <TeamLeaveHistory />
      case 'pending-requests':
        return <PendingRequests />
      case 'biometric-requests':
        return <BiometricRequests />
      case 'team-leave-history':
        return <TeamLeaveHistoryList />
      case 'late-mark':
        return <LateMark />
      default:
        return <TeamMembers />
    }
  }

  const tabItems = [
    {
      key: 'members',
      label: (
        <span>
          <UsergroupAddOutlined />
          My Team Members
        </span>
      ),
      children: getTabContent('members'),
    },
    {
      key: 'attendance',
      label: (
        <span>
          <CalendarOutlined />
          My Team's Attendance
        </span>
      ),
      children: getTabContent('attendance'),
    },
    {
      key: 'daily-attendance',
      label: (
        <span>
          <FileTextOutlined />
          Daily Attendance Report
        </span>
      ),
      children: getTabContent('daily-attendance'),
    },
    {
      key: 'attendance-pending',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertOutlined />
          Attendance Pending Request
          {badgeCounts.attendancePending > 0 && (
            <Badge count={badgeCounts.attendancePending} size="small" />
          )}
        </span>
      ),
      children: getTabContent('attendance-pending'),
    },
    {
      key: 'compoff-pending',
      label: (
        <span>
          <CheckCircleOutlined />
          Compoff Pending Request
        </span>
      ),
      children: getTabContent('compoff-pending'),
    },
    {
      key: 'leave-history',
      label: (
        <span>
          <HistoryOutlined />
          My Team's Leave History
        </span>
      ),
      children: getTabContent('leave-history'),
    },
    {
      key: 'pending-requests',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertOutlined />
          My Team Pending Request
          {badgeCounts.leavePending > 0 && (
            <Badge count={badgeCounts.leavePending} size="small" />
          )}
        </span>
      ),
      children: getTabContent('pending-requests'),
    },
    {
      key: 'biometric-requests',
      label: (
        <span>
          <ClockCircleOutlined />
          Biometric Attendance Punches
        </span>
      ),
      children: getTabContent('biometric-requests'),
    },
    {
      key: 'team-leave-history',
      label: (
        <span>
          <HistoryOutlined />
          Team Leave History
        </span>
      ),
      children: getTabContent('team-leave-history'),
    },
    {
      key: 'late-mark',
      label: (
        <span>
          <ClockCircleOutlined />
          List Late Mark
        </span>
      ),
      children: getTabContent('late-mark'),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Team</h1>
          <p className="page-description">Manage your team members, attendance, and requests</p>
        </div>
        <Tabs
          activeKey={getActiveKey()}
          onChange={handleTabChange}
          items={tabItems}
          type="card"
          size="large"
        />
      </div>
    </DashboardLayout>
  )
}

export default MyTeam
