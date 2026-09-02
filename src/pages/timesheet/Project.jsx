import React, { useEffect } from 'react'
import { Card, Table, Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects } from '../../features/timesheet/timesheetSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const Project = () => {
  const dispatch = useDispatch()
  const { projects, loading } = useSelector((state) => state.timesheet)

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Client',
      dataIndex: 'clientId',
      key: 'clientId',
      render: (id) => `Client ${id}`,
    },
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
          <h1 className="page-title">Projects</h1>
          <p className="page-description">Manage project information</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Project
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={projects}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Project
