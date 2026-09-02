import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, DatePicker, Button, Space, Statistic, Row, Col } from 'antd'
import { ReloadOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDailyAttendanceReport } from '../../features/myTeam/myTeamSlice'
import { calcLiveTotal, formatDate } from '../../utils/attendanceTimeUtils'
import dayjs from 'dayjs'

const DailyAttendanceReport = () => {
  const dispatch = useDispatch()
  const { attendanceData, loading } = useSelector((state) => state.myTeam)
  const [selectedDate, setSelectedDate] = React.useState(dayjs())
  const [now, setNow] = useState(new Date())

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(() => dispatch(fetchDailyAttendanceReport({ date: selectedDate.format('YYYY-MM-DD') })), 60000)
    return () => clearInterval(t)
  }, [dispatch, selectedDate])

  useEffect(() => {
    dispatch(fetchDailyAttendanceReport({ date: selectedDate.format('YYYY-MM-DD') }))
  }, [dispatch, selectedDate])

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date)
      dispatch(fetchDailyAttendanceReport({ date: date.format('YYYY-MM-DD') }))
    }
  }

  const presentCount = attendanceData.filter((item) => item.status === 'Present').length
  const absentCount = attendanceData.filter((item) => item.status === 'Absent').length
  const lateCount = attendanceData.filter((item) => item.status === 'Late').length

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => formatDate(text),
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (text) => text && text !== '-' ? (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{text}</span>
      ) : <span style={{ color: '#d1d5db' }}>--:--</span>,
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (text) => text && text !== '-' ? (
        <span style={{ color: '#dc2626', fontWeight: 600 }}>{text}</span>
      ) : <span style={{ color: '#d1d5db' }}>--:--</span>,
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
      title: 'Late By',
      dataIndex: 'lateBy',
      key: 'lateBy',
      render: (lateBy) => (lateBy && lateBy !== '0 min' ? <Tag color="orange">{lateBy}</Tag> : '-'),
    },
    {
      title: 'Early Out',
      dataIndex: 'earlyOut',
      key: 'earlyOut',
      render: (earlyOut) => (earlyOut === 'Yes' ? <Tag color="orange">Yes</Tag> : 'No'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          Present: 'green',
          Absent: 'red',
          Late: 'orange',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
  ]

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Present"
                value={presentCount}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Absent"
                value={absentCount}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Late"
                value={lateCount}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              format="DD/MM/YYYY"
              size="large"
              suffixIcon={<CalendarOutlined />}
            />
            <Button icon={<ReloadOutlined />} onClick={() => handleDateChange(selectedDate)}>
              Generate Report
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={attendanceData}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} records`,
            }}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <div>No attendance records found for selected date</div>
                </div>
              ),
            }}
          />
        </Card>
    </>
  )
}

export default DailyAttendanceReport
