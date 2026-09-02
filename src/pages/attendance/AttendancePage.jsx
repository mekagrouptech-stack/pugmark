import React, { useEffect } from 'react'
import { Tabs } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  CalendarOutlined,
  FileTextOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import MyAttendance from './MyAttendance'
import RequestAttendanceRegulation from './RequestAttendanceRegulation'
import AttendanceReportWithMap from './AttendanceReportWithMap'

const AttendancePage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/attendance') {
      navigate('/attendance/my-attendance', { replace: true })
    }
  }, [location.pathname, navigate])

  const getActiveKey = () => {
    const path = location.pathname
    if (path.includes('/my-attendance')) return 'my-attendance'
    if (path.includes('/request-regulation')) return 'request-regulation'
    if (path.includes('/report-map')) return 'report-map'
    return 'my-attendance'
  }

  const handleTabChange = (key) => {
    const routes = {
      'my-attendance': '/attendance/my-attendance',
      'request-regulation': '/attendance/request-regulation',
      'report-map': '/attendance/report-map',
    }
    navigate(routes[key] || '/attendance/my-attendance')
  }

  const tabItems = [
    {
      key: 'my-attendance',
      label: (
        <span>
          <CalendarOutlined />
          My Attendance
        </span>
      ),
      children: <MyAttendance embedded />,
    },
    {
      key: 'request-regulation',
      label: (
        <span>
          <FileTextOutlined />
          Request Attendance Regulation
        </span>
      ),
      children: <RequestAttendanceRegulation embedded />,
    },
    {
      key: 'report-map',
      label: (
        <span>
          <SwapOutlined />
          Attendance Report with Map
        </span>
      ),
      children: <AttendanceReportWithMap embedded />,
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Attendance</h1>
          <p className="page-description">View biometric attendance and request regulations</p>
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

export default AttendancePage
