import React from 'react'
import { Modal, Typography, Space, Alert, Button } from 'antd'
import { EnvironmentOutlined, InfoCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

/**
 * Location Consent Modal
 * Shows privacy and consent information before requesting location access
 */
const LocationConsentModal = ({ visible, onAccept, onDecline }) => {
  return (
    <Modal
      title={
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span>Location Access Required</span>
        </Space>
      }
      open={visible}
      onOk={onAccept}
      onCancel={onDecline}
      okText="Allow Location Access"
      cancelText="Cancel"
      okButtonProps={{ type: 'primary', size: 'large' }}
      cancelButtonProps={{ size: 'large' }}
      width={600}
      closable={false}
      maskClosable={false}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="Privacy Notice"
          description="We need your location to verify your attendance. Your location is captured only at the time of punch and is not tracked continuously."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        <div>
          <Text strong style={{ fontSize: 14 }}>Why we need your location:</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>
              <Text>To verify you are at the correct office location</Text>
            </li>
            <li>
              <Text>To ensure attendance accuracy and prevent fraud</Text>
            </li>
            <li>
              <Text>To comply with company attendance policies</Text>
            </li>
          </ul>
        </div>

        <div>
          <Text strong style={{ fontSize: 14 }}>What we do with your location:</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>
              <Text>Location is captured only when you punch in/out</Text>
            </li>
            <li>
              <Text>Location data is stored securely with your attendance record</Text>
            </li>
            <li>
              <Text>We do not track your location continuously</Text>
            </li>
            <li>
              <Text>Location data is only accessible to authorized personnel</Text>
            </li>
          </ul>
        </div>

        <Paragraph style={{ marginBottom: 0, color: '#8c8c8c', fontSize: 12 }}>
          By clicking "Allow Location Access", you consent to the collection and use of your location
          data as described above. You can revoke this permission at any time through your browser
          settings.
        </Paragraph>
      </Space>
    </Modal>
  )
}

export default LocationConsentModal
