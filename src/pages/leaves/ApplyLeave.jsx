import React, { useEffect } from 'react'
import { Card, Form, Input, DatePicker, Select, Button, message, Row, Col } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { applyLeave, fetchLeaves, fetchLeaveBalance } from '../../features/leave/leaveSlice'
import LeaveCalendar from '../../components/dashboard/LeaveCalendar'
import DashboardLayout from '../../layouts/DashboardLayout'
import dayjs from 'dayjs'
import { CalendarOutlined, CheckCircleOutlined, FieldTimeOutlined } from '@ant-design/icons'

const { RangePicker } = DatePicker
const { TextArea } = Input

const LEAVE_TYPE_OPTIONS = [
  { value: 'earned', label: 'Earned Leave' },
  { value: 'lwp', label: 'Leave Without Pay (LWP)' },
  { value: 'compoff', label: 'Compensatory Off' },
]

const TOTAL_LEAVES_PER_YEAR = 30

const ApplyLeave = () => {
  const dispatch = useDispatch()
  const { leaveBalance } = useSelector((state) => state.leave)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchLeaves())
    dispatch(fetchLeaveBalance(new Date().getFullYear()))
  }, [dispatch])

  const onFinish = (values) => {
    const leaveData = {
      type: values.type,
      startDate: values.dates[0].format('YYYY-MM-DD'),
      endDate: values.dates[1].format('YYYY-MM-DD'),
      reason: values.reason,
    }
    dispatch(applyLeave(leaveData))
      .unwrap()
      .then(() => {
        message.success('Leave applied successfully!')
        form.resetFields()
      })
      .catch((err) => {
        message.error(err || 'Failed to apply leave')
      })
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Apply for Leave</h1>
          <p className="page-description">
            Submit a new leave request. Approval flow: 1) Reporting Person approves first → 2) Head HR gives final approval.
          </p>
        </div>

        {/* Leave balance: only approved leaves deduct from 30; show remaining */}
        <Card
          style={{
            borderRadius: 16,
            border: '1px solid #eef1f6',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
            marginBottom: 24,
          }}
          bodyStyle={{ padding: 20 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Leave Balance (Annual)</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Only approved leave days are deducted</span>
          </div>
          <Row gutter={[16, 16]}>
            {[
              {
                label: 'Total',
                value: leaveBalance?.totalLeaves ?? TOTAL_LEAVES_PER_YEAR,
                icon: <CalendarOutlined />,
                grad: ['#2563eb', '#4f46e5'],
                tint: '#eff6ff',
                border: '#dbeafe',
              },
              {
                label: 'Used (Approved)',
                value: leaveBalance?.usedLeaves ?? 0,
                icon: <CheckCircleOutlined />,
                grad: ['#16a34a', '#22c55e'],
                tint: '#f0fdf4',
                border: '#dcfce7',
              },
              {
                label: 'Remaining',
                value: leaveBalance?.remainingLeaves ?? TOTAL_LEAVES_PER_YEAR,
                icon: <FieldTimeOutlined />,
                grad: ['#f59e0b', '#fbbf24'],
                tint: '#fffbeb',
                border: '#fef3c7',
              },
            ].map((t) => (
              <Col xs={24} sm={8} key={t.label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 14,
                    background: t.tint,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: 13,
                      background: `linear-gradient(135deg, ${t.grad[0]}, ${t.grad[1]})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 22,
                      boxShadow: `0 6px 16px ${t.grad[0]}45`,
                    }}
                  >
                    {t.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      {t.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                        {t.value}
                      </span>
                      <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>days</span>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Leave Details</span>}
              style={{ borderRadius: 16, border: '1px solid #eef1f6', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)' }}
              headStyle={{ borderBottom: '1px solid #f0f0f0' }}
            >
              <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="type"
              label="Leave Type"
              rules={[{ required: true, message: 'Please select leave type!' }]}
            >
              <Select
                placeholder="Select leave type"
                style={{ width: '100%' }}
                size="large"
                options={LEAVE_TYPE_OPTIONS}
              />
            </Form.Item>

            <Form.Item
              name="dates"
              label="Leave Dates"
              rules={[{ required: true, message: 'Please select leave dates!' }]}
            >
              <RangePicker style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: 'Please enter reason!' }]}
            >
              <TextArea rows={4} placeholder="Enter reason for leave" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Submit Leave Request
              </Button>
            </Form.Item>
          </Form>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <LeaveCalendar title="My Leave Calendar (Approval Status)" />
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default ApplyLeave
