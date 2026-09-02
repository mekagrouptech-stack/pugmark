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

const RolesTab = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [form] = Form.useForm()

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setRoles(data.data || [])
      } else {
        message.error(data.message || 'Failed to fetch roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      message.error('Failed to fetch roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('hrms_token')
      const url = editingRole
        ? `${API_BASE_URL}/roles/${editingRole.id}`
        : `${API_BASE_URL}/roles`
      const method = editingRole ? 'PUT' : 'POST'

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
        message.success(editingRole ? 'Role updated successfully' : 'Role created successfully')
        setModalVisible(false)
        setEditingRole(null)
        form.resetFields()
        fetchRoles()
      } else {
        message.error(data.message || 'Failed to save role')
      }
    } catch (error) {
      console.error('Error saving role:', error)
      message.error('Failed to save role')
    }
  }

  const handleEdit = (role) => {
    setEditingRole(role)
    form.setFieldsValue({ name: role.name })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        message.success('Role deleted successfully')
        fetchRoles()
      } else {
        message.error(data.message || 'Failed to delete role')
      }
    } catch (error) {
      message.error('Failed to delete role')
    }
  }

  const handleAdd = () => {
    setEditingRole(null)
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
            title="Delete this role?"
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
          Add Role
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
      />
      <Modal
        title={editingRole ? 'Edit Role' : 'Add Role'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingRole(null)
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="e.g., Employee" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRole ? 'Update' : 'Create'}
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

export default RolesTab
