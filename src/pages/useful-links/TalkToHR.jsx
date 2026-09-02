import React from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const { TextArea } = Input

const TalkToHR = () => {
  const [form] = Form.useForm()

  const onFinish = (values) => {
    message.success('Message sent to HR successfully!')
    form.resetFields()
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Talk to your HR</h1>
          <p className="page-description">Send a message to HR department</p>
        </div>

        <Card className="card-container" style={{ maxWidth: 600 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please enter subject!' }]}
            >
              <Input placeholder="Enter subject" />
            </Form.Item>

            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: 'Please enter message!' }]}
            >
              <TextArea rows={6} placeholder="Enter your message" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Send Message
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TalkToHR
