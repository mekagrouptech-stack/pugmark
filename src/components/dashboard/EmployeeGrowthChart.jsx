import React from 'react'
import { Card, Empty, Row, Col, Statistic, Progress } from 'antd'
import { UserOutlined, ArrowUpOutlined } from '@ant-design/icons'

/**
 * Employee Growth Trend Chart Component
 * Shows employee count growth over time (Admin only)
 * Using simple visualization without external chart library
 */
const EmployeeGrowthChart = ({ data = [], loading = false, title = 'Employee Growth Trend' }) => {
  if (loading) {
    return <Card title={title} loading={loading} />
  }

  if (!data || data.length === 0) {
    return (
      <Card title={title}>
        <Empty description="No growth data available" />
      </Card>
    )
  }

  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2] || currentMonth
  const growth = currentMonth?.employees - previousMonth?.employees
  const growthPercent = previousMonth?.employees > 0 
    ? Math.round((growth / previousMonth.employees) * 100) 
    : 0

  return (
    <Card title={title}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic
            title="Current Employees"
            value={currentMonth?.employees || 0}
            prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff', fontSize: 32 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Growth This Month"
            value={growth}
            prefix={<ArrowUpOutlined style={{ color: growth >= 0 ? '#52c41a' : '#ff4d4f' }} />}
            valueStyle={{ color: growth >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 32 }}
            suffix="employees"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Growth Percentage"
            value={growthPercent}
            suffix="%"
            valueStyle={{ color: growthPercent >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 32 }}
          />
        </Col>
      </Row>
      
      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 16, fontWeight: 'bold' }}>Monthly Trend</div>
        <Row gutter={[8, 16]}>
          {data.slice(-6).map((item, index) => {
            const maxEmployees = Math.max(...data.map((d) => d.employees))
            const percent = maxEmployees > 0 ? (item.employees / maxEmployees) * 100 : 0
            return (
              <Col span={4} key={index}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, marginBottom: 8, color: '#8c8c8c' }}>{item.month}</div>
                  <Progress
                    type="circle"
                    percent={percent}
                    format={() => item.employees}
                    size={80}
                    strokeColor="#1890ff"
                  />
                </div>
              </Col>
            )
          })}
        </Row>
      </div>
    </Card>
  )
}

export default EmployeeGrowthChart
