import React from 'react'
import { Card, Table, Tag } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const TeamTimesheet = () => {
  // Timesheet data is not wired to an API yet; render an empty list instead of
  // placeholder rows.
  const data = []

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Client', dataIndex: 'client', key: 'client' },
    { title: 'Project', dataIndex: 'project', key: 'project' },
    { title: 'Hours', dataIndex: 'hours', key: 'hours' },
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
          <h1 className="page-title">My Team's Timesheet</h1>
          <p className="page-description">View timesheet entries of your team members</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TeamTimesheet
