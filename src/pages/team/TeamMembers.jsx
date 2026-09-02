import React from 'react'
import { Card, Table, Tag, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'

const TeamMembers = () => {
  const data = [
    {
      key: '1',
      name: 'John Doe',
      email: 'john@example.com',
      designation: 'Software Engineer',
      department: 'Engineering',
      status: 'Active',
    },
    {
      key: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      designation: 'Senior Engineer',
      department: 'Engineering',
      status: 'Active',
    },
  ]

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
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
          <h1 className="page-title">My Team Members</h1>
          <p className="page-description">View your team members</p>
        </div>

        <Card className="card-container">
          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TeamMembers
