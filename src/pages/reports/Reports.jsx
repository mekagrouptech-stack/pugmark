import React from 'react'
import { Card, Row, Col, Button } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'

const Reports = () => {
  const reports = [
    { title: 'Attendance Report', description: 'Monthly attendance summary' },
    { title: 'Leave Report', description: 'Leave utilization report' },
    { title: 'Timesheet Report', description: 'Project timesheet summary' },
    { title: 'Salary Report', description: 'Payroll and salary reports' },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Reports</h1>
          <p className="page-description">Generate and view various reports</p>
        </div>

        <Row gutter={[16, 16]}>
          {reports.map((report, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                actions={[
                  <Button type="link" key="view">
                    View
                  </Button>,
                  <Button type="link" key="download">
                    Download
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 24 }} />}
                  title={report.title}
                  description={report.description}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default Reports
