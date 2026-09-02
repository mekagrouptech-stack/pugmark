import React from 'react'
import { Space } from 'antd'

/**
 * Reusable Form Button Group Component
 * Standard alignment for form buttons (Save, Cancel, etc.)
 */
const FormButtonGroup = ({
  children,
  align = 'end', // 'start' | 'end' | 'center'
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
        marginTop: 16,
        ...style,
      }}
      {...props}
    >
      {children}
    </Space>
  )
}

export default FormButtonGroup
