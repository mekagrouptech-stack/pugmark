import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  DatePicker,
  Space,
  Spin,
  Typography,
  message,
  Alert,
  Button,
} from 'antd'
import { ClockCircleOutlined, ProjectOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'
import darService from '../../features/dar/darService'
import DashboardLayout from '../../layouts/DashboardLayout'

const { RangePicker } = DatePicker
const { Text } = Typography

const HOURS_PER_DAY = 8

const TeamUtilization = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const filterUserId = location?.state?.filterUserId
  const [loading, setLoading] = useState(true)
  const [teamDarList, setTeamDarList] = useState([])
  const [dateRange, setDateRange] = useState(() => [
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ])

  const startDate = dateRange?.[0]?.format('YYYY-MM-DD') || dayjs().startOf('week').format('YYYY-MM-DD')
  const endDate = dateRange?.[1]?.format('YYYY-MM-DD') || dayjs().endOf('week').format('YYYY-MM-DD')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await darService.getTeamDarList({
          dateFrom: startDate,
          dateTo: endDate,
        })
        setTeamDarList(data || [])
      } catch (err) {
        console.error('Failed to load team DARs:', err)
        message.error(err?.response?.data?.message || 'Failed to load team utilization')
        setTeamDarList([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [startDate, endDate])

  const filteredTeamDarList = filterUserId
    ? teamDarList.filter((d) => Number(d.userId) === Number(filterUserId))
    : teamDarList

  const totalHours = filteredTeamDarList.reduce((sum, dar) => sum + (parseFloat(dar.totalHours) || 0), 0)
  const daysInRange = startDate && endDate
    ? Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1)
    : 7
  const workingDays = Math.ceil(daysInRange * (5 / 7))
  const periodCapacityPerPerson = workingDays * HOURS_PER_DAY
  const uniqueEmployees = [...new Set(filteredTeamDarList.map((d) => d.employeeName || d.userId || 'Unknown'))].filter(Boolean)
  const teamCapacity = uniqueEmployees.length * periodCapacityPerPerson
  const utilizationPct = teamCapacity > 0
    ? Math.min(100, Math.round((totalHours / teamCapacity) * 100))
    : 0

  const byEmployee = Object.entries(
    filteredTeamDarList.reduce((acc, dar) => {
      const key = dar.employeeName || dar.userId || 'Unknown'
      if (!acc[key]) acc[key] = { employeeName: key, totalHours: 0, darCount: 0 }
      acc[key].totalHours += parseFloat(dar.totalHours) || 0
      acc[key].darCount += 1
      return acc
    }, {})
  ).map(([, v]) => v)

  const byProject = Object.entries(
    filteredTeamDarList.reduce((acc, dar) => {
      const key = dar.project || 'Unassigned'
      if (!acc[key]) acc[key] = { projectName: key, totalHours: 0, darCount: 0 }
      acc[key].totalHours += parseFloat(dar.totalHours) || 0
      acc[key].darCount += 1
      return acc
    }, {})
  ).map(([, v]) => v)

  const employeeColumns = [
    {
      title: 'Team Member',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name) => (
        <Space>
          <UserOutlined />
          <Text strong>{name || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'DAR Count',
      dataIndex: 'darCount',
      key: 'darCount',
      align: 'center',
      sorter: (a, b) => a.darCount - b.darCount,
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      align: 'right',
      render: (hours) => `${Number(hours || 0).toFixed(1)} hrs`,
      sorter: (a, b) => (a.totalHours || 0) - (b.totalHours || 0),
    },
    {
      title: 'Utilization',
      key: 'utilization',
      align: 'center',
      render: (_, record) => {
        const pct = periodCapacityPerPerson > 0
          ? Math.min(100, Math.round(((record.totalHours || 0) / periodCapacityPerPerson) * 100))
          : 0
        return (
          <Progress
            percent={pct}
            size="small"
            style={{ width: 100 }}
            strokeColor={pct >= 80 ? '#52c41a' : pct >= 50 ? '#faad14' : '#1890ff'}
          />
        )
      },
    },
  ]

  const projectColumns = [
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (name) => (
        <Space>
          <ProjectOutlined />
          <Text>{name || 'Unassigned'}</Text>
        </Space>
      ),
    },
    {
      title: 'DAR Count',
      dataIndex: 'darCount',
      key: 'darCount',
      align: 'center',
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      align: 'right',
      render: (hours) => `${Number(hours || 0).toFixed(1)} hrs`,
    },
    {
      title: 'Share',
      key: 'share',
      align: 'center',
      render: (_, record) => {
        const pct = totalHours > 0 ? Math.round(((record.totalHours || 0) / totalHours) * 100) : 0
        return <Progress percent={pct} size="small" style={{ width: 80 }} />
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">
            {filterUserId ? 'Single User Utilization' : 'My Team Utilization'}
          </h1>
          <p className="page-description">
            {filterUserId ? 'Viewing a single user\'s DARs (from Single User Dashboard)' : 'View your team\'s utilization and capacity.'}
          </p>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {filterUserId && (
            <Alert
              message="Filtered view"
              description="Showing DARs for the selected user only. Clear to see full team."
              type="info"
              showIcon
              action={
                <Button
                  size="small"
                  onClick={() => navigate('/dar/team-utilization', { replace: true })}
                >
                  Clear filter
                </Button>
              }
            />
          )}
          <Card>
            <Space wrap>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                placeholder={['Start Date', 'End Date']}
              />
            </Space>
          </Card>

          {loading ? (
            <Card>
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin size="large" />
              </div>
            </Card>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="Team Total Hours"
                      value={totalHours.toFixed(1)}
                      suffix="hrs"
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="Team Utilization"
                      value={utilizationPct}
                      suffix="%"
                      prefix={<TeamOutlined />}
                    />
                    <Progress
                      percent={utilizationPct}
                      showInfo={false}
                      strokeColor={utilizationPct >= 80 ? '#52c41a' : utilizationPct >= 50 ? '#faad14' : '#1890ff'}
                      style={{ marginTop: 8 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      vs {teamCapacity} hrs capacity
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic title="Team Members" value={uniqueEmployees.length} suffix="people" />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="Team Capacity"
                      value={teamCapacity}
                      suffix="hrs"
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {uniqueEmployees.length} × {periodCapacityPerPerson} hrs each
                    </Text>
                  </Card>
                </Col>
              </Row>

              <Card title="Hours by Team Member">
                <Table
                  columns={employeeColumns}
                  dataSource={byEmployee}
                  rowKey="employeeName"
                  pagination={false}
                  size="small"
                  locale={{
                    emptyText: 'No team DARs for this period.',
                  }}
                />
              </Card>

              <Card title="Hours by Project">
                <Table
                  columns={projectColumns}
                  dataSource={byProject}
                  rowKey="projectName"
                  pagination={false}
                  size="small"
                  locale={{
                    emptyText: 'No project data for this period.',
                  }}
                />
              </Card>

              <Card title="Recent Team DARs">
                <Table
                  columns={[
                    { title: 'Date', dataIndex: 'date', key: 'date', width: 110, render: (text) => formatDate(text) },
                    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
                    { title: 'Project', dataIndex: 'project', key: 'project' },
                    {
                      title: 'Hours',
                      dataIndex: 'totalHours',
                      key: 'totalHours',
                      width: 80,
                      render: (h) => `${h ?? 0} hrs`,
                    },
                    { title: 'Status', dataIndex: 'status', key: 'status',
                      render: (s) => (
                        <span
                          style={{
                            color:
                              s === 'Approved' ? '#52c41a' : s === 'Submitted' ? '#1890ff' : s === 'Rejected' ? '#ff4d4f' : '#8c8c8c',
                          }}
                        >
                          {s}
                        </span>
                      ),
                    },
                  ]}
                  dataSource={[...filteredTeamDarList].sort((a, b) => new Date(b.date) - new Date(a.date))}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  locale={{
                    emptyText: 'No team DARs for this period.',
                  }}
                />
              </Card>
            </>
          )}
        </Space>
      </div>
    </DashboardLayout>
  )
}

export default TeamUtilization
