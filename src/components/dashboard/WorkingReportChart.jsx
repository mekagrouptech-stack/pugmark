import React from 'react'
import { Card, Empty, Row, Col, Progress, Tag, Space } from 'antd'
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'

/**
 * Working Report Status Chart Component
 * Shows working report status distribution (Submitted, Approved, Pending)
 */
const WorkingReportChart = ({ data = [], loading = false, title = 'Working Report Status', workingReports = null }) => {
  if (loading) {
    return <Card title={title} loading={loading} />
  }

  if (workingReports) {
    const { submitted, approved, pending, total } = workingReports
    const submittedPercent = total > 0 ? Math.round((submitted / total) * 100) : 0
    const approvedPercent = total > 0 ? Math.round((approved / total) * 100) : 0
    const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0

    return (
      <Card title={title}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{submitted}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Submitted</div>
                <Progress percent={submittedPercent} strokeColor="#1890ff" showInfo={false} size="small" />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{approved}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Approved</div>
                <Progress percent={approvedPercent} strokeColor="#52c41a" showInfo={false} size="small" />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{pending}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Pending</div>
                <Progress percent={pendingPercent} strokeColor="#faad14" showInfo={false} size="small" />
              </div>
            </Col>
          </Row>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              Total: {total} Reports
            </Tag>
          </div>
        </Space>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card title={title}>
        <Empty description="No working report data available" />
      </Card>
    )
  }

  return (
    <Card title={title}>
      <Empty description="No working report data available" />
    </Card>
  )
}

export default WorkingReportChart
