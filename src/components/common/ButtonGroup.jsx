import React from 'react'
import { Space } from 'antd'

/**
 * Reusable Button Group Component
 * Ensures consistent spacing and alignment
 */
const ButtonGroup = ({
  children,
  align = 'end', // 'start' | 'end' | 'center'
  size = 'middle',
  style = {},
  ...props
}) => {
  const alignmentMap = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
  }

  return (
    <Space
      style={{
        width: '100%',
        justifyContent: alignmentMap[align],
        ...style,
      }}
      size={size}
      {...props}
    >
      {children}
    </Space>
  )
}

export default ButtonGroup
