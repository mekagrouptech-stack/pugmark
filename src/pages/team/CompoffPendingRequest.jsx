import React from 'react'
import { Card, Table, Tag, Button, Space } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const CompoffPendingRequest = () => {
  const data = [
    {
      key: '1',
      employee: 'John Doe',
      workDate: '2024-01-14',
      reason: 'Worked on holiday',
      status: 'Pending',
    },
  ]

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Work Date', dataIndex: 'workDate', key: 'workDate', render: (text) => formatDate(text) },
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
          <h1 className="page-title">Compoff Pending Request</h1>
          <p className="page-description">Review compensatory off requests from team</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default CompoffPendingRequest
