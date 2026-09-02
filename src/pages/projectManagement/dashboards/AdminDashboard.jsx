import React, { useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography } from 'antd'
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  WarningOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchProjects } from '../../../features/projectManagement/projectSlice'
import { fetchTasks } from '../../../features/projectManagement/taskSlice'
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

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useSelector((state) => state.project)
  const { tasks, loading: tasksLoading } = useSelector((state) => state.task)
  const { user } = useSelector((state) => state.auth)
  const { data: dashboardData, loading: dashboardLoading } = useSelector((state) => state.dashboard)

  useEffect(() => {
    dispatch(fetchProjects())
    dispatch(fetchTasks())
    
    // Fetch HRMS dashboard data
    if (user?.id) {
      dispatch(
        fetchDashboardData({
          userId: user.id,
          role: user?.role || 'admin',
          department: user?.department,
        })
      )
    }
  }, [dispatch, user])

  const stats = {
    totalProjects: projects.length,
    approvedProjects: projects.filter((p) => p.status === 'approved').length,
    pendingApprovals: projects.filter((p) => p.status !== 'approved' && p.status !== 'rejected').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
  }

  const recentProjects = projects.slice(0, 5)

  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          approved: 'green',
          submitted: 'blue',
          hod_review: 'orange',
          hr_review: 'purple',
          head_hr_review: 'cyan',
          rejected: 'red',
        }
        return <Tag color={colorMap[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Tag>
      },
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `₹${budget?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/project/${record.id}`)}>
          View
        </Button>
      ),
    },
  ]

  const { attendance, workingReports, ownAttendance, ownWorkingReports, teamAttendance, dailyAttendanceRecords } = dashboardData || {}

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <Title level={2} style={{ margin: 0 }}>Admin Dashboard</Title>
          <Text type="secondary">Welcome, {user?.name || 'User'}</Text>
        </div>

        {/* HRMS Widgets: Own Attendance, Own Working Report */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={12}>
            <StatsCard
              title="Own Attendance"
              value={ownAttendance?.present || attendance?.present || 0}
              suffix={`/ ${ownAttendance?.totalDays || attendance?.totalDays || 0}`}
              icon={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              color="#1890ff"
              onClick="/attendance/my-attendance"
              loading={dashboardLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={12}>
            <StatsCard
              title="Own Working Report"
              value={ownWorkingReports?.total || workingReports?.total || 0}
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
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Projects"
                value={stats.totalProjects}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Approved Projects"
                value={stats.approvedProjects}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Approvals"
                value={stats.pendingApprovals}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Tasks"
                value={stats.totalTasks}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Team Attendance Widgets */}
        {teamAttendance && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={8}>
              <StatsCard
                title="Team Total Present"
                value={teamAttendance.present || 0}
                suffix={`/ ${teamAttendance.totalEmployees || 0} employees`}
                icon={<CalendarOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                color="#52c41a"
                loading={dashboardLoading}
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <StatsCard
                title="Team Total Absent"
                value={teamAttendance.absent || 0}
                suffix={`/ ${teamAttendance.totalEmployees || 0} employees`}
                icon={<CalendarOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />}
                color="#ff4d4f"
                loading={dashboardLoading}
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <StatsCard
                title="Team On Leave"
                value={teamAttendance.leave || 0}
                suffix={`/ ${teamAttendance.totalEmployees || 0} employees`}
                icon={<CalendarOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                color="#faad14"
                loading={dashboardLoading}
              />
            </Col>
          </Row>
        )}

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
              attendance={ownAttendance || attendance}
              loading={dashboardLoading}
              title="My Attendance Summary"
            />
          </Col>
          <Col xs={24} lg={6}>
            <WorkingReportChart
              workingReports={ownWorkingReports || workingReports}
              loading={dashboardLoading}
              title="My Working Reports"
            />
          </Col>
        </Row>

        {/* Team Attendance Chart */}
        {teamAttendance && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <AttendanceChart
                attendance={teamAttendance}
                loading={dashboardLoading}
                title="Team Attendance Summary"
              />
            </Col>
          </Row>
        )}

        <Card
          title="Recent Projects"
          extra={
            <Space>
              <Button onClick={() => navigate('/project/create')}>Create Project</Button>
              <Button onClick={() => navigate('/project/list')}>View All</Button>
            </Space>
          }
        >
          <Table
            columns={projectColumns}
            dataSource={recentProjects}
            loading={projectsLoading}
            rowKey="id"
            pagination={false}
          />
        </Card>

        <Card title="System Actions" style={{ marginTop: 16 }}>
          <Space wrap>
            <Button type="primary" onClick={() => navigate('/workflow')}>
              Manage Workflow
            </Button>
            <Button onClick={() => navigate('/project/list')}>All Projects</Button>
            <Button onClick={() => navigate('/task/board')}>Task Board</Button>
            <Button onClick={() => navigate('/approval/inbox')}>Approval Inbox</Button>
          </Space>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
