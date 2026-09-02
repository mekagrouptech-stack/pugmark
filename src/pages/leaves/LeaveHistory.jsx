import React, { useEffect } from 'react'
import { Card, Table, Tag } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaves } from '../../features/leave/leaveSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const LeaveHistory = () => {
  const dispatch = useDispatch()
  const { leaves, loading } = useSelector((state) => state.leave)

  useEffect(() => {
    dispatch(fetchLeaves())
  }, [dispatch])

  const columns = [
    {
      title: 'Leave Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          Approved: 'green',
          Pending: 'orange',
          Pending_Manager: 'orange',
          Pending_HR: 'blue',
          Rejected: 'red',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Leave History</h1>
          <p className="page-description">View all your leave requests</p>
        </div>

        <Card className="card-container">
          <Table
            columns={columns}
            dataSource={leaves}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default LeaveHistory
