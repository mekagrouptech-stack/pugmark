import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Space, message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { fetchClients, createClient } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const ClientManager = () => {
  const dispatch = useDispatch()
  const { clients, loading } = useSelector((state) => state.dar)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchClients())
  }, [dispatch])

  const columns = [
    {
      title: 'Client Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ]

  const handleCreateClient = () => {
    form
      .validateFields()
      .then((values) => {
        dispatch(
          createClient({
            name: values.name,
            contactName: values.contactName,
            email: values.email,
            phone: values.phone,
            description: values.description,
          })
        )
          .unwrap()
          .then(() => {
            message.success('Client created successfully')
            setModalOpen(false)
            form.resetFields()
          })
          .catch((err) => {
            message.error(err || 'Failed to create client')
          })
      })
      .catch(() => {})
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Client</h1>
          <p className="page-description">Manage clients for daily activity and timesheet.</p>
        </div>

        <Card
          className="card-container"
          extra={
            <Button type="primary" onClick={() => setModalOpen(true)}>
              + Create Client
            </Button>
          }
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={clients}
            loading={loading}
            pagination={false}
          />
        </Card>

        <Modal
          title="Create Client"
          open={modalOpen}
          onOk={handleCreateClient}
          onCancel={() => {
            setModalOpen(false)
            form.resetFields()
          }}
          okText="Create"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Client Name"
              name="name"
              rules={[{ required: true, message: 'Please enter client name' }]}
            >
              <Input placeholder="Enter client name" />
            </Form.Item>
            <Form.Item label="Contact Person" name="contactName">
              <Input placeholder="Enter contact person" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input type="email" placeholder="Enter email" />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Enter phone number" />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} placeholder="Enter description (optional)" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ClientManager

