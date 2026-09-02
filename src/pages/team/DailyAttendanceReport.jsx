import React from 'react'
import { Card, Table, Tag, DatePicker, Button, Space } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const DailyAttendanceReport = () => {
  const data = [
    {
      key: '1',
      employee: 'John Doe',
      date: '2024-01-15',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      status: 'Present',
    },
  ]

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (text) => formatDate(text) },
    { title: 'Check In', dataIndex: 'checkIn', key: 'checkIn' },
    { title: 'Check Out', dataIndex: 'checkOut', key: 'checkOut' },
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
          <h1 className="page-title">Daily Attendance Report</h1>
          <p className="page-description">Daily attendance summary for your team</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <DatePicker />
            <Button>Generate Report</Button>
          </Space>

          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DailyAttendanceReport
