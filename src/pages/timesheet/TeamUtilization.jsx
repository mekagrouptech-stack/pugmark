import React from 'react'
import { Card, Table, Progress } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const TeamUtilization = () => {
  // Timesheet data is not wired to an API yet; render an empty list instead of
  // placeholder rows.
  const data = []

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Total Hours', dataIndex: 'totalHours', key: 'totalHours' },
    { title: 'Billable Hours', dataIndex: 'billableHours', key: 'billableHours' },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (utilization) => (
        <Progress percent={utilization} size="small" />
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Team Utilization</h1>
          <p className="page-description">Team member utilization statistics</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TeamUtilization
