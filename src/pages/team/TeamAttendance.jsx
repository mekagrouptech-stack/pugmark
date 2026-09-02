import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, DatePicker, Button, Space, Popconfirm, message } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import myTeamService from '../../features/myTeam/myTeamService'
import { istMoment } from '../../utils/timeUtils'
import { calcLiveTotal, formatDate } from '../../utils/attendanceTimeUtils'
import dayjs from 'dayjs'

const TeamAttendance = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [now, setNow] = useState(new Date())

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(() => loadAttendance(), 60000)
    return () => clearInterval(t)
  }, [])

  const loadAttendance = async () => {
    try {
      setLoading(true)
      const params = {}
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const records = await myTeamService.getAttendance(params)
      setData(
        records.map((item) => ({
          key: item.id,
          id: item.id,
          employee: item.employeeName,
          employeeCode: item.employeeCode,
          date: item.date,
          checkIn: item.checkIn || null,
          checkOut: item.checkOut || null,
          totalHours: item.totalHours,
          status: item.status || 'Absent',
        }))
      )
    } catch (error) {
      console.error('Error loading team attendance:', error)
      message.error(error.message || 'Failed to load team attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [])

  const handleFilter = () => {
    loadAttendance()
  }

  const handleClearFilter = () => {
    setDateRange([])
    setTimeout(() => loadAttendance(), 0)
  }

  const handleDelete = async (id) => {
    try {
      await myTeamService.deleteAttendance(id)
      message.success('Attendance record deleted successfully')
      setData((prev) => prev.filter((row) => row.id !== id))
    } catch (error) {
      message.error(error.message || 'Failed to delete attendance record')
    }
  }

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Employee Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => istMoment(a.date).valueOf() - istMoment(b.date).valueOf(),
      render: (text) => formatDate(text),
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (text) => text ? (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{text}</span>
      ) : <span style={{ color: '#d1d5db' }}>--:--</span>,
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (text) => text ? (
        <span style={{ color: '#dc2626', fontWeight: 600 }}>{text}</span>
      ) : <span style={{ color: '#d1d5db' }}>--:--</span>,
    },
    {
      title: 'Total Hours',
      key: 'totalHours',
      render: (_, record) => {
        const isToday = record.date === dayjs().format('YYYY-MM-DD')
        const hasCheckIn = !!record.checkIn
        const hasCheckOut = !!record.checkOut

        if (isToday && hasCheckIn && !hasCheckOut) {
          return (
            <span style={{ color: '#2563eb', fontWeight: 600 }}>
              <ClockCircleOutlined style={{ marginRight: 4, fontSize: 12 }} />
              {calcLiveTotal(record.checkIn, null, now)}
            </span>
          )
        }
        if (hasCheckIn && hasCheckOut) {
          return <span style={{ fontWeight: 600 }}>{calcLiveTotal(record.checkIn, record.checkOut, now)}</span>
        }
        return <span style={{ color: '#9ca3af' }}>0h 00m</span>
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Present' ? 'green' : status === 'Absent' ? 'red' : 'blue'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete Attendance"
          description="Are you sure you want to delete this attendance record?"
          okText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button danger type="link">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Team Attendance</h1>
          <p className="page-description">View attendance records of your team</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <DatePicker.RangePicker value={dateRange} onChange={(values) => setDateRange(values || [])} />
            <Button type="primary" onClick={handleFilter}>
              Filter
            </Button>
            <Button onClick={handleClearFilter}>Clear</Button>
          </Space>

          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TeamAttendance
