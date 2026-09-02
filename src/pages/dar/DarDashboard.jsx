import React, { useEffect, useState } from 'react'
import { Card, Row, Col, DatePicker, Select, Space, Table, Progress, Spin } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  HourglassOutlined,
  UserOutlined,
  ProjectOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import StatsCard from '../../components/dashboard/StatsCard'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  fetchDarStats,
  fetchDarStatsForUser,
  fetchProjects,
  fetchViewableUsers,
  fetchProjectSummary,
  fetchProjectSummaryForUser,
} from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const CHART_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#f59e0b', '#db2777', '#0d9488', '#f97316', '#64748b']

const { RangePicker } = DatePicker

const DarDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { stats, projects, viewableUsers, projectSummary, loading } = useSelector((state) => state.dar)
  const [filters, setFilters] = useState({
    dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
    project: undefined,
    userId: undefined,
  })

  useEffect(() => {
    dispatch(fetchProjects())
    dispatch(fetchViewableUsers())
  }, [dispatch])

  const dateFrom = filters.dateRange?.[0]?.format('YYYY-MM-DD') || dayjs().startOf('month').format('YYYY-MM-DD')
  const dateTo = filters.dateRange?.[1]?.format('YYYY-MM-DD') || dayjs().endOf('month').format('YYYY-MM-DD')

  useEffect(() => {
    const params = { dateFrom, dateTo }
    if (filters.project) params.project = filters.project
    if (filters.userId) {
      dispatch(fetchDarStatsForUser({ userId: filters.userId, ...params }))
    } else {
      dispatch(fetchDarStats(params))
    }
  }, [dispatch, filters])

  useEffect(() => {
    const params = { startDate: dateFrom, endDate: dateTo }
    if (filters.project) params.project = filters.project
    if (filters.userId) {
      dispatch(fetchProjectSummaryForUser({ userId: filters.userId, ...params }))
    } else {
      dispatch(fetchProjectSummary(params))
    }
  }, [dispatch, filters.userId, filters.project, dateFrom, dateTo])

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">DAR Dashboard</h1>
          <p className="page-description">
            {filters.userId && filters.userId !== user?.id
              ? 'View DAR stats for the selected user'
              : 'Overview of your daily activity reports'}
          </p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space wrap>
              <Select
                placeholder="Select User"
                style={{ width: 280 }}
                allowClear
                value={filters.userId}
                onChange={(value) => setFilters({ ...filters, userId: value })}
                suffixIcon={<UserOutlined />}
                showSearch
                optionFilterProp="searchLabel"
                filterOption={(input, option) =>
                  (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent={viewableUsers.length === 0 ? 'No users found' : undefined}
                options={viewableUsers.map((u) => {
                  const parts = [u.name || 'Unknown']
                  if (u.employeeCode) parts.push(`(${u.employeeCode})`)
                  if (u.department) parts.push(`· ${u.department}`)
                  if (u.designation) parts.push(`· ${u.designation}`)
                  return {
                    value: u.id,
                    label: parts.join(' '),
                    searchLabel: [u.name, u.employeeCode, u.department, u.designation]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase(),
                  }
                })}
              />
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                style={{ width: 250 }}
              />
              <Select
                placeholder="Select Project"
                style={{ width: 260 }}
                allowClear
                value={filters.project}
                onChange={(value) => setFilters({ ...filters, project: value })}
                showSearch
                optionFilterProp="searchLabel"
                filterOption={(input, option) =>
                  (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent={projects.length === 0 ? 'No projects found' : undefined}
                options={projects.map((p) => {
                  const label = p.description
                    ? `${p.name} — ${p.description}`
                    : p.name
                  return {
                    value: p.name,
                    label,
                    searchLabel: [p.name, p.description].filter(Boolean).join(' ').toLowerCase(),
                  }
                })}
              />
            </Space>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard title="Today's Hours" value={stats?.todayHours || 0} suffix="hrs" icon={<ClockCircleOutlined />} color="#2563eb" loading={loading} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard title="Week Hours" value={stats?.weekHours || 0} suffix="hrs" icon={<ClockCircleOutlined />} color="#16a34a" loading={loading} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard title="Month Hours" value={stats?.monthHours || 0} suffix="hrs" icon={<ClockCircleOutlined />} color="#7c3aed" loading={loading} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard
                  title="Total DARs"
                  value={
                    (stats?.submittedCount || 0) +
                    (stats?.approvedCount || 0) +
                    (stats?.draftCount || 0) +
                    (stats?.rejectedCount || 0)
                  }
                  icon={<FileTextOutlined />}
                  color="#f59e0b"
                  loading={loading}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard title="Submitted" value={stats?.submittedCount || 0} icon={<HourglassOutlined />} color="#2563eb" loading={loading} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard title="Approved" value={stats?.approvedCount || 0} icon={<CheckCircleOutlined />} color="#16a34a" loading={loading} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard title="Draft" value={stats?.draftCount || 0} icon={<FileTextOutlined />} color="#64748b" loading={loading} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatsCard title="Rejected" value={stats?.rejectedCount || 0} icon={<CloseCircleOutlined />} color="#ef4444" loading={loading} />
              </Col>
            </Row>

            <Card
              title={
                <Space>
                  <ProjectOutlined />
                  Project Breakdown &amp; Completion
                </Space>
              }
            >
              {loading && projectSummary.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <Spin />
                </div>
              ) : projectSummary.length > 0 ? (
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <strong>Hours by Project (% of total)</strong>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={projectSummary
                            .filter((p) => Number(p.totalHours || 0) > 0)
                            .map((p, i) => ({
                              name: p.projectName || 'Unassigned',
                              value: Number(p.totalHours || 0),
                              fill: CHART_COLORS[i % CHART_COLORS.length],
                            }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {projectSummary
                            .filter((p) => Number(p.totalHours || 0) > 0)
                            .map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${Number(value).toFixed(1)} hrs`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <strong>Hours by Project</strong>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={projectSummary
                          .filter((p) => Number(p.totalHours || 0) > 0)
                          .map((p) => ({
                            project: p.projectName || 'Unassigned',
                            hours: Number(p.totalHours || 0),
                          }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <XAxis type="number" allowDecimals />
                        <YAxis type="category" dataKey="project" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) => [`${Number(value).toFixed(1)} hrs`, 'Hours']}
                          labelFormatter={(label) => label}
                        />
                        <Bar dataKey="hours" name="Hours" radius={[0, 4, 4, 0]}>
                          {projectSummary
                            .filter((p) => Number(p.totalHours || 0) > 0)
                            .map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col span={24}>
                    <Table
                      size="small"
                      dataSource={projectSummary}
                      rowKey="projectName"
                      pagination={false}
                      columns={[
                        {
                          title: 'Project',
                          dataIndex: 'projectName',
                          key: 'projectName',
                          render: (name) => (
                            <Space>
                              <ProjectOutlined />
                              {name || 'Unassigned'}
                            </Space>
                          ),
                        },
                        {
                          title: 'Hours',
                          dataIndex: 'totalHours',
                          key: 'totalHours',
                          align: 'right',
                          render: (h) => `${Number(h || 0).toFixed(1)} hrs`,
                        },
                        {
                          title: 'Hours %',
                          key: 'hoursPercent',
                          align: 'center',
                          render: (_, record) => {
                            const total = projectSummary.reduce((s, p) => s + (Number(p.totalHours) || 0), 0)
                            const pct = total > 0 ? Math.round(((Number(record.totalHours) || 0) / total) * 100) : 0
                            return <Progress percent={pct} size="small" style={{ width: 100 }} />
                          },
                        },
                        {
                          title: 'DARs',
                          key: 'dars',
                          align: 'center',
                          render: (_, record) => `${record.approvedCount ?? 0}/${record.darCount ?? 0} approved`,
                        },
                        {
                          title: 'Completion %',
                          dataIndex: 'completionPercent',
                          key: 'completionPercent',
                          align: 'center',
                          render: (pct) => (
                            <Progress
                              percent={pct ?? 0}
                              size="small"
                              strokeColor={pct >= 80 ? '#52c41a' : pct >= 50 ? '#faad14' : '#1890ff'}
                              style={{ width: 80 }}
                            />
                          ),
                        },
                      ]}
                    />
                  </Col>
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
                  No project data for the selected period.
                </div>
              )}
            </Card>

            <Card title="Quick Actions">
              <Space>
                {(!filters.userId || filters.userId === user?.id) && (
                  <>
                    <a onClick={() => navigate('/dar/create')}>Create New DAR</a>
                    <a onClick={() => navigate('/dar/list')}>View All DARs</a>
                    <a onClick={() => navigate('/dar/list')}>Edit DAR</a>
                  </>
                )}
                {filters.userId && filters.userId !== user?.id && (
                  <>
                    <a
                      onClick={() =>
                        navigate('/dar/team-utilization', {
                          state: { filterUserId: filters.userId },
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
          </Space>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DarDashboard
