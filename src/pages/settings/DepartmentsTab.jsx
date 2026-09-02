import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { API_BASE_URL } from '../../utils/constants'

const DepartmentsTab = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [form] = Form.useForm()

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setDepartments(data.data || [])
      } else {
        message.error(data.message || 'Failed to fetch departments')
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      message.error('Failed to fetch departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('hrms_token')
      const url = editingDepartment
        ? `${API_BASE_URL}/departments/${editingDepartment.id}`
        : `${API_BASE_URL}/departments`
      const method = editingDepartment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.success) {
        message.success(
          editingDepartment ? 'Department updated successfully' : 'Department created successfully'
        )
        setModalVisible(false)
        setEditingDepartment(null)
        form.resetFields()
        fetchDepartments()
      } else {
        message.error(data.message || 'Failed to save department')
      }
    } catch (error) {
      console.error('Error saving department:', error)
      message.error('Failed to save department')
    }
  }

  const handleEdit = (dept) => {
    setEditingDepartment(dept)
    form.setFieldsValue({ name: dept.name })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        message.success('Department deleted successfully')
        fetchDepartments()
      } else {
        message.error(data.message || 'Failed to delete department')
      }
    } catch (error) {
      message.error('Failed to delete department')
    }
  }

  const handleAdd = () => {
    setEditingDepartment(null)
    form.resetFields()
    setModalVisible(true)
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this department?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Department
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={departments}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
      />
      <Modal
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingDepartment(null)
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input placeholder="e.g., Engineering" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingDepartment ? 'Update' : 'Create'}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false)
                  form.resetFields()
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DepartmentsTab
