import React from 'react'
import { Card, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

/**
 * Management Shortcut Card Component
 * Clickable card for admin management actions
 */
const ManagementCard = ({
  title,
  description,
  icon,
  onClick,
  color = '#1890ff',
  loading = false,
  ...props
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      if (typeof onClick === 'string') {
        navigate(onClick)
      } else {
        onClick()
      }
    }
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        height: '100%',
        transition: 'all 0.3s',
        border: `1px solid ${color}20`,
      }}
      loading={loading}
      {...props}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, color, marginBottom: 16 }}>{icon}</div>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
          {title}
        </Text>
        {description && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {description}
          </Text>
        )}
      </div>
    </Card>
  )
}

export default ManagementCard
