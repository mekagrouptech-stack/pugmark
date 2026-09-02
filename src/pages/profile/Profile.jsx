import React from 'react'
import { Card, Descriptions, Avatar, Tag } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'

const Profile = () => {
  const { user } = useSelector((state) => state.auth)

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
        </div>

        <Card className="card-container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Avatar
              size={120}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
            />
            <h2 style={{ marginTop: 16 }}>{user?.name}</h2>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              {user?.role?.toUpperCase()}
            </Tag>
          </div>

          <Descriptions title="Personal Information" bordered column={2}>
            <Descriptions.Item label="Name">{user?.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Employee ID">EMP{user?.id?.toString().padStart(3, '0')}</Descriptions.Item>
            <Descriptions.Item label="Department">{user?.department || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Report To">{user?.reportingManagerName || user?.reportTo || 'Head of Department'}</Descriptions.Item>
            <Descriptions.Item label="Role">{user?.role}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="green">Active</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Profile
