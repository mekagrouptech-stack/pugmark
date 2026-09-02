import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography, Alert, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import api from '../../services/api'

const { Title, Text } = Typography

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [resetLink, setResetLink] = useState(null)
  const [emailNotFound, setEmailNotFound] = useState(false)

  const onFinish = async (values) => {
    if (import.meta.env.DEV) console.log('[ForgotPassword] onFinish called', values)
    setSubmitting(true)
    setResetLink(null)
    setEmailNotFound(false)
    const email = values?.email?.trim()
    if (!email) {
      message.error('Please enter your email')
      setSubmitting(false)
      return
    }
    try {
      if (import.meta.env.DEV) console.log('[ForgotPassword] Sending API request to /auth/forgot-password')
      const response = await api.post('/auth/forgot-password', { email })
      const data = response.data

      if (data?.emailFound === false) {
        setEmailNotFound(true)
        message.warning('No account found with this email address.')
        return
      }

      // Dev mode: backend returns reset URL when SMTP not configured
      if (data?.resetUrl) {
        message.success('Check the link below (SMTP not configured - dev mode)')
        const url = new URL(data.resetUrl)
        const currentOrigin = window.location.origin
        const resetUrlWithCurrentOrigin = `${currentOrigin}${url.pathname}${url.search}`
        setResetLink(resetUrlWithCurrentOrigin)
      } else {
        message.success('Password reset link has been sent to your inbox. Please check your email.')
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to send password reset link'
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Card
        style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ marginBottom: 4 }}>
              Forgot Password
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Enter your registered email address to receive a password reset link.
            </Text>
          </div>
        }
      >
        <Form
          form={form}
          name="forgotPassword"
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={(err) => {
            if (import.meta.env.DEV) console.log('[ForgotPassword] Validation failed', err)
            message.error('Please fix the form errors above')
          }}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          {emailNotFound && (
            <Form.Item>
              <Alert
                type="warning"
                message="Email Not Registered"
                description="No account found with this email address. Please check the email or contact your administrator to register."
                showIcon
              />
            </Form.Item>
          )}

          {resetLink && (
            <Form.Item>
              <Alert
                type="info"
                message="Development Mode"
                description={
                  <div>
                    <Text style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      SMTP is not configured. Use this link to reset your password:
                    </Text>
                    <a href={resetLink} target="_blank" rel="noopener noreferrer">
                      Reset Password Link
                    </a>
                  </div>
                }
                showIcon
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="button"
              block
              loading={submitting}
              style={{ marginBottom: 8 }}
              onClick={() => form.submit()}
            >
              Send Reset Link
            </Button>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button block htmlType="button" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </AuthLayout>
  )
}

export default ForgotPassword

