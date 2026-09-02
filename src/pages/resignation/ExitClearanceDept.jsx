import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Switch, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
} from '../../features/resignation/exitClearanceSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const ExitClearanceDept = () => {
  const dispatch = useDispatch()
  const { departments, loading } = useSelector((state) => state.exitClearance)
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDept, setEditingDept] = useState(null)

  useEffect(() => {
    dispatch(fetchDepartments())
  }, [dispatch])

  const handleAdd = () => {
    setEditingDept(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingDept(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleToggleStatus = async (id, enabled) => {
    try {
      await dispatch(toggleDepartmentStatus({ id, enabled: !enabled })).unwrap()
      message.success(`Department ${enabled ? 'disabled' : 'enabled'} successfully!`)
      dispatch(fetchDepartments())
    } catch (error) {
      message.error('Failed to toggle department status')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingDept) {
        await dispatch(updateDepartment({ id: editingDept.id, data: values })).unwrap()
        message.success('Department updated successfully!')
      } else {
        await dispatch(createDepartment(values)).unwrap()
        message.success('Department created successfully!')
      }
      setModalVisible(false)
      form.resetFields()
      setEditingDept(null)
      dispatch(fetchDepartments())
    } catch (error) {
      message.error('Failed to save department')
    }
  }

  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
    setEditingDept(null)
  }

  const columns = [
    {
      title: 'Department Name',
      dataIndex: 'departmentName',
      key: 'departmentName',
    },
    {
      title: 'Clearance Stakeholder',
      dataIndex: 'clearanceStakeholder',
      key: 'clearanceStakeholder',
    },
    {
      title: 'Created On',
      dataIndex: 'createdOn',
      key: 'createdOn',
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? 'Enabled' : 'Disabled'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Switch
            checked={record.enabled}
            onChange={(checked) => handleToggleStatus(record.id, record.enabled)}
            checkedChildren={<CheckOutlined />}
            unCheckedChildren={<CloseOutlined />}
          />
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Exit Clearance Department</h1>
          <p className="page-description">Manage exit clearance departments and stakeholders</p>
        </div>

        <Card
          className="card-container"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Department
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={departments}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} departments`,
            }}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <div>No departments found</div>
                </div>
              ),
            }}
          />
        </Card>

        <Modal
          title={editingDept ? 'Edit Department' : 'Add Department'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          okText={editingDept ? 'Update' : 'Create'}
          cancelText="Cancel"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="departmentName"
              label="Department Name"
              rules={[{ required: true, message: 'Please enter department name!' }]}
            >
              <Input placeholder="Enter department name" />
            </Form.Item>
            <Form.Item
              name="clearanceStakeholder"
              label="Clearance Stakeholder"
              rules={[{ required: true, message: 'Please enter clearance stakeholder!' }]}
            >
              <Input placeholder="Enter clearance stakeholder name" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ExitClearanceDept
