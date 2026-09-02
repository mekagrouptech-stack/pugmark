import React from 'react'
import { Card, Table, Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'

const DesignationMaster = () => {
  const data = [
    {
      key: '1',
      designation: 'Software Engineer',
      department: 'Engineering',
      status: 'Active',
    },
  ]

  const columns = [
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link">Edit</Button>
          <Button type="link" danger>Delete</Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Designation Master</h1>
          <p className="page-description">Manage designations</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Designation
            </Button>
          </Space>

          <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DesignationMaster
