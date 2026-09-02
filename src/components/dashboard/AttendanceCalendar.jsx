import React from 'react'
import { Card, Calendar, Tag, Empty, Badge } from 'antd'
import dayjs from 'dayjs'
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, FieldTimeOutlined } from '@ant-design/icons'

/**
 * Attendance Calendar Component
 * Shows attendance in calendar format with color-coded dates
 * Green = Present, Yellow = Late, Red = Absent, Purple = Half Day
 */
const AttendanceCalendar = ({ attendanceRecords = [], loading = false, title = 'My Attendance Calendar' }) => {
  if (loading) {
    return <Card title={title} loading={loading} style={{ height: 400 }} />
  }

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return (
      <Card title={title} style={{ height: 400 }}>
        <Empty description="No attendance records available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )
  }

  // Create a map of dates to attendance status
  const dateStatusMap = {}
  attendanceRecords.forEach((record) => {
    if (record.date) {
      dateStatusMap[record.date] = record.status
    }
  })

  // Custom cell renderer for calendar dates
  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD')
    const status = dateStatusMap[dateStr]

    if (!status) {
      return null
    }

    // Color mapping
    const statusConfig = {
      Present: { color: '#52c41a', icon: <CheckCircleOutlined />, text: 'P' },
      Late: { color: '#faad14', icon: <ClockCircleOutlined />, text: 'L' },
      Absent: { color: '#ff4d4f', icon: <CloseCircleOutlined />, text: 'A' },
      'Half Day': { color: '#722ed1', icon: <FieldTimeOutlined />, text: 'H' },
    }

    const config = statusConfig[status] || { color: '#d9d9d9', text: '' }

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: config.color,
          borderRadius: '4px',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '12px',
        }}
        title={status}
      >
        {config.text}
      </div>
    )
  }

  // Get current month's dates
  const currentMonth = dayjs()
  const monthStart = currentMonth.startOf('month')
  const monthEnd = currentMonth.endOf('month')

  // Filter records for current month
  const currentMonthRecords = attendanceRecords.filter((record) => {
    if (!record.date) return false
    const recordDate = dayjs(record.date)
    const recordMonth = recordDate.month()
    const recordYear = recordDate.year()
    const currentMonthNum = currentMonth.month()
    const currentYearNum = currentMonth.year()
    return recordMonth === currentMonthNum && recordYear === currentYearNum
  })

  // Count statuses
  const presentCount = currentMonthRecords.filter((r) => r.status === 'Present').length
  const lateCount = currentMonthRecords.filter((r) => r.status === 'Late').length
  const absentCount = currentMonthRecords.filter((r) => r.status === 'Absent').length
  const halfDayCount = currentMonthRecords.filter((r) => r.status === 'Half Day').length

  return (
    <Card
      title={title}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px' }}
      extra={
        <div style={{ display: 'flex', gap: 8, fontSize: '11px', flexWrap: 'wrap' }}>
          <Tag color="#52c41a" style={{ margin: 0 }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} /> P: {presentCount}
          </Tag>
          <Tag color="#faad14" style={{ margin: 0 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} /> L: {lateCount}
          </Tag>
          <Tag color="#722ed1" style={{ margin: 0 }}>
            <FieldTimeOutlined style={{ marginRight: 4 }} /> H: {halfDayCount}
          </Tag>
          <Tag color="#ff4d4f" style={{ margin: 0 }}>
            <CloseCircleOutlined style={{ marginRight: 4 }} /> A: {absentCount}
          </Tag>
        </div>
      }
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Calendar
          fullscreen={false}
          dateCellRender={dateCellRender}
          style={{ flex: 1, minHeight: 320 }}
          headerRender={({ value }) => {
            return (
              <div
                style={{
                  padding: '12px 0',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '16px',
                  color: '#262626',
                }}
              >
                {value.format('MMMM YYYY')}
              </div>
            )
          }}
        />
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #f0f0f0',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  backgroundColor: '#52c41a',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                }}
              />
              <span style={{ fontWeight: 500 }}>Present</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  backgroundColor: '#faad14',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                }}
              />
              <span style={{ fontWeight: 500 }}>Late</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  backgroundColor: '#722ed1',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                }}
              />
              <span style={{ fontWeight: 500 }}>Half Day</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  backgroundColor: '#ff4d4f',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                }}
              />
              <span style={{ fontWeight: 500 }}>Absent</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default AttendanceCalendar
