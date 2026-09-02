import React from 'react'
import { Card, Table, Tag, Button } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const IncompleteTimesheet = () => {
  // Timesheet data is not wired to an API yet; render an empty list instead of
  // placeholder rows.
  const data = []

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Client', dataIndex: 'client', key: 'client' },
    { title: 'Project', dataIndex: 'project', key: 'project' },
    { title: 'Hours', dataIndex: 'hours', key: 'hours' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="orange">{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => <Button type="link">Complete</Button>,
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Incomplete Timesheet</h1>
          <p className="page-description">Timesheet entries that need completion</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default IncompleteTimesheet
