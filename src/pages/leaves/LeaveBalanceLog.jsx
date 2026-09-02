import React from 'react'
import { Card, Table, Tag } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const LeaveBalanceLog = () => {
  // No ledger endpoint is exposed yet, so the log renders empty rather than
  // showing invented accrual/deduction rows.
  const logs = []

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => formatDate(text),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Accrual' ? 'green' : 'red'}>{type}</Tag>
      ),
    },
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      render: (days) => (
        <span style={{ color: days > 0 ? '#52c41a' : '#ff4d4f' }}>
          {days > 0 ? '+' : ''}{days}
        </span>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Leave Balance Log</h1>
          <p className="page-description">Transaction history of leave balance</p>
        </div>

        <Card className="card-container">
          <Table
            columns={columns}
            dataSource={logs}
            pagination={{ pageSize: 10 }}
            rowKey="key"
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default LeaveBalanceLog
