import React from 'react'
import { Card, Table, Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'

const EmployeeCodeSeries = () => {
  const data = [
    {
      key: '1',
      prefix: 'EMP',
      startNumber: 1,
      currentNumber: 150,
      status: 'Active',
    },
  ]

  const columns = [
    { title: 'Prefix', dataIndex: 'prefix', key: 'prefix' },
    { title: 'Start Number', dataIndex: 'startNumber', key: 'startNumber' },
    { title: 'Current Number', dataIndex: 'currentNumber', key: 'currentNumber' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link">Edit</Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Employee Code Series</h1>
          <p className="page-description">Manage employee code series</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Series
            </Button>
          </Space>

          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default EmployeeCodeSeries
