import React, { useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchPendingRequests,
  approveRequest,
  rejectRequest,
} from '../../features/myTeam/myTeamSlice'
import { formatDate } from '../../utils/attendanceTimeUtils'

const { TextArea } = Input

const AttendancePendingRequest = () => {
  const dispatch = useDispatch()
  const { pendingRequests, loading } = useSelector((state) => state.myTeam)
  const [rejectModalVisible, setRejectModalVisible] = React.useState(false)
  const [approveModalVisible, setApproveModalVisible] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [approvalNote, setApprovalNote] = React.useState('')
  const [approving, setApproving] = React.useState(false)

  useEffect(() => {
    dispatch(fetchPendingRequests('attendance'))
  }, [dispatch])

  const handleApprove = (request) => {
    setSelectedRequest(request)
    setApprovalNote('')
    setApproveModalVisible(true)
  }

  const closeApproveModal = () => {
    setApproveModalVisible(false)
    setApprovalNote('')
    setSelectedRequest(null)
  }

  // A note is mandatory — an attendance day may not be regularized without one.
  const confirmApprove = async () => {
    if (!approvalNote.trim()) {
      message.warning('Please add a note before regularizing this attendance')
      return
    }
    setApproving(true)
    try {
      await dispatch(
        approveRequest({ type: 'attendance', requestId: selectedRequest.id, note: approvalNote.trim() })
      ).unwrap()
      message.success('Request approved successfully!')
      closeApproveModal()
      dispatch(fetchPendingRequests('attendance'))
    } catch (error) {
      message.error(error || 'Failed to approve request')
    } finally {
      setApproving(false)
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
        rejectRequest({ type: 'attendance', requestId: selectedRequest.id, reason: rejectReason })
      ).unwrap()
      message.success('Request rejected successfully!')
      setRejectModalVisible(false)
      setRejectReason('')
      setSelectedRequest(null)
      dispatch(fetchPendingRequests('attendance'))
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => formatDate(text),
    },
    {
      title: 'Request Type',
      dataIndex: 'requestType',
      key: 'requestType',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (text) => text || '-',
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (text) => text || '-',
    },
    {
      title: 'Requested Date',
      dataIndex: 'requestedDate',
      key: 'requestedDate',
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
            onClick={() => handleApprove(record)}
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
      <Card
        className="card-container"
        title="Attendance regulation requests"
        extra={
          <span style={{ fontSize: 12, color: '#666' }}>
            Attendance regulation requests go directly to Head HR. Approving will count that day as attendance for the employee.
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={pendingRequests.attendance}
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
                <div>No pending attendance requests</div>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="Regularize Attendance"
        open={approveModalVisible}
        onOk={confirmApprove}
        onCancel={closeApproveModal}
        okText="Approve & Regularize"
        cancelText="Cancel"
        okButtonProps={{ loading: approving, disabled: !approvalNote.trim() }}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Employee:</strong> {selectedRequest?.employeeName}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Date:</strong> {selectedRequest ? formatDate(selectedRequest.date) : '-'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Request Type:</strong> {selectedRequest?.requestType}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Employee's Reason:</strong> {selectedRequest?.reason || '-'}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>
            Note <span style={{ color: '#ef4444' }}>*</span>
          </strong>
        </div>
        <TextArea
          rows={4}
          placeholder="Add a note explaining why this attendance is being regularized (required)"
          value={approvalNote}
          onChange={(e) => setApprovalNote(e.target.value)}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
          A note is mandatory. The request cannot be approved without it.
        </div>
      </Modal>

      <Modal
        title="Reject Request"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false)
          setRejectReason('')
          setSelectedRequest(null)
        }}
        okText="Confirm Reject"
        cancelText="Cancel"
        okButtonProps={{ disabled: !rejectReason.trim() }}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Employee:</strong> {selectedRequest?.employeeName}
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
    </>
  )
}

export default AttendancePendingRequest
