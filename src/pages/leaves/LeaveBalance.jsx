import React, { useEffect } from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { CalendarOutlined, CheckCircleOutlined, FieldTimeOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaveBalance } from '../../features/leave/leaveSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const LeaveBalance = () => {
  const dispatch = useDispatch()
  const { leaveBalance, loading } = useSelector((state) => state.leave)

  useEffect(() => {
    dispatch(fetchLeaveBalance(new Date().getFullYear()))
  }, [dispatch])

  const total = leaveBalance?.totalLeaves ?? 30
  const used = leaveBalance?.usedLeaves ?? 0
  const remaining = leaveBalance?.remainingLeaves ?? 30

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Leave Balance</h1>
          <p className="page-description">
            Every employee has 30 leaves per year. Only approved leave days are deducted; remaining days are shown below.
          </p>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card loading={loading}>
              <Statistic
                title="Total Leave (Annual)"
                value={total}
                suffix="days"
                prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card loading={loading}>
              <Statistic
                title="Used (Approved leaves)"
                value={used}
                suffix="days"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card loading={loading} style={{ borderColor: '#faad14', background: '#fffbe6' }}>
              <Statistic
                title="Remaining"
                value={remaining}
                suffix="days"
                prefix={<FieldTimeOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default LeaveBalance
