import React from 'react'
import { Card, Table, Tag, Button, Space } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const HoldSalaries = () => {
  // Salary holds are not backed by an API yet; render an empty list instead of
  // a placeholder row.
  const data = []

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="orange">{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link">Release</Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Hold Salaries</h1>
          <p className="page-description">Manage salary holds</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default HoldSalaries
