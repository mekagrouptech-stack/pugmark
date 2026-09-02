import React, { useEffect } from 'react'
import { Tabs, Card } from 'antd'
import { SafetyOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import RolesTab from './RolesTab'
import DepartmentsTab from './DepartmentsTab'

const Settings = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const activeKey = location.pathname.includes('/departments') ? 'departments' : 'roles'

  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/roles', { replace: true })
    }
  }, [location.pathname, navigate])

  const tabItems = [
    {
      key: 'roles',
      label: (
        <span>
          <SafetyOutlined />
          Roles
        </span>
      ),
      children: <RolesTab />,
    },
    {
      key: 'departments',
      label: (
        <span>
          <TeamOutlined />
          Departments
        </span>
      ),
      children: <DepartmentsTab />,
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Manage roles and departments</p>
        </div>
        <Card>
          <Tabs
            activeKey={activeKey}
            onChange={(key) => navigate(`/settings/${key}`)}
            items={tabItems}
            type="card"
            size="large"
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Settings
