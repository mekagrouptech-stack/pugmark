import React from 'react'
import { Card, Table, Tag, Button, Space } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const VirtualBiometric = () => {
  const data = [
    {
      key: '1',
      employee: 'John Doe',
      date: '2024-01-15',
      punchType: 'Check In',
      time: '09:00 AM',
      reason: 'Forgot to punch',
      status: 'Pending',
    },
  ]

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (text) => formatDate(text) },
    { title: 'Punch Type', dataIndex: 'punchType', key: 'punchType' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
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
          <h1 className="page-title">Virtual Biometric Attendance Punches Request</h1>
          <p className="page-description">Review virtual biometric punch requests</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default VirtualBiometric
