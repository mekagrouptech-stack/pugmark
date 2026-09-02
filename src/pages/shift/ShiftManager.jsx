import React from 'react'
import { Card, Table, Tag } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const ShiftManager = () => {
  const data = [
    {
      key: '1',
      shift: 'Morning Shift',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      status: 'Active',
    },
  ]

  const columns = [
    { title: 'Shift', dataIndex: 'shift', key: 'shift' },
    { title: 'Start Time', dataIndex: 'startTime', key: 'startTime' },
    { title: 'End Time', dataIndex: 'endTime', key: 'endTime' },
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
          <h1 className="page-title">Shift Manager</h1>
          <p className="page-description">Manage work shifts</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ShiftManager
