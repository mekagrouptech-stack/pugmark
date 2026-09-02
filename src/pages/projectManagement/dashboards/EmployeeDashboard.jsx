import React, { useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography } from 'antd'
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
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

const EmployeeDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useSelector((state) => state.project)
  const { tasks, loading: tasksLoading } = useSelector((state) => state.task)
  const { user } = useSelector((state) => state.auth)
  const { data: dashboardData, loading: dashboardLoading } = useSelector((state) => state.dashboard)

  useEffect(() => {
    dispatch(fetchProjects({ createdBy: user?.id }))
    dispatch(fetchTasks({ assigneeId: user?.id }))
    
    // Fetch HRMS dashboard data
    if (user?.id) {
      dispatch(
        fetchDashboardData({
          userId: user.id,
          role: user?.role || 'employee',
          department: user?.department,
        })
      )
    }
  }, [dispatch, user])

  const myProjects = projects.filter((p) => p.createdBy === user?.id)
  const myTasks = tasks.filter((t) => t.assigneeId === user?.id)

  const stats = {
    myProjects: myProjects.length,
    myTasks: myTasks.length,
    completedTasks: myTasks.filter((t) => t.status === 'completed').length,
    pendingTasks: myTasks.filter((t) => t.status !== 'completed').length,
  }

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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/project/${record.id}`)}>
          View
        </Button>
      ),
    },
  ]

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          todo: 'default',
          in_progress: 'processing',
          blocked: 'error',
          review: 'warning',
          approved: 'success',
          completed: 'success',
        }
        return <Tag color={colorMap[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/task/${record.id}`)}>
          View
        </Button>
      ),
    },
  ]

  const { attendance, workingReports, dailyAttendanceRecords } = dashboardData || {}

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <Title level={2} style={{ margin: 0 }}>Employee Dashboard</Title>
          <Text type="secondary">Welcome, {user?.name || 'User'}</Text>
        </div>

        {/* HRMS Widgets: Own Attendance, Own Working Report, Request Attendance Regulation */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <StatsCard
              title="Own Attendance"
              value={attendance?.present || 0}
              suffix={`/ ${attendance?.totalDays || 0}`}
              icon={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              color="#1890ff"
              onClick="/attendance/my-attendance"
              loading={dashboardLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatsCard
              title="Request Attendance Regulation"
              value="Request"
              icon={<ClockCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />}
              color="#fa8c16"
              onClick="/attendance/request-regulation"
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatsCard
              title="Own Working Report"
              value={workingReports?.total || 0}
              suffix="Total"
              icon={<FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />}
              color="#faad14"
              onClick="/dar/list"
              loading={dashboardLoading}
            />
          </Col>
        </Row>

        {/* Project Management Widgets: My Projects, My Tasks, Completed Tasks, Pending Tasks */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="My Projects"
                value={stats.myProjects}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="My Tasks"
                value={stats.myTasks}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed Tasks"
                value={stats.completedTasks}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Tasks"
                value={stats.pendingTasks}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
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
              attendance={attendance}
              loading={dashboardLoading}
              title="My Attendance Summary"
            />
          </Col>
          <Col xs={24} lg={6}>
            <WorkingReportChart
              workingReports={workingReports}
              loading={dashboardLoading}
              title="My Working Reports"
            />
          </Col>
        </Row>

        {/* Project Management Tables */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title="My Projects"
              extra={
                <Button onClick={() => navigate('/project/create')}>Create Project</Button>
              }
            >
              <Table
                columns={projectColumns}
                dataSource={myProjects}
                loading={projectsLoading}
                rowKey="id"
                pagination={false}
                locale={{ emptyText: 'No projects found' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="My Tasks"
              extra={
                <Button onClick={() => navigate('/task/board')}>View Board</Button>
              }
            >
              <Table
                columns={taskColumns}
                dataSource={myTasks.slice(0, 5)}
                loading={tasksLoading}
                rowKey="id"
                pagination={false}
                locale={{ emptyText: 'No tasks found' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default EmployeeDashboard
