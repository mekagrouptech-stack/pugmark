import React, { useEffect } from 'react'
import { Card, Table, Tag, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'
import { fetchTeamDarList } from '../../features/dar/darSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const PendingDarApproval = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { teamDarList, loading } = useSelector((state) => state.dar)

  useEffect(() => {
    dispatch(fetchTeamDarList({ status: 'Submitted' }))
  }, [dispatch])

  const pendingData = teamDarList.filter((d) => (d.status || '').toLowerCase() === 'submitted')

  const getStatusColor = (status) => {
    const colorMap = {
      Draft: 'default',
      Submitted: 'processing',
      Approved: 'success',
      Rejected: 'error',
    }
    return colorMap[status] || 'default'
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (h) => `${h} hrs`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/dar/view/${record.id}`)}
        >
          View & Approve
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Pending DAR Approvals</h1>
          <p className="page-description">
            Approve or reject daily activity reports submitted by your team members
          </p>
        </div>

        <Card className="card-container">
          <Table
            columns={columns}
            dataSource={pendingData}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: 'No DARs pending approval',
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default PendingDarApproval
