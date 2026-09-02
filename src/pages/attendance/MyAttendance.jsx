import React, { useEffect, useState, useMemo } from 'react'
import { Card, Table, Tag, DatePicker, Button, Space } from 'antd'
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAttendance } from '../../features/attendance/attendanceSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import { istMoment } from '../../utils/timeUtils'
import { calcLiveTotal, formatDate } from '../../utils/attendanceTimeUtils'
import dayjs from 'dayjs'

const MyAttendance = ({ embedded = false }) => {
  const dispatch = useDispatch()
  const { attendance, loading } = useSelector((state) => state.attendance)
  const [now, setNow] = useState(new Date())
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])

  const attendanceWithAbsent = useMemo(() => {
    if (!dateRange[0] || !dateRange[1] || !attendance) return attendance || []

    const today = dayjs().startOf('day')
    const start = dateRange[0].startOf('day')
    const end = dateRange[1].startOf('day')
    const lastDate = end.isAfter(today) ? today : end

    const punchedDates = new Set(
      attendance.map((rec) => dayjs(rec.date).format('YYYY-MM-DD'))
    )

    const result = [...attendance]
    let current = start

    while (current.isBefore(lastDate) || current.isSame(lastDate, 'day')) {
      const dateStr = current.format('YYYY-MM-DD')
      const dayOfWeek = current.day()

      if (dayOfWeek !== 0 && !punchedDates.has(dateStr)) {
        result.push({
          id: `absent-${dateStr}`,
          date: dateStr,
          checkIn: '-',
          checkOut: '-',
          totalHours: 0,
          status: 'Absent',
        })
      }
      current = current.add(1, 'day')
    }

    result.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    return result
  }, [attendance, dateRange])

  const loadAttendance = () => {
    const params = dateRange[0] && dateRange[1]
      ? {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          limit: 100,
        }
      : { limit: 100 }
    dispatch(fetchAttendance(params))
  }

  useEffect(() => {
    loadAttendance()
  }, [dispatch, dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD')])

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

  const columns = [
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
      render: (checkIn, record) => (
        <div>
          <div style={{ color: checkIn && checkIn !== '-' ? '#16a34a' : '#d1d5db', fontWeight: 600 }}>
            {checkIn && checkIn !== '-' ? checkIn : '--:--'}
          </div>
          {record.checkInLocation && (
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
              {typeof record.checkInLocation.distance === 'number' && !Number.isNaN(record.checkInLocation.distance) ? (
                <Tag size="small" color={record.checkInLocation.isWithinRadius ? 'green' : 'orange'}>
                  {record.checkInLocation.distance}m
                </Tag>
              ) : null}
              {record.officeName && <span style={{ marginLeft: 4 }}>{record.officeName}</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (checkOut, record) => (
        <div>
          <div style={{ color: checkOut && checkOut !== '-' ? '#dc2626' : '#d1d5db', fontWeight: 600 }}>
            {checkOut && checkOut !== '-' ? checkOut : '--:--'}
          </div>
          {record.checkOutLocation && (
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
              {typeof record.checkOutLocation.distance === 'number' && !Number.isNaN(record.checkOutLocation.distance) ? (
                <Tag size="small" color={record.checkOutLocation.isWithinRadius ? 'green' : 'orange'}>
                  {record.checkOutLocation.distance}m
                </Tag>
              ) : null}
              {record.officeName && <span style={{ marginLeft: 4 }}>{record.officeName}</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Total Hours',
      key: 'totalHours',
      render: (_, record) => {
        const isToday = record.date === dayjs().format('YYYY-MM-DD')
        const hasCheckIn = !!record.checkIn && record.checkIn !== '-'
        const hasCheckOut = !!record.checkOut && record.checkOut !== '-'

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
      render: (status) => {
        const color =
          status === 'Present' ? 'green' :
          status === 'Late' ? 'orange' :
          status === 'Leave' ? 'blue' :
          status === 'Half Day' ? 'purple' : 'red'
        return <Tag color={color}>{status}</Tag>
      },
    },
  ]

  const content = (
    <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Attendance</h1>
          <p className="page-description">View your attendance records</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates || [])}
              format="DD/MM/YYYY"
            />
            <Button icon={<ReloadOutlined />} onClick={loadAttendance}>
              Refresh
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={attendanceWithAbsent}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
  )
  return embedded ? content : <DashboardLayout>{content}</DashboardLayout>
}

export default MyAttendance
