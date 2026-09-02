import React from 'react'
import { Card, Progress, Row, Col, Statistic } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const Utilization = () => {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Utilization</h1>
          <p className="page-description">Resource utilization statistics</p>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Monthly Utilization">
              <Progress type="circle" percent={85} />
              <p style={{ marginTop: 16, textAlign: 'center' }}>85% Utilization</p>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Statistics">
              <Statistic title="Total Hours" value={160} suffix="hours" />
              <Statistic title="Billable Hours" value={136} suffix="hours" style={{ marginTop: 16 }} />
              <Statistic title="Non-Billable Hours" value={24} suffix="hours" style={{ marginTop: 16 }} />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default Utilization
