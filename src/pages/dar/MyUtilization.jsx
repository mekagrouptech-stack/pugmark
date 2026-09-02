import React, { useEffect, useState } from 'react'
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
} from 'antd'
import { ClockCircleOutlined, ProjectOutlined, CalendarOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'
import { fetchDarList, fetchProjectSummary } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { RangePicker } = DatePicker
const { Text } = Typography

const HOURS_PER_DAY = 8

const MyUtilization = () => {
  const dispatch = useDispatch()
  const { darList, projectSummary, loading } = useSelector((state) => state.dar)
  const [dateRange, setDateRange] = useState(() => [
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ])

  const startDate = dateRange?.[0]?.format('YYYY-MM-DD') || dayjs().startOf('week').format('YYYY-MM-DD')
  const endDate = dateRange?.[1]?.format('YYYY-MM-DD') || dayjs().endOf('week').format('YYYY-MM-DD')

  useEffect(() => {
    dispatch(
      fetchDarList({
        dateFrom: startDate,
        dateTo: endDate,
      })
    )
    dispatch(
      fetchProjectSummary({
        startDate,
        endDate,
      })
    )
  }, [dispatch, startDate, endDate])

  const totalHours = darList.reduce((sum, dar) => sum + (parseFloat(dar.totalHours) || 0), 0)
  const daysInRange = startDate && endDate
    ? Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1)
    : 7
  const workingDays = Math.ceil(daysInRange * (5 / 7))
  const periodCapacity = workingDays * HOURS_PER_DAY
  const utilizationPct = periodCapacity > 0
    ? Math.min(100, Math.round((totalHours / periodCapacity) * 100))
    : 0

  const projectColumns = [
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (name) => (
        <Space>
          <ProjectOutlined />
          <Text strong>{name || 'Unassigned'}</Text>
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
      title: 'Avg Hours/Day',
      dataIndex: 'averageHoursPerDay',
      key: 'averageHoursPerDay',
      align: 'right',
      render: (avg) => `${Number(avg || 0).toFixed(1)} hrs`,
    },
    {
      title: 'Share',
      key: 'share',
      align: 'center',
      render: (_, record) => {
        const total = projectSummary.reduce((s, p) => s + (Number(p.totalHours) || 0), 0)
        const pct = total > 0 ? Math.round(((Number(record.totalHours) || 0) / total) * 100) : 0
        return <Progress percent={pct} size="small" style={{ width: 80 }} />
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Utilization</h1>
          <p className="page-description">View your utilization and capacity.</p>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
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
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="Total Hours This Period"
                      value={totalHours.toFixed(1)}
                      suffix="hrs"
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="Utilization"
                      value={utilizationPct}
                      suffix="%"
                      prefix={<CalendarOutlined />}
                    />
                    <Progress
                      percent={utilizationPct}
                      showInfo={false}
                      strokeColor={utilizationPct >= 80 ? '#52c41a' : utilizationPct >= 50 ? '#faad14' : '#1890ff'}
                      style={{ marginTop: 8 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      vs {periodCapacity} hrs capacity
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="Period Capacity"
                      value={periodCapacity}
                      suffix="hrs"
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ~{workingDays} working days × {HOURS_PER_DAY} hrs/day
                    </Text>
                  </Card>
                </Col>
              </Row>

              <Card title="Hours by Project">
                <Table
                  columns={projectColumns}
                  dataSource={projectSummary || []}
                  rowKey="projectName"
                  pagination={false}
                  size="small"
                  locale={{
                    emptyText: 'No DARs recorded for this period.',
                  }}
                />
              </Card>

              <Card title="Recent DARs">
                <Table
                  columns={[
                    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (text) => formatDate(text) },
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
                  dataSource={[...(darList || [])].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                  )}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  locale={{
                    emptyText: 'No DARs for this period.',
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

export default MyUtilization
