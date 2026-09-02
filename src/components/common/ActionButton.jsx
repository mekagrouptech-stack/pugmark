import React from 'react'
import { Button, Tooltip } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

/**
 * Reusable Action Button Component
 * Handles loading, disabled states, and role-based visibility
 */
const ActionButton = ({
  type = 'default',
  icon,
  children,
  onClick,
  loading = false,
  disabled = false,
  danger = false,
  size = 'middle',
  htmlType = 'button',
  tooltip,
  block = false,
  style = {},
  className = '',
  ...props
}) => {
  const button = (
    <Button
      type={type}
      icon={loading ? <LoadingOutlined /> : icon}
      onClick={onClick}
      loading={loading}
      disabled={disabled || loading}
      danger={danger}
      size={size}
      htmlType={htmlType}
      block={block}
      style={style}
      className={className}
      {...props}
    >
      {children}
    </Button>
  )

  if (tooltip) {
    return <Tooltip title={tooltip}>{button}</Tooltip>
  }

  return button
}

export default ActionButton
