import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import salaryService from '../../features/salary/salaryService'

const ConfigureSalaryHeads = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const load = async () => {
    try {
      setLoading(true)
      const list = await salaryService.getSalaryHeads()
      setData(list.map((item) => ({ ...item, key: item.id })))
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load salary heads')
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
    form.setFieldsValue({ type: 'EARNING', status: 'Active' })
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.head || record.name,
      type: record.type,
      status: record.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        name: values.name.trim(),
        type: values.type,
        status: values.status,
      }
      if (editingId) {
        await salaryService.updateSalaryHead(editingId, payload)
        message.success('Salary head updated successfully')
      } else {
        await salaryService.createSalaryHead(payload)
        message.success('Salary head created successfully')
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
      await salaryService.deleteSalaryHead(id)
      message.success('Salary head deleted')
      load()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete')
    }
  }

  const columns = [
    { title: 'Salary Head', dataIndex: 'head', key: 'head', render: (v) => v || '-' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'EARNING' ? 'green' : 'red'}>
          {type === 'EARNING' ? 'Earning' : 'Deduction'}
        </Tag>
      ),
    },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this salary head?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Configure Salary Heads</h1>
          <p className="page-description">Manage salary head configurations</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Salary Head
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 10 }}
            loading={loading}
            locale={{ emptyText: 'No salary heads. Click "Add Salary Head" to create one.' }}
          />
        </Card>

        <Modal
          title={editingId ? 'Edit Salary Head' : 'Add Salary Head'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSubmit}
          okText="Save"
          width={420}
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Salary Head Name"
              rules={[{ required: true, message: 'Enter salary head name' }]}
            >
              <Input placeholder="e.g. Basic Salary, HRA, PF" />
            </Form.Item>
            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: 'Earning', value: 'EARNING' },
                  { label: 'Deduction', value: 'DEDUCTION' },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Inactive', value: 'Inactive' },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ConfigureSalaryHeads
