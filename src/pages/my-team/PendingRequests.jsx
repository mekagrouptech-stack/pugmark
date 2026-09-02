import React, { useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchPendingRequests,
  approveRequest,
  rejectRequest,
} from '../../features/myTeam/myTeamSlice'

const { TextArea } = Input

const PendingRequests = () => {
  const dispatch = useDispatch()
  const { pendingRequests, loading } = useSelector((state) => state.myTeam)
  const [rejectModalVisible, setRejectModalVisible] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')

  useEffect(() => {
    dispatch(fetchPendingRequests('leave'))
  }, [dispatch])

  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequest({ type: 'leave', requestId })).unwrap()
      message.success('Leave request approved successfully!')
      dispatch(fetchPendingRequests('leave'))
    } catch (error) {
      message.error('Failed to approve request')
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
        rejectRequest({ type: 'leave', requestId: selectedRequest.id, reason: rejectReason })
      ).unwrap()
      message.success('Request rejected successfully!')
      setRejectModalVisible(false)
      setRejectReason('')
      setSelectedRequest(null)
      dispatch(fetchPendingRequests('leave'))
    } catch (error) {
      message.error('Failed to reject request')
    }
  }

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
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
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="orange">{status}</Tag>,
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
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            size="small"
            onClick={() => handleReject(record)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card className="card-container">
        <Table
          columns={columns}
          dataSource={pendingRequests.leave}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} pending requests`,
          }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div>No pending leave requests</div>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="Reject Leave Request"
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
          <strong>Employee:</strong> {selectedRequest?.employeeName}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Leave Type:</strong> {selectedRequest?.leaveType}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Duration:</strong> {selectedRequest?.startDate} to {selectedRequest?.endDate} ({selectedRequest?.days} days)
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
    </>
  )
}

export default PendingRequests
