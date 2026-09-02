import React from 'react'
import { Result, Button, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

/**
 * Fallback Dashboard when there's an error
 */
const DashboardFallback = ({ error, loading }) => {
  const navigate = useNavigate()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-container" style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>Loading dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <Result
            status="warning"
            title="Unable to load dashboard"
            subTitle={error || 'Please try refreshing the page'}
            extra={[
              <Button type="primary" key="refresh" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>,
              <Button key="profile" onClick={() => navigate('/profile')}>
                Go to Profile
              </Button>,
            ]}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1>Welcome to HRMS Dashboard</h1>
          <p>Dashboard is loading...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DashboardFallback
