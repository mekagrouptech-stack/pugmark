import React from 'react'
import { Typography, Card, Row, Col, Spin } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useSelector } from 'react-redux'

const { Title, Text } = Typography

/**
 * Simple Dashboard - Fallback if main dashboard has issues
 */
const DashboardSimple = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated || !user) {
    return (
      <DashboardLayout>
        <div className="page-container" style={{ textAlign: 'center', padding: '100px 0' }}>
          <Card>
            <Text>Please log in to view the dashboard</Text>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            Welcome back, {user?.name || 'User'}!
          </Title>
          <Text type="secondary">
            {user?.role || 'Employee'} Dashboard
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <UserOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
                <div>
                  <Text strong>{user?.name || 'User'}</Text>
                </div>
                <Text type="secondary">{user?.email}</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Text strong>Role</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{user?.role || 'Employee'}</Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Text strong>Department</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{user?.department || 'N/A'}</Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Text strong>Employee Code</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{user?.employeeCode || 'N/A'}</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 24 }}>
          <Title level={4}>Quick Links</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => window.location.href = '/profile'}>
                My Profile
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => window.location.href = '/attendance/my-attendance'}>
                My Attendance
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => window.location.href = '/leaves/apply'}>
                Apply Leave
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => window.location.href = '/timesheet'}>
                Timesheet
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DashboardSimple
