import React, { useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography } from 'antd'
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchProjects } from '../../../features/projectManagement/projectSlice'
import { fetchPendingApprovals } from '../../../features/projectManagement/approvalSlice'
import {
  fetchDashboardData,
  fetchAttendanceTrend,
  fetchWorkingReportStatus,
} from '../../../features/dashboard/dashboardSlice'
import DashboardLayout from '../../../layouts/DashboardLayout'
import StatsCard from '../../../components/dashboard/StatsCard'
import AttendanceChart from '../../../components/dashboard/AttendanceChart'
import WorkingReportChart from '../../../components/dashboard/WorkingReportChart'
import AttendanceCalendar from '../../../components/dashboard/AttendanceCalendar'

const { Title, Text } = Typography

const HODDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useSelector((state) => state.project)
  const { pendingApprovals, loading: approvalsLoading } = useSelector((state) => state.approval)
  const { user } = useSelector((state) => state.auth)
  const { data: dashboardData, loading: dashboardLoading } = useSelector((state) => state.dashboard)

  useEffect(() => {
    dispatch(fetchProjects())
    dispatch(fetchPendingApprovals())
    
    // Fetch HRMS dashboard data
    if (user?.id) {
      dispatch(
        fetchDashboardData({
          userId: user.id,
          role: user?.role || 'hod',
          department: user?.department,
        })
      )
    }
  }, [dispatch, user])

  const stats = {
    totalProjects: projects.length,
    pendingApprovals: pendingApprovals.length,
    approvedProjects: projects.filter((p) => p.status === 'approved').length,
  }

  const approvalColumns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `₹${budget?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Created By',
      dataIndex: 'createdByName',
      key: 'createdByName',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/project/${record.id}`)}>
          Review
        </Button>
      ),
    },
  ]

  const { attendance, workingReports, ownAttendance, ownWorkingReports, dailyAttendanceRecords } = dashboardData || {}

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <Title level={2} style={{ margin: 0 }}>HOD Dashboard</Title>
          <Text type="secondary">Welcome, {user?.name || 'User'}</Text>
        </div>

        {/* HRMS Widgets: Own Attendance, Own Working Report */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={12}>
            <StatsCard
              title="Own Attendance"
              value={ownAttendance?.present || 0}
              suffix={`/ ${ownAttendance?.totalDays || 0}`}
              icon={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              color="#1890ff"
              onClick="/attendance/my-attendance"
              loading={dashboardLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={12}>
            <StatsCard
              title="Own Working Report"
              value={ownWorkingReports?.total || 0}
              suffix="Total"
              icon={<FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />}
              color="#faad14"
              onClick="/dar/list"
              loading={dashboardLoading}
            />
          </Col>
        </Row>

        {/* Project Management Widgets */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Total Projects"
                value={stats.totalProjects}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Pending Approvals"
                value={stats.pendingApprovals}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Approved Projects"
                value={stats.approvedProjects}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts for HRMS Data with Calendar */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <AttendanceCalendar
              attendanceRecords={dailyAttendanceRecords || []}
              loading={dashboardLoading}
              title="My Attendance Calendar"
            />
          </Col>
          <Col xs={24} lg={6}>
            <AttendanceChart
              attendance={ownAttendance}
              loading={dashboardLoading}
              title="My Attendance Summary"
            />
          </Col>
          <Col xs={24} lg={6}>
            <WorkingReportChart
              workingReports={ownWorkingReports}
              loading={dashboardLoading}
              title="My Working Reports"
            />
          </Col>
        </Row>

        <Card
          title="Pending Approvals"
          extra={
            <Space>
              <Button onClick={() => navigate('/project/create')}>Create Project</Button>
              <Button onClick={() => navigate('/approval/inbox')}>View All</Button>
            </Space>
          }
        >
          <Table
            columns={approvalColumns}
            dataSource={pendingApprovals}
            loading={approvalsLoading}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'No pending approvals' }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default HODDashboard
