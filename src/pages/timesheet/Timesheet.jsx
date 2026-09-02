import React, { useEffect } from 'react'
import { Card, Table, Tag, Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTimesheets } from '../../features/timesheet/timesheetSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const Timesheet = () => {
  const dispatch = useDispatch()
  const { timesheets, loading } = useSelector((state) => state.timesheet)

  useEffect(() => {
    dispatch(fetchTimesheets())
  }, [dispatch])

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
    },
    {
      title: 'Hours',
      dataIndex: 'hours',
      key: 'hours',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Approved' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link">Edit</Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Timesheet</h1>
          <p className="page-description">View and manage your timesheet entries</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Entry
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={timesheets}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Timesheet
