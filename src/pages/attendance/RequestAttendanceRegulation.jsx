import React, { useState, useEffect, useCallback } from 'react'
import { Card, Form, Input, DatePicker, TimePicker, Select, Button, message, Calendar, Tag, Alert, List } from 'antd'
import { LeftOutlined, RightOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { createAttendanceRequest } from '../../features/myTeam/myTeamSlice'
import myTeamService from '../../features/myTeam/myTeamService'
import DashboardLayout from '../../layouts/DashboardLayout'
import dayjs from 'dayjs'

const { TextArea } = Input

const REQUEST_TYPES = [
  { value: 'Time Regulation', label: 'Time Regulation' },
  { value: 'Absent Regularization', label: 'Absent Regularization' },
  { value: 'Late Mark', label: 'Late Mark' },
]

const STATUS_CONFIG = {
  Pending: { color: '#f59e0b', text: 'Pending', icon: ClockCircleOutlined },
  Approved: { color: '#16a34a', text: 'Approved', icon: CheckCircleOutlined },
  Rejected: { color: '#ef4444', text: 'Rejected', icon: CloseCircleOutlined },
}

const RequestAttendanceRegulation = ({ embedded = false }) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [regulationRequests, setRegulationRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(null)

  const loadMyRequests = useCallback(async () => {
    setLoadingRequests(true)
    try {
      // Fetch ALL requests (no date filter) so calendar always shows applied regulations
      const data = await myTeamService.getMyAttendanceRequests()
      setRegulationRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load regulation requests:', err)
      setRegulationRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  useEffect(() => {
    loadMyRequests()
  }, [loadMyRequests])

  const formatTime = (val) =>
    val ? (dayjs.isDayjs(val) ? val.format('HH:mm') : String(val).trim()) : undefined

  const onFinish = async (values) => {
    setSubmitting(true)
    const payload = {
      date: values.date.format('YYYY-MM-DD'),
      requestType: values.requestType,
      reason: values.reason?.trim() || '',
      checkIn: formatTime(values.checkIn) || undefined,
      checkOut: formatTime(values.checkOut) || undefined,
    }
    try {
      await dispatch(createAttendanceRequest(payload)).unwrap()
      message.success('Attendance regulation request submitted. Head HR will review and approve; once approved, the day will count as attendance.')
      form.resetFields()
      loadMyRequests()
    } catch (err) {
      message.error(err || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const dateRegulationMap = {}
  regulationRequests.forEach((r) => {
    const dateKey = r.date ? dayjs(r.date).format('YYYY-MM-DD') : null
    if (dateKey) dateRegulationMap[dateKey] = r
  })

  const selectedDateReq = selectedDate ? dateRegulationMap[selectedDate.format('YYYY-MM-DD')] : null
  const hasPendingForSelected = selectedDateReq?.status === 'Pending'

  const handleCalendarSelect = (date) => {
    setSelectedDate(date)
    form.setFieldValue('date', date)
  }

  const cellRender = (current, info) => {
    if (!info?.originNode) return null
    if (info?.type && info.type !== 'date') return info.originNode
    const dateStr = current.format('YYYY-MM-DD')
    const req = dateRegulationMap[dateStr]
    if (!req) return null
    const config = STATUS_CONFIG[req.status] || { color: '#d9d9d9', text: req.status }
    const shortText = config.text === 'Pending' ? 'Pend' : config.text === 'Approved' ? 'OK' : config.text === 'Rejected' ? 'No' : config.text
    return (
      <span
        style={{
          display: 'inline-block',
          backgroundColor: config.color,
          color: '#fff',
          fontSize: 9,
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 4,
          marginTop: 2,
        }}
        title={`${req.requestType || 'Regulation'} - ${req.status}`}
      >
        {shortText}
      </span>
    )
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Request Attendance Regulation</h1>
        <p className="page-description">
          Submit a request to regularize attendance for a date. Your request goes directly to Head HR for approval. Once approved, that day will count as attendance.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 400px',
          gap: 24,
          alignItems: 'start',
        }}
        className="regulation-layout"
      >
        <Card
          title={<span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>My Regulation Calendar</span>}
          loading={loadingRequests}
          style={{
            borderRadius: 16,
            border: '1px solid #eef1f6',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
          }}
          extra={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={loadMyRequests}
                loading={loadingRequests}
              >
                Refresh
              </Button>
              <Tag color="orange" style={{ margin: 0 }}><ClockCircleOutlined /> Pending</Tag>
              <Tag color="green" style={{ margin: 0 }}><CheckCircleOutlined /> Approved</Tag>
              <Tag color="red" style={{ margin: 0 }}><CloseCircleOutlined /> Rejected</Tag>
            </div>
          }
        >
          <Calendar
            fullscreen={false}
            value={currentMonth}
            onChange={(val) => setCurrentMonth(val)}
            onSelect={handleCalendarSelect}
            cellRender={cellRender}
            style={{ minHeight: 320 }}
            headerRender={() => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#0f172a',
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
          {regulationRequests.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Your Regulation Requests</div>
              <List
                size="small"
                dataSource={regulationRequests}
                renderItem={(r) => {
                  const note = r.status === 'Approved' ? r.approvalNote : r.status === 'Rejected' ? r.rejectionReason : null
                  return (
                    <List.Item style={{ display: 'block' }}>
                      <div>
                        <Tag color={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : 'orange'}>
                          {r.status}
                        </Tag>
                        <span style={{ marginLeft: 8 }}>{r.date}</span>
                        <span style={{ color: '#666', marginLeft: 8 }}>({r.requestType})</span>
                      </div>
                      {note && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                          <strong>HR note:</strong> {note}
                        </div>
                      )}
                    </List.Item>
                  )
                }}
              />
            </div>
          )}
        </Card>

        <Card
          title={<span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>New Regulation Request</span>}
          style={{ borderRadius: 16, border: '1px solid #eef1f6', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)' }}
          headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        >
          {hasPendingForSelected && (
            <Alert
              type="info"
              message="You already have a pending request for this date"
              description="This date is shown on the calendar. Wait for approval or choose a different date."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              requestType: 'Time Regulation',
            }}
          >
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Select the date to regulate' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              maxDate={dayjs()}
              onChange={(date) => setSelectedDate(date)}
            />
          </Form.Item>
          <Form.Item
            name="requestType"
            label="Request Type"
            rules={[{ required: true }]}
          >
            <Select options={REQUEST_TYPES} placeholder="Select type" />
          </Form.Item>
          <Form.Item
            name="checkIn"
            label="Check-in time (optional)"
            extra="Used when approved to set the regulated check-in time"
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Select time" />
          </Form.Item>
          <Form.Item
            name="checkOut"
            label="Check-out time (optional)"
            extra="Used when approved to set the regulated check-out time"
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Select time" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter a reason' }]}
          >
            <TextArea rows={4} placeholder="Explain why you need this regulation (e.g. forgot to punch, system issue)" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={hasPendingForSelected}
            >
              Submit Request
            </Button>
          </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
  if (embedded) return content
  return <DashboardLayout>{content}</DashboardLayout>
}

export default RequestAttendanceRegulation
