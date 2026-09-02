import React from 'react'
import { Card, Form, DatePicker, InputNumber, Button, Statistic, Row, Col } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const OvertimeCalculator = () => {
  const [form] = Form.useForm()
  const [overtime, setOvertime] = React.useState(0)

  const onFinish = (values) => {
    const regularHours = 8
    const totalHours = values.hours || 0
    const calculatedOvertime = Math.max(0, totalHours - regularHours)
    setOvertime(calculatedOvertime)
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Overtime Calculator</h1>
          <p className="page-description">Calculate overtime hours</p>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card className="card-container">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Form.Item
                  name="date"
                  label="Date"
                  rules={[{ required: true, message: 'Please select date!' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="hours"
                  label="Total Hours Worked"
                  rules={[{ required: true, message: 'Please enter hours!' }]}
                >
                  <InputNumber
                    min={0}
                    max={24}
                    style={{ width: '100%' }}
                    placeholder="Enter total hours"
                  />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large">
                    Calculate
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card>
              <Statistic
                title="Overtime Hours"
                value={overtime}
                suffix="hours"
                valueStyle={{ color: '#1890ff', fontSize: 32 }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default OvertimeCalculator
