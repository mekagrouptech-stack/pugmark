import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import AuthLayout from '../../layouts/AuthLayout'
import api from '../../services/api'

const { Title, Text } = Typography

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    const t = searchParams.get('token')
    if (t) {
      setToken(t)
      setTokenValid(true)
    } else {
      setTokenValid(false)
      message.error('Invalid or missing reset token. Please request a new password reset link.')
      navigate('/login')
    }
  }, [searchParams, navigate])

  const onFinish = async (values) => {
    if (!token) {
      message.error('Reset token is missing. Please request a new password reset link.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        password: values.password,
      })
      message.success('Password reset successfully! You can now log in with your new password.')
      navigate('/login')
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to reset password. The link may have expired.'
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (!tokenValid) return null

  return (
    <AuthLayout>
      <Card
        style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ marginBottom: 4 }}>
              Reset Password
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Choose a strong new password for your HRMS account.
            </Text>
          </div>
        }
      >
        <Form
          form={form}
          name="resetPassword"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('The two passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="button"
              block
              loading={submitting}
              style={{ marginBottom: 8 }}
              onClick={() => form.submit()}
            >
              Update Password
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

export default ResetPassword

