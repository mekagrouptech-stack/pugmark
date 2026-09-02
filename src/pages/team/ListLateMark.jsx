import React, { useEffect, useMemo, useState } from 'react'
import { Card, Table, Tag, Space, DatePicker, Input, Button, message, Row, Col, Statistic } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'
import myTeamService from '../../features/myTeam/myTeamService'

const { RangePicker } = DatePicker

const ListLateMark = () => {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [search, setSearch] = useState('')
  const [range, setRange] = useState([dayjs().subtract(30, 'day'), dayjs()])

  const load = async () => {
    setLoading(true)
    try {
      const [start, end] = range || []
      const data = await myTeamService.getLateMarkRecords({
        startDate: start ? start.format('YYYY-MM-DD') : undefined,
        endDate: end ? end.format('YYYY-MM-DD') : undefined,
      })
      setRecords(data)
    } catch (err) {
      message.error(err.message || 'Failed to load late mark records')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const rows = records.map((r, i) => ({ ...r, key: r.id ?? i }))
    if (!s) return rows
    return rows.filter(
      (r) =>
        (r.employeeName || '').toLowerCase().includes(s) ||
        (r.employeeCode || '').toLowerCase().includes(s)
    )
  }, [records, search])

  const uniqueEmployees = useMemo(() => {
    const set = new Set()
    filtered.forEach((r) => set.add(r.employeeCode || r.employeeName))
    return set.size
  }, [filtered])

  const columns = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName', sorter: (a, b) => (a.employeeName || '').localeCompare(b.employeeName || '') },
    { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 120 },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (text) => formatDate(text),
      sorter: (a, b) => (a.date || '').localeCompare(b.date || ''),
      defaultSortOrder: 'descend',
    },
    { title: 'Check In', dataIndex: 'checkIn', key: 'checkIn', width: 110 },
    { title: 'Expected', dataIndex: 'expectedCheckIn', key: 'expectedCheckIn', width: 110 },
    {
      title: 'Late By',
      dataIndex: 'lateBy',
      key: 'lateBy',
      render: (text) => <Tag color="volcano">{text}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => <Tag color="orange">{status || 'Marked'}</Tag>,
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">List Late Mark</h1>
          <p className="page-description">Employees who checked in after 10:15 AM</p>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8}>
            <Card>
              <Statistic title="Late Entries" value={filtered.length} valueStyle={{ color: '#fa541c' }} />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card>
              <Statistic title="Unique Employees" value={uniqueEmployees} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Date Range"
                value={`${range?.[0]?.format('DD MMM') || ''} – ${range?.[1]?.format('DD MMM YYYY') || ''}`}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
        </Row>

        <Card className="card-container">
          <Space wrap style={{ marginBottom: 16 }}>
            <RangePicker
              value={range}
              onChange={(v) => setRange(v || [dayjs().subtract(30, 'day'), dayjs()])}
              allowClear={false}
              format="DD MMM YYYY"
            />
            <Input
              placeholder="Search employee / code"
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={load}>
              Refresh
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: 'No late mark records for this range' }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ListLateMark
