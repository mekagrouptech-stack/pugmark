import React, { useEffect } from 'react'
import { Card, Calendar, Tag, Empty } from 'antd'
import dayjs from 'dayjs'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaves } from '../../features/leave/leaveSlice'
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

/**
 * Leave Calendar - shows my leaves on calendar with approval status
 * Pending = orange, Approved = green, Rejected = red
 */
const LeaveCalendar = ({ title = 'My Leave Calendar' }) => {
  const dispatch = useDispatch()
  const { leaves, loading } = useSelector((state) => state.leave)

  useEffect(() => {
    dispatch(fetchLeaves())
  }, [dispatch])

  // Build a map: dateStr -> { status, leaveType } (if multiple leaves on same day, show first)
  const dateLeaveMap = {}
  ;(leaves || []).forEach((leave) => {
    const start = dayjs(leave.startDate)
    const end = dayjs(leave.endDate)
    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
      const key = d.format('YYYY-MM-DD')
      if (!dateLeaveMap[key]) dateLeaveMap[key] = { status: leave.status, leaveType: leave.leaveType }
    }
  })

  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD')
    const info = dateLeaveMap[dateStr]
    if (!info) return null
    const config = {
      Pending: { color: '#faad14', icon: <ClockCircleOutlined />, text: 'Pend' },
      Approved: { color: '#52c41a', icon: <CheckCircleOutlined />, text: 'OK' },
      Rejected: { color: '#ff4d4f', icon: <CloseCircleOutlined />, text: 'No' },
      Cancelled: { color: '#8c8c8c', icon: <CloseCircleOutlined />, text: 'Can' },
    }
    const c = config[info.status] || { color: '#d9d9d9', text: '' }
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.color,
          borderRadius: 4,
          color: '#fff',
          fontWeight: 600,
          fontSize: 11,
        }}
        title={`${info.leaveType || ''} - ${info.status}`}
      >
        {c.text}
      </div>
    )
  }

  if (loading && (!leaves || leaves.length === 0)) {
    return <Card title={title} loading style={{ minHeight: 320 }} />
  }

  return (
    <Card
      title={title}
      style={{ minHeight: 320 }}
      extra={
        <span style={{ fontSize: 12 }}>
          <Tag color="orange">Pending</Tag>
          <Tag color="green">Approved</Tag>
          <Tag color="red">Rejected</Tag>
        </span>
      }
    >
      {(!leaves || leaves.length === 0) ? (
        <Empty description="No leave records" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Calendar fullscreen={false} dateCellRender={dateCellRender} />
      )}
    </Card>
  )
}

export default LeaveCalendar
