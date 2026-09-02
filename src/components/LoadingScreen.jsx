import React from 'react'
import { Spin } from 'antd'

const LoadingScreen = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>Loading HRMS...</div>
      </div>
    </div>
  )
}

export default LoadingScreen
