import React from 'react'
import { Card, Form, Input, DatePicker, InputNumber, Select, Button, Space, message } from 'antd'
import { SaveOutlined, SendOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { createProject } from '../../../features/projectManagement/projectSlice'
import DashboardLayout from '../../../layouts/DashboardLayout'

const { TextArea } = Input
const { RangePicker } = DatePicker

const ProjectCreate = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.project)
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    try {
      const projectData = {
        name: values.name,
        description: values.description,
        startDate: values.dates[0].format('YYYY-MM-DD'),
        endDate: values.dates[1].format('YYYY-MM-DD'),
        budget: values.budget,
        priority: values.priority,
        department: values.department,
        teamMembers: values.teamMembers || [],
      }

      await dispatch(createProject(projectData)).unwrap()
      navigate('/project/list')
    } catch (error) {
      message.error('Failed to create project')
    }
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Create Project</h1>
          <p className="page-description">Create a new project request</p>
        </div>

        <Card className="card-container">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              priority: 'medium',
              department: 'Engineering',
            }}
          >
            <Form.Item
              name="name"
              label="Project Name"
              rules={[{ required: true, message: 'Please enter project name' }]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={4} placeholder="Enter project description" />
            </Form.Item>

            <Form.Item
              name="dates"
              label="Project Duration"
              rules={[{ required: true, message: 'Please select project dates' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="budget"
              label="Budget (₹)"
              rules={[{ required: true, message: 'Please enter budget' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                placeholder="Enter budget"
              />
            </Form.Item>

            <Space wrap>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true }]}
                style={{ width: 200 }}
              >
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true }]}
                style={{ width: 200 }}
              >
                <Select>
                  <Select.Option value="Engineering">Engineering</Select.Option>
                  <Select.Option value="Design">Design</Select.Option>
                  <Select.Option value="QA">QA</Select.Option>
                  <Select.Option value="Operations">Operations</Select.Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                  Submit for Approval
                </Button>
                <Button onClick={() => navigate('/project/list')}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ProjectCreate
