import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  HourglassOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import darService from '../../features/dar/darService'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useSelector } from 'react-redux'

const { RangePicker } = DatePicker

const SingleUserDarDashboard = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
    project: undefined,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [usersData, projectsData] = await Promise.all([
          darService.getViewableUsers(),
          darService.getProjects(),
        ])
        setUsers(usersData || [])
        setProjects(projectsData || [])
        if (usersData?.length > 0 && !selectedUserId) {
          setSelectedUserId(usersData[0].id)
        }
      } catch (err) {
        console.error('Failed to load users:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    const fetch = async () => {
      try {
        setStatsLoading(true)
        const params = {}
        if (filters.dateRange) {
          params.dateFrom = filters.dateRange[0].format('YYYY-MM-DD')
          params.dateTo = filters.dateRange[1].format('YYYY-MM-DD')
        }
        if (filters.project) params.project = filters.project
        const data = await darService.getDarStatsForUser(selectedUserId, params)
        setStats(data)
      } catch (err) {
        console.error('Failed to load stats:', err)
        setStats(null)
      } finally {
        setStatsLoading(false)
      }
    }
    fetch()
  }, [selectedUserId, filters])

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Single User DAR Dashboard</h1>
          <p className="page-description">
            View DAR stats for a specific user (manager/HR view)
          </p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space wrap>
              <Space>
                <UserOutlined />
                <Typography.Text strong>Select User:</Typography.Text>
              </Space>
              <Select
                placeholder="Select User"
                style={{ width: 280 }}
                value={selectedUserId}
                onChange={setSelectedUserId}
                loading={loading}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={users.map((u) => ({
                  value: u.id,
                  label: `${u.name || 'Unknown'}${u.employeeCode ? ` (${u.employeeCode})` : ''}`,
                }))}
              />
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                style={{ width: 250 }}
              />
              <Select
                placeholder="Select Project"
                style={{ width: 200 }}
                allowClear
                value={filters.project}
                onChange={(value) => setFilters({ ...filters, project: value })}
              >
                {projects.map((project) => (
                  <Select.Option key={project.id} value={project.name}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>

            {selectedUser && (
              <Typography.Text type="secondary">
                Viewing: {selectedUser.name}
                {selectedUser.employeeCode && ` (${selectedUser.employeeCode})`}
                {selectedUser.department && ` · ${selectedUser.department}`}
              </Typography.Text>
            )}

            {statsLoading ? (
              <Card>
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <Spin size="large" />
                </div>
              </Card>
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Today's Hours"
                        value={stats?.todayHours || 0}
                        suffix="hrs"
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Week Hours"
                        value={stats?.weekHours || 0}
                        suffix="hrs"
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Month Hours"
                        value={stats?.monthHours || 0}
                        suffix="hrs"
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Total DARs"
                        value={
                          (stats?.submittedCount || 0) +
                          (stats?.approvedCount || 0) +
                          (stats?.draftCount || 0) +
                          (stats?.rejectedCount || 0)
                        }
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Submitted"
                        value={stats?.submittedCount || 0}
                        prefix={<HourglassOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Approved"
                        value={stats?.approvedCount || 0}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Draft"
                        value={stats?.draftCount || 0}
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#8c8c8c' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Rejected"
                        value={stats?.rejectedCount || 0}
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Quick Actions">
                  <Space>
                    {selectedUserId === user?.id ? (
                      <>
                        <a onClick={() => navigate('/dar/create')}>Create New DAR</a>
                        <a onClick={() => navigate('/dar/list')}>View All DARs</a>
                      </>
                    ) : (
                      <>
                        <a
                          onClick={() =>
                            navigate('/dar/team-utilization', {
                              state: { filterUserId: selectedUserId },
                            })
                          }
                        >
                          View User&apos;s DARs
                        </a>
                        <a onClick={() => navigate('/dar/team-utilization')}>
                          View Team Utilization
                        </a>
                      </>
                    )}
                  </Space>
                </Card>
              </>
            )}
          </Space>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default SingleUserDarDashboard
