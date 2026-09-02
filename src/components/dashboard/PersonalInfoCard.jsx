import React from 'react'
import { Card, Descriptions, Tag, Space } from 'antd'
import { UserOutlined, MailOutlined, TeamOutlined, BankOutlined } from '@ant-design/icons'

/**
 * Personal Information Card Component
 * Displays user's personal information
 */
const PersonalInfoCard = ({ user, loading = false }) => {
  if (!user) {
    return null
  }

  return (
    <Card title="Personal Information" loading={loading}>
      <Descriptions column={1} size="small">
        <Descriptions.Item label={<><UserOutlined /> Name</>}>
          {user.name || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label={<><MailOutlined /> Email</>}>
          {user.email || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label={<><TeamOutlined /> Department</>}>
          {user.department || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label={<><BankOutlined /> Position</>}>
          {user.position || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Role">
          <Tag color="blue">{user.role?.toUpperCase() || 'N/A'}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

export default PersonalInfoCard
