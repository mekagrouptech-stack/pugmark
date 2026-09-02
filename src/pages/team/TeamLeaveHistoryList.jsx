import React from 'react'
import { Card, Table, Tag } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const TeamLeaveHistoryList = () => {
  const data = [
    {
      key: '1',
      employee: 'John Doe',
      type: 'Sick Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      days: 3,
      status: 'Approved',
    },
  ]

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Leave Type', dataIndex: 'type', key: 'type' },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', render: (text) => formatDate(text) },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate', render: (text) => formatDate(text) },
    { title: 'Days', dataIndex: 'days', key: 'days' },
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
          <h1 className="page-title">Team Leave History</h1>
          <p className="page-description">Complete leave history of team members</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TeamLeaveHistoryList
