import React, { useState } from 'react'
import { Card, Form, Select, Input, DatePicker, InputNumber, Button, Row, Col, message, Tag } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import { applyResignation } from '../../features/resignation/resignationSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import dayjs from 'dayjs'

const { TextArea } = Input

const MyResignation = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [form] = Form.useForm()
  const [forUser, setForUser] = useState('me')

  const reasons = [
    'Better Opportunity',
    'Personal Reasons',
    'Health Issues',
    'Family Reasons',
    'Relocation',
    'Career Growth',
    'Other',
  ]

  const calculateLastWorkingDay = (noticePeriod) => {
    if (noticePeriod) {
      const lastWorkingDay = dayjs().add(noticePeriod, 'day')
      form.setFieldsValue({ requestedLastWorkingDay: lastWorkingDay })
      return lastWorkingDay
    }
    return null
  }

  const onFinish = (values) => {
    const resignationData = {
      forUser: values.forUser || 'me',
      employeeName: values.forUser === 'other' ? values.employeeName : user?.name,
      noticePeriod: values.noticePeriod,
      lastWorkingDay: values.lastWorkingDay ? values.lastWorkingDay.format('YYYY-MM-DD') : null,
      reason: values.reason,
      requestedLastWorkingDay: values.requestedLastWorkingDay
        ? values.requestedLastWorkingDay.format('YYYY-MM-DD')
        : null,
      remarks: values.remarks || '',
      status: 'Pending',
    }

    dispatch(applyResignation(resignationData))
      .unwrap()
      .then(() => {
        message.success('Resignation request submitted successfully!')
        form.resetFields()
        setForUser('me')
      })
      .catch((err) => {
        message.error(err || 'Failed to submit resignation')
      })
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Resignation</h1>
          <p className="page-description">Submit your resignation request</p>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card className="card-container">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                initialValues={{ forUser: 'me', noticePeriod: 30 }}
              >
                <Form.Item
                  name="forUser"
                  label="For User"
                  rules={[{ required: true, message: 'Please select user!' }]}
                >
                  <Select onChange={(value) => setForUser(value)}>
                    <Select.Option value="me">Me</Select.Option>
                    <Select.Option value="other">Other User</Select.Option>
                  </Select>
                </Form.Item>

                {forUser === 'other' && (
                  <Form.Item
                    name="employeeName"
                    label="Employee Name"
                    rules={[{ required: true, message: 'Please enter employee name!' }]}
                  >
                    <Input placeholder="Enter employee name" />
                  </Form.Item>
                )}

                {forUser === 'me' && (
                  <Form.Item label="Employee Name">
                    <Input value={user?.name || 'N/A'} disabled />
                  </Form.Item>
                )}

                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="noticePeriod"
                      label="Notice Period (Days)"
                      rules={[{ required: true, message: 'Please enter notice period!' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        placeholder="Enter notice period"
                        onChange={(value) => {
                          if (value) {
                            const lastWorkingDay = calculateLastWorkingDay(value)
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="lastWorkingDay"
                      label="Last Working Day"
                      rules={[{ required: true, message: 'Please select last working day!' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="reason"
                  label="Reason for Leaving"
                  rules={[{ required: true, message: 'Please select reason!' }]}
                >
                  <Select placeholder="Select reason for leaving">
                    {reasons.map((reason) => (
                      <Select.Option key={reason} value={reason}>
                        {reason}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="requestedLastWorkingDay"
                  label="Requested Last Working Day"
                  rules={[{ required: true, message: 'Please select requested last working day!' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item name="remarks" label="Remarks">
                  <TextArea rows={4} placeholder="Enter any additional remarks" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block>
                    Submit Resignation Request
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Employee Details" className="card-container">
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Name:</strong>
                  <div style={{ marginTop: 4 }}>{user?.name || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Designation:</strong>
                  <div style={{ marginTop: 4 }}>{user?.designation || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>DOJ:</strong>
                  <div style={{ marginTop: 4 }}>2023-01-15</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Manager:</strong>
                  <div style={{ marginTop: 4 }}>Manager Name</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Email:</strong>
                  <div style={{ marginTop: 4 }}>{user?.email || 'N/A'}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Status:</strong>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="green">Active</Tag>
                  </div>
                </div>
                <div>
                  <strong>City:</strong>
                  <div style={{ marginTop: 4 }}>City Name</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default MyResignation
