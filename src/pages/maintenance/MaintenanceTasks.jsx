import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import hrService from '../../features/hr/hrService'

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
]

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

const MaintenanceTasks = () => {
  const [data, setData] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const load = async () => {
    try {
      setLoading(true)
      const [list, empList] = await Promise.all([
        hrService.getMaintenanceTasks(),
        hrService.getAllActiveUsers(),
      ])
      setData((list || []).map((item) => ({ ...item, key: item.id })))
      setEmployees(empList || [])
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load maintenance tasks')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ status: 'PENDING', priority: 'MEDIUM' })
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      status: record.status,
      priority: record.priority,
      dueDate: record.dueDate,
      assignedTo: record.assignedTo,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
        assignedTo: values.assignedTo || null,
      }
      if (editingId) {
        await hrService.updateMaintenanceTask(editingId, payload)
        message.success('Task updated successfully')
      } else {
        await hrService.createMaintenanceTask(payload)
        message.success('Task created successfully')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deleteMaintenanceTask(id)
      message.success('Task deleted')
      load()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete')
    }
  }

  const statusColor = { PENDING: 'orange', IN_PROGRESS: 'blue', COMPLETED: 'green' }
  const priorityColor = { LOW: 'default', MEDIUM: 'blue', HIGH: 'orange', URGENT: 'red' }

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true, render: (t) => t || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColor[s]}>{s?.replace('_', ' ')}</Tag> },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p) => <Tag color={priorityColor[p]}>{p}</Tag> },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (d) => d || '-' },
    { title: 'Assigned To', dataIndex: 'assignedUser', key: 'assignedUser', render: (t) => t || '-' },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this task?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Maintenance Tasks</h1>
          <p className="page-description">Manage maintenance tasks and assignments</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Task</Button>
          </Space>

          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 10 }}
            loading={loading}
            locale={{ emptyText: 'No tasks. Click "Add Task" to create one.' }}
          />
        </Card>

        <Modal
          title={editingId ? 'Edit Task' : 'Add Task'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSubmit}
          okText="Save"
          width={520}
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Enter title' }]}>
              <Input placeholder="Task title" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Task description" />
            </Form.Item>
            <Space style={{ width: '100%' }} size="middle">
              <Form.Item name="status" label="Status" style={{ flex: 1 }}>
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
              <Form.Item name="priority" label="Priority" style={{ flex: 1 }}>
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Space>
            <Form.Item name="dueDate" label="Due Date">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="assignedTo" label="Assigned To">
              <Select
                placeholder="Select assignee"
                allowClear
                showSearch
                optionFilterProp="label"
                options={employees.map((e) => ({ label: `${e.name}${e.employeeCode ? ` (${e.employeeCode})` : ''}`, value: e.id }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default MaintenanceTasks
