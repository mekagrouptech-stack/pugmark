import React from 'react'
import { Card, Empty, Row, Col, Progress, Statistic, Space } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined } from '@ant-design/icons'

/**
 * Attendance Trend Chart Component
 * Shows attendance data (Present, Absent, Leave) with visual representation
 */
const AttendanceChart = ({ data = [], loading = false, title = 'Attendance Trend', attendance = null }) => {
  if (loading) {
    return <Card title={title} loading={loading} />
  }

  if (attendance) {
    const { present, absent, leave, totalDays } = attendance
    const presentPercent = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0
    const absentPercent = totalDays > 0 ? Math.round((absent / totalDays) * 100) : 0
    const leavePercent = totalDays > 0 ? Math.round((leave / totalDays) * 100) : 0

    return (
      <Card title={title}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Present"
                value={present}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress percent={presentPercent} strokeColor="#52c41a" showInfo={false} />
            </Col>
            <Col span={8}>
              <Statistic
                title="Absent"
                value={absent}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
              <Progress percent={absentPercent} strokeColor="#ff4d4f" showInfo={false} />
            </Col>
            <Col span={8}>
              <Statistic
                title="Leave"
                value={leave}
                prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
              <Progress percent={leavePercent} strokeColor="#faad14" showInfo={false} />
            </Col>
          </Row>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Statistic title="Total Days" value={totalDays} />
          </div>
        </Space>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card title={title}>
        <Empty description="No attendance data available" />
      </Card>
    )
  }

  return (
    <Card title={title}>
      <Empty description="No attendance data available" />
    </Card>
  )
}

export default AttendanceChart
