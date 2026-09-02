import React, { useEffect } from 'react'
import { Card, Form, Input, DatePicker, Select, Button, InputNumber, message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'
import { fetchClients, fetchProjects } from '../../features/timesheet/timesheetSlice'

const { TextArea } = Input

const EditTimesheet = () => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  // The client and project masters come from the DAR module rather than a
  // hardcoded list, so the options here match what actually exists.
  const { clients, projects } = useSelector((state) => state.timesheet)

  useEffect(() => {
    dispatch(fetchClients())
    dispatch(fetchProjects())
  }, [dispatch])

  const onFinish = (values) => {
    message.success('Timesheet updated successfully!')
    form.resetFields()
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Edit Timesheet</h1>
          <p className="page-description">Update timesheet entry</p>
        </div>

        <Card className="card-container" style={{ maxWidth: 600 }}>
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
              name="client"
              label="Client"
              rules={[{ required: true, message: 'Please select client!' }]}
            >
              <Select
                placeholder="Select client"
                showSearch
                optionFilterProp="label"
                options={clients.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>

            <Form.Item
              name="project"
              label="Project"
              rules={[{ required: true, message: 'Please select project!' }]}
            >
              <Select
                placeholder="Select project"
                showSearch
                optionFilterProp="label"
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
              />
            </Form.Item>

            <Form.Item
              name="hours"
              label="Hours"
              rules={[{ required: true, message: 'Please enter hours!' }]}
            >
              <InputNumber min={0} max={24} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description!' }]}
            >
              <TextArea rows={4} placeholder="Enter work description" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Update Timesheet
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default EditTimesheet
