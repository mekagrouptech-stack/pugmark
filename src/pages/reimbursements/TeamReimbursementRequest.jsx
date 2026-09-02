import React, { useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Input as AntInput, message } from 'antd'
import { SearchOutlined, CheckOutlined, CloseOutlined, UserSwitchOutlined, DownloadOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTeamReimbursements,
  approveReimbursement,
  rejectReimbursement,
  delegateReimbursement,
} from '../../features/reimbursement/reimbursementSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { Search, TextArea } = Input

const TeamReimbursementRequest = () => {
  const dispatch = useDispatch()
  const { teamRequests, loading } = useSelector((state) => state.reimbursement)
  const [searchText, setSearchText] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [rejectModalVisible, setRejectModalVisible] = React.useState(false)
  const [delegateModalVisible, setDelegateModalVisible] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [delegateTo, setDelegateTo] = React.useState('')

  useEffect(() => {
    dispatch(fetchTeamReimbursements())
  }, [dispatch])

  const handleApprove = async (id) => {
    try {
      await dispatch(approveReimbursement({ id, type: 'team' })).unwrap()
      message.success('Reimbursement approved successfully!')
      dispatch(fetchTeamReimbursements())
    } catch (error) {
      message.error('Failed to approve reimbursement')
    }
  }

  const handleReject = (request) => {
    setSelectedRequest(request)
    setRejectModalVisible(true)
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection')
      return
    }
    try {
      await dispatch(
        rejectReimbursement({ id: selectedRequest.id, type: 'team', reason: rejectReason })
      ).unwrap()
      message.success('Reimbursement rejected successfully!')
      setRejectModalVisible(false)
      setRejectReason('')
      setSelectedRequest(null)
      dispatch(fetchTeamReimbursements())
    } catch (error) {
      message.error('Failed to reject reimbursement')
    }
  }

  const handleDelegate = (request) => {
    setSelectedRequest(request)
    setDelegateModalVisible(true)
  }

  const confirmDelegate = async () => {
    if (!delegateTo.trim()) {
      message.warning('Please enter delegate name')
      return
    }
    try {
      await dispatch(delegateReimbursement({ id: selectedRequest.id, delegateTo })).unwrap()
      message.success('Reimbursement delegated successfully!')
      setDelegateModalVisible(false)
      setDelegateTo('')
      setSelectedRequest(null)
      dispatch(fetchTeamReimbursements())
    } catch (error) {
      message.error('Failed to delegate reimbursement')
    }
  }

  const handleExport = () => {
    message.success('Export functionality will be implemented')
  }

  const filteredData = teamRequests.filter((item) => {
    const matchesSearch =
      !searchText ||
      item.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.employeeCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.requestType?.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      title: 'No',
      key: 'no',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: 'Request Type',
      dataIndex: 'requestType',
      key: 'requestType',
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div>{record.userName}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeCode}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          Approved: 'green',
          Pending: 'orange',
          Rejected: 'red',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: 'Created On',
      dataIndex: 'createdOn',
      key: 'createdOn',
    },
    {
      title: 'Approver',
      dataIndex: 'approver',
      key: 'approver',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            onClick={() => handleApprove(record.id)}
            disabled={record.status !== 'Pending'}
          >
            Accept
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            size="small"
            onClick={() => handleReject(record)}
            disabled={record.status !== 'Pending'}
          >
            Reject
          </Button>
          <Button
            icon={<UserSwitchOutlined />}
            size="small"
            onClick={() => handleDelegate(record)}
            disabled={record.status !== 'Pending'}
          >
            Delegate
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Team Reimbursement Request</h1>
          <p className="page-description">Review and approve reimbursement requests from your team</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space>
              <Search
                placeholder="Search by user, code, or type"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 300 }}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={setSearchText}
              />
              <Select
                placeholder="Filter by status"
                style={{ width: 150 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Approved">Approved</Select.Option>
                <Select.Option value="Rejected">Rejected</Select.Option>
              </Select>
            </Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} requests`,
            }}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <div>No team reimbursement requests found</div>
                </div>
              ),
            }}
          />
        </Card>

        <Modal
          title="Reject Reimbursement"
          open={rejectModalVisible}
          onOk={confirmReject}
          onCancel={() => {
            setRejectModalVisible(false)
            setRejectReason('')
            setSelectedRequest(null)
          }}
          okText="Confirm Reject"
          cancelText="Cancel"
        >
          <div style={{ marginBottom: 16 }}>
            <strong>User:</strong> {selectedRequest?.userName}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Request Type:</strong> {selectedRequest?.requestType}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Reason for Rejection:</strong>
          </div>
          <TextArea
            rows={4}
            placeholder="Enter reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Modal>

        <Modal
          title="Delegate Reimbursement"
          open={delegateModalVisible}
          onOk={confirmDelegate}
          onCancel={() => {
            setDelegateModalVisible(false)
            setDelegateTo('')
            setSelectedRequest(null)
          }}
          okText="Delegate"
          cancelText="Cancel"
        >
          <div style={{ marginBottom: 16 }}>
            <strong>User:</strong> {selectedRequest?.userName}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Request Type:</strong> {selectedRequest?.requestType}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Delegate To:</strong>
          </div>
          <Input
            placeholder="Enter delegate name or email"
            value={delegateTo}
            onChange={(e) => setDelegateTo(e.target.value)}
          />
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default TeamReimbursementRequest
