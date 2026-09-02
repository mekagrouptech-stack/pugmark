import React, { useEffect } from 'react'
import { Card, Table, Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchClients } from '../../features/timesheet/timesheetSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const Client = () => {
  const dispatch = useDispatch()
  const { clients, loading } = useSelector((state) => state.timesheet)

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
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link">Edit</Button>
          <Button type="link" danger>Delete</Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Clients</h1>
          <p className="page-description">Manage client information</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Client
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={clients}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Client
