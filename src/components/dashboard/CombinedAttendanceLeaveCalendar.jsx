import React, { useEffect, useState, useMemo } from 'react'
import { Card, Calendar, Tag, Empty, Button, Table } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useDispatch, useSelector } from 'react-redux'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons'
import { fetchLeaves } from '../../features/leave/leaveSlice'
import myTeamService from '../../features/myTeam/myTeamService'

/**
 * Combined Attendance + Leave + Regulation Calendar
 * Shows one calendar with:
 * - Attendance: Present (P), Late (L), Half Day (H), Absent (A)
 * - Leave: Pending, Approved (OK), Rejected (No)
 * - Regulation: Pending (Reg Pend), Approved (Reg OK), Rejected (Reg No)
 * Priority: leave > regulation > attendance
 */
const CombinedAttendanceLeaveCalendar = ({
  attendanceRecords = [],
  loading = false,
  title = 'My Calendar (Attendance & Leave)',
}) => {
  const dispatch = useDispatch()
  const { leaves, loading: leavesLoading } = useSelector((state) => state.leave)
  const [regulationRequests, setRegulationRequests] = useState([])
  const [loadingRegulations, setLoadingRegulations] = useState(false)

  useEffect(() => {
    dispatch(fetchLeaves())
  }, [dispatch])

  useEffect(() => {
    setLoadingRegulations(true)
    myTeamService.getMyAttendanceRequests()
      .then((data) => setRegulationRequests(Array.isArray(data) ? data : []))
      .catch(() => setRegulationRequests([]))
      .finally(() => setLoadingRegulations(false))
  }, [])

  const isLoading = loading || leavesLoading || loadingRegulations

  // Map date -> attendance status
  const dateAttendanceMap = {}
  ;(attendanceRecords || []).forEach((record) => {
    if (record.date) dateAttendanceMap[record.date] = record.status
  })

  // Map date -> leave status (first leave covering that day)
  const dateLeaveMap = {}
  ;(leaves || []).forEach((leave) => {
    const start = dayjs(leave.startDate)
    const end = dayjs(leave.endDate)
    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
      const key = d.format('YYYY-MM-DD')
      if (!dateLeaveMap[key]) dateLeaveMap[key] = leave.status
    }
  })

  // Map date -> regulation status (attendance regulation requests)
  const dateRegulationMap = {}
  ;(regulationRequests || []).forEach((r) => {
    const dateKey = r.date ? dayjs(r.date).format('YYYY-MM-DD') : null
    if (dateKey) dateRegulationMap[dateKey] = r.status
  })

  const ATTENDANCE_CONFIG = {
    Present: { color: '#52c41a', text: 'P', label: 'Present' },
    Late: { color: '#faad14', text: 'L', label: 'Late' },
    'Half Day': { color: '#722ed1', text: 'H', label: 'Half Day' },
    Absent: { color: '#ff4d4f', text: 'A', label: 'Absent' },
    Leave: { color: '#1890ff', text: 'Lv', label: 'Leave' },
  }

  const LEAVE_CONFIG = {
    Pending: { color: '#faad14', text: 'Pend', label: 'Leave Pending' },
    Approved: { color: '#13c2c2', text: 'OK', label: 'Leave Approved' }, // Teal – distinct from Present (green)
    Rejected: { color: '#ff4d4f', text: 'No', label: 'Leave Rejected' },
    Cancelled: { color: '#8c8c8c', text: 'Can', label: 'Cancelled' },
  }

  const REGULATION_CONFIG = {
    Pending: { color: '#fa8c16', text: 'Reg', label: 'Regulation Pending' },
    Approved: { color: '#13c2c2', text: 'OK', label: 'Regulation Approved' },
    Rejected: { color: '#ff4d4f', text: 'No', label: 'Regulation Rejected' },
  }

  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD')
    const leaveStatus = dateLeaveMap[dateStr]
    const regulationStatus = dateRegulationMap[dateStr]
    const attendanceStatus = dateAttendanceMap[dateStr]

    // Priority: leave > regulation > attendance
    if (leaveStatus) {
      const c = LEAVE_CONFIG[leaveStatus] || { color: '#d9d9d9', text: '' }
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
          title={c.label}
        >
          {c.text}
        </div>
      )
    }

    if (regulationStatus) {
      const c = REGULATION_CONFIG[regulationStatus] || { color: '#d9d9d9', text: '', label: 'Regulation' }
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
          title={c.label}
        >
          {c.text}
        </div>
      )
    }

    if (attendanceStatus) {
      const c = ATTENDANCE_CONFIG[attendanceStatus] || { color: '#d9d9d9', text: '' }
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
            fontWeight: 'bold',
            fontSize: 12,
          }}
          title={c.label}
        >
          {c.text}
        </div>
      )
    }

    return null
  }

  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const monthStart = currentMonth.startOf('month')
  const monthEnd = currentMonth.endOf('month')
  const currentMonthRecords = (attendanceRecords || []).filter((record) => {
    if (!record.date) return false
    const recordDate = dayjs(record.date)
    return recordDate.isSame(monthStart, 'month')
  })
  const presentCount = currentMonthRecords.filter((r) => r.status === 'Present').length
  const lateCount = currentMonthRecords.filter((r) => r.status === 'Late').length
  const absentCount = currentMonthRecords.filter((r) => r.status === 'Absent').length
  const halfDayCount = currentMonthRecords.filter((r) => r.status === 'Half Day').length

  const hasAnyData = (attendanceRecords && attendanceRecords.length > 0) || (leaves && leaves.length > 0)

  // Build attendance list for current month - always show all working days; no punch = Absent
  // No entry (no punch in/out, no leave) = show as Absent
  const attendanceList = useMemo(() => {
    const list = []
    const monthStart = currentMonth.startOf('month')
    const monthEnd = currentMonth.endOf('month')
    for (let d = monthStart; d.isBefore(monthEnd) || d.isSame(monthEnd, 'day'); d = d.add(1, 'day')) {
      const dateStr = d.format('YYYY-MM-DD')
      const dayOfWeek = d.day()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekends
      const leaveStatus = dateLeaveMap[dateStr]
      const regulationStatus = dateRegulationMap[dateStr]
      const attendanceStatus = dateAttendanceMap[dateStr]
      const status = leaveStatus || regulationStatus || attendanceStatus || 'Absent'
      const statusLabel = leaveStatus
        ? (LEAVE_CONFIG[leaveStatus]?.label || leaveStatus)
        : regulationStatus
          ? (REGULATION_CONFIG[regulationStatus]?.label || `Regulation ${regulationStatus}`)
          : (ATTENDANCE_CONFIG[attendanceStatus]?.label || attendanceStatus || 'Absent')
      list.push({ key: dateStr, date: dateStr, dateLabel: d.format('ddd, MMM D'), status, statusLabel })
    }
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [currentMonth, attendanceRecords, leaves, regulationRequests])

  if (isLoading) {
    return <Card title={title} loading style={{ minHeight: 400 }} />
  }

  return (
    <Card
      title={title}
      style={{
        minHeight: 400,
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
      bodyStyle={{ padding: '16px 24px' }}
      extra={
        <div style={{ display: 'flex', gap: 6, fontSize: 11, flexWrap: 'wrap', alignItems: 'center' }}>
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
          <span style={{ color: '#d9d9d9', margin: '0 4px' }}>|</span>
          <Tag color="orange" style={{ margin: 0 }}>Reg Pend</Tag>
          <Tag color="cyan" style={{ margin: 0 }}>Reg OK</Tag>
          <Tag color="red" style={{ margin: 0 }}>Reg No</Tag>
        </div>
      }
    >
      <>
          <Calendar
            fullscreen={false}
            value={currentMonth}
            onChange={setCurrentMonth}
            dateCellRender={dateCellRender}
            style={{ minHeight: 320 }}
            headerRender={() => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#262626',
                }}
              >
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                />
                <span>{currentMonth.format('MMMM YYYY')}</span>
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                />
              </div>
            )}
          />
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0',
              fontSize: 12,
              color: '#666',
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#262626' }}>Legend</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, rowGap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#52c41a', borderRadius: '50%', display: 'inline-block' }} />
                Present
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#faad14', borderRadius: '50%', display: 'inline-block' }} />
                Late
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#722ed1', borderRadius: '50%', display: 'inline-block' }} />
                Half Day
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#ff4d4f', borderRadius: '50%', display: 'inline-block' }} />
                Absent
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#fa8c16', borderRadius: '50%', display: 'inline-block' }} />
                Reg Pending
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#13c2c2', borderRadius: '50%', display: 'inline-block' }} />
                Reg Approved
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#ff4d4f', borderRadius: '50%', display: 'inline-block' }} />
                Reg Rejected
              </span>
            </div>
          </div>

      </>
    </Card>
  )
}

export default CombinedAttendanceLeaveCalendar
