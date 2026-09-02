import React from 'react'
import { Card, Table, Tag, Button, Space } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const PendingUserRequests = () => {
  // Not backed by an API yet; render an empty list instead of a placeholder row.
  const data = []

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Request Type', dataIndex: 'requestType', key: 'requestType' },
    { title: 'Submitted Date', dataIndex: 'submittedDate', key: 'submittedDate', render: (text) => formatDate(text) },
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
          <Button type="link">View</Button>
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
          <h1 className="page-title">List Pending User Requests</h1>
          <p className="page-description">Review and process pending user requests</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default PendingUserRequests
