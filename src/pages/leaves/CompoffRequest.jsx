import React from 'react'
import { Card, Form, Input, DatePicker, Button, message } from 'antd'
import { useDispatch } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'

const { TextArea } = Input

const CompoffRequest = () => {
  const [form] = Form.useForm()

  const onFinish = (values) => {
    message.success('Compensatory Off request submitted successfully!')
    form.resetFields()
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Compensatory Off Request</h1>
          <p className="page-description">Request compensatory off for working on holidays/weekends</p>
        </div>

        <Card className="card-container" style={{ maxWidth: 600 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="workDate"
              label="Work Date"
              rules={[{ required: true, message: 'Please select work date!' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: 'Please enter reason!' }]}
            >
              <TextArea rows={4} placeholder="Enter reason for compensatory off" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Submit Request
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default CompoffRequest
