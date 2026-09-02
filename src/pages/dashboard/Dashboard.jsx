import React, { useEffect, useState } from 'react'
import { Row, Col, Empty, Spin, Tag } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'
import CombinedAttendanceLeaveCalendar from '../../components/dashboard/CombinedAttendanceLeaveCalendar'
import NoticesCard from '../../components/dashboard/NoticesCard'
import BirthdayList from '../../components/dashboard/BirthdayList'
import WorkAnniversaryList from '../../components/dashboard/WorkAnniversaryList'
import StatsCard from '../../components/dashboard/StatsCard'
import { fetchDashboardData } from '../../features/dashboard/dashboardSlice'
import api from '../../services/api'

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { data, loading } = useSelector((state) => state.dashboard)

  const userRole = user?.role || 'employee'
  const userId = user?.id
  const userDepartment = user?.department

  const [celebrations, setCelebrations] = useState({ birthdays: [], anniversaries: [] })
  const [celebrationsLoading, setCelebrationsLoading] = useState(true)

  useEffect(() => {
    if (user && userId) {
      dispatch(
        fetchDashboardData({
          userId,
          role: userRole,
          department: userDepartment,
        })
      )

      // Fetch celebrations
      api
        .get('/dashboard/celebrations')
        .then((res) => {
          setCelebrations(res.data?.data || { birthdays: [], anniversaries: [] })
        })
        .catch(() => {
          setCelebrations({ birthdays: [], anniversaries: [] })
        })
        .finally(() => setCelebrationsLoading(false))
    }
  }, [dispatch, user, userId, userRole, userDepartment])

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <Empty description="User not found. Please log in again." />
        </div>
      </DashboardLayout>
    )
  }

  const attendance = data?.attendance || data?.ownAttendance || {}
  const dailyAttendanceRecords = data?.dailyAttendanceRecords || []

  const present = attendance?.present ?? 0
  const absent = attendance?.absent ?? 0
  const leave = attendance?.leave ?? 0
  const totalDays = attendance?.totalDays ?? 0
  const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const kpis = [
    { title: 'Present Days', value: present, icon: <CheckCircleOutlined />, color: '#16a34a', suffix: 'days' },
    { title: 'Absent Days', value: absent, icon: <CloseCircleOutlined />, color: '#ef4444', suffix: 'days' },
    { title: 'Leaves Taken', value: leave, icon: <CalendarOutlined />, color: '#f59e0b', suffix: 'days' },
    { title: 'Attendance Rate', value: attendanceRate, icon: <RiseOutlined />, color: '#2563eb', suffix: '%' },
  ]

  return (
    <DashboardLayout>
      <div
        style={{
          padding: '20px 20px 32px',
          background: 'linear-gradient(180deg, #f6f8fc 0%, #eef1f7 100%)',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* ---------- Hero / Welcome banner ---------- */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 20,
            padding: '28px 32px',
            marginBottom: 24,
            background: 'linear-gradient(120deg, #1e3a8a 0%, #2563eb 55%, #4f46e5 100%)',
            boxShadow: '0 12px 30px rgba(37, 99, 235, 0.28)',
          }}
        >
          {/* decorative glows */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -30,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -80,
              right: 120,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  {getGreeting()},
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.2,
                    letterSpacing: '-0.2px',
                  }}
                >
                  {user?.name || 'User'}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Tag
                    style={{
                      margin: 0,
                      border: '1px solid rgba(255,255,255,0.35)',
                      background: 'rgba(255,255,255,0.14)',
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: 20,
                      padding: '2px 12px',
                    }}
                  >
                    {(user?.role || 'Employee').toUpperCase()}
                  </Tag>
                  {user?.department && (
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{user.department}</span>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'rgba(255,255,255,0.92)',
                fontSize: 14,
                fontWeight: 500,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                padding: '8px 14px',
                borderRadius: 12,
              }}
            >
              <ClockCircleOutlined />
              {today}
            </div>
          </div>
        </div>

        {/* ---------- KPI stat row ---------- */}
        <Row gutter={[20, 20]} style={{ marginBottom: 4 }}>
          {kpis.map((kpi) => (
            <Col key={kpi.title} xs={12} lg={6}>
              <StatsCard
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                suffix={kpi.suffix}
                loading={loading}
              />
            </Col>
          ))}
        </Row>

        {/* ---------- Main layout: Calendar + Right panel ---------- */}
        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          <Col xs={24} lg={14}>
            <CombinedAttendanceLeaveCalendar
              attendanceRecords={dailyAttendanceRecords}
              loading={loading}
              title="Attendance & Leave Calendar"
            />
          </Col>

          <Col xs={24} lg={10}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <NoticesCard />
              <BirthdayList birthdays={celebrations.birthdays} loading={celebrationsLoading} />
              <WorkAnniversaryList anniversaries={celebrations.anniversaries} loading={celebrationsLoading} />
            </div>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
