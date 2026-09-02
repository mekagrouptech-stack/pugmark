import React from 'react'
import { Card, Table, Tag } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const Workflows = () => {
  // Workflows are not backed by an API yet; render an empty list instead of a
  // placeholder row.
  const data = []

  const columns = [
    { title: 'Workflow', dataIndex: 'workflow', key: 'workflow' },
    { title: 'Created Date', dataIndex: 'createdDate', key: 'createdDate' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="green">{status}</Tag>,
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">List Workflows</h1>
          <p className="page-description">View and manage workflows</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Workflows
