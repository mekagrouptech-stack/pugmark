import React, { useEffect, useRef, useState } from 'react'
import { Form, Input, Button, Card, Typography, App, Alert, Space } from 'antd'
import { UserOutlined, ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { requestOtp, verifyOtp, clearError } from '../../features/auth/authSlice'
import { getRoleDashboard } from '../../utils/roleGuard'
import AuthLayout from '../../layouts/AuthLayout'
import logo from '../../../logo.jpeg'

const OTP_LENGTH = 6

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)
  const { message } = App.useApp()
  const { Link, Text } = Typography
  const { user } = useSelector((state) => state.auth)

  // 'email' asks who you are, 'code' takes the six digits we just mailed.
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  // Only ever set when the backend runs without SMTP, so local development is
  // not locked out of its own login screen.
  const [devOtp, setDevOtp] = useState(null)
  const [codeForm] = Form.useForm()
  const timerRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboard = getRoleDashboard(user.role)
      navigate(dashboard)
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  // One interval owned by the component; cleared on unmount so a user who
  // navigates away mid-countdown does not leave it running.
  useEffect(() => {
    if (resendIn <= 0) return undefined
    timerRef.current = setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [resendIn])

  const sendCode = async (targetEmail, { isResend = false } = {}) => {
    try {
      setSending(true)
      const result = await dispatch(requestOtp(targetEmail)).unwrap()

      // The server answers 200 with emailFound:false for an unknown address —
      // a success response that is not a success for the person signing in.
      if (result.emailFound === false) {
        message.error(result.message || 'No active account found with this email address.')
        return
      }

      setEmail(targetEmail)
      setDevOtp(result.devOtp || null)
      setResendIn(result.resendInSeconds || 60)
      setStep('code')
      codeForm.resetFields()
      message.success(isResend ? 'A new code has been sent.' : result.message)
    } catch (err) {
      message.error(err || 'Could not send the login code.')
    } finally {
      setSending(false)
    }
  }

  const onSubmitEmail = (values) => sendCode(values.email.trim().toLowerCase())

  const onSubmitCode = (values) => {
    dispatch(verifyOtp({ email, otp: values.otp }))
      .unwrap()
      .then((response) => {
        message.success('Login successful!')
        navigate(getRoleDashboard(response.user.role))
      })
      .catch((err) => {
        // Each wrong code costs an attempt, so clear the field to make the
        // retry deliberate rather than an accidental resubmit.
        codeForm.setFieldsValue({ otp: '' })
        message.error(err || 'Login failed')
      })
  }

  const backToEmail = () => {
    setStep('email')
    setDevOtp(null)
    codeForm.resetFields()
  }

  return (
    <AuthLayout>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            marginBottom: 24,
          }}
        >
          <img
            src={logo}
            alt="HRMS Logo"
            style={{
              height: 60,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              marginBottom: 12,
            }}
          />
          <div style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>HRMS Login</div>
          <Text type="secondary" style={{ fontSize: 13, textAlign: 'center', marginTop: 4 }}>
            {step === 'email'
              ? 'Sign in with a one-time code sent to your email'
              : `Enter the ${OTP_LENGTH}-digit code sent to ${email}`}
          </Text>
        </div>

        {step === 'email' ? (
          <Form name="login-email" onFinish={onSubmitEmail} layout="vertical" size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" autoComplete="username" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={sending}>
                Send login code
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            form={codeForm}
            name="login-code"
            onFinish={onSubmitCode}
            layout="vertical"
            size="large"
          >
            {devOtp && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message={`Development code: ${devOtp}`}
                description="Email is not configured on this server, so the code is shown here."
              />
            )}

            <Form.Item
              name="otp"
              rules={[
                { required: true, message: 'Please enter the code' },
                {
                  pattern: new RegExp(`^[0-9]{${OTP_LENGTH}}$`),
                  message: `The code is ${OTP_LENGTH} digits`,
                },
              ]}
            >
              <Input.OTP length={OTP_LENGTH} autoFocus inputMode="numeric" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                icon={<SafetyCertificateOutlined />}
              >
                Verify &amp; sign in
              </Button>
            </Form.Item>

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button type="link" size="small" icon={<ArrowLeftOutlined />} onClick={backToEmail}>
                Change email
              </Button>
              <Button
                type="link"
                size="small"
                disabled={resendIn > 0 || sending}
                loading={sending}
                onClick={() => sendCode(email, { isResend: true })}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </Button>
            </Space>
          </Form>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Link
            style={{ fontSize: 13, cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault()
              navigate('/forgot-password')
            }}
          >
            Trouble signing in?
          </Link>
        </div>
      </Card>
    </AuthLayout>
  )
}

export default Login
