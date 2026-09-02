import React from 'react'
import { Card, Table, Tag } from 'antd'
import DashboardLayout from '../../layouts/DashboardLayout'

const InvestmentDeclarations = () => {
  const data = [
    {
      key: '1',
      section: '80C',
      description: 'Life Insurance Premium',
      amount: 50000,
      status: 'Submitted',
    },
  ]

  const columns = [
    { title: 'Section', dataIndex: 'section', key: 'section' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹${amount}`,
    },
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
          <h1 className="page-title">Investment Declarations</h1>
          <p className="page-description">Manage your tax investment declarations</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default InvestmentDeclarations
