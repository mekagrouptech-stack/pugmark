import React from 'react'
import { Card, Table, Tag, Button, Space } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const TeamPendingRequest = () => {
  const data = [
    {
      key: '1',
      employee: 'John Doe',
      type: 'Sick Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      days: 3,
      status: 'Pending',
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
      render: (status) => <Tag color="orange">{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link">Approve</Button>
          <Button type="link" danger>Reject</Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Team Pending Request</h1>
          <p className="page-description">Review pending leave requests from team</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TeamPendingRequest
