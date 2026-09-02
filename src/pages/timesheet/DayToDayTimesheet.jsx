import React from 'react'
import { Card, Table, Tag } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const DayToDayTimesheet = () => {
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
      render: (status) => <Tag color="blue">{status}</Tag>,
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Day-to-Day Timesheet</h1>
          <p className="page-description">Daily timesheet entries</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DayToDayTimesheet
