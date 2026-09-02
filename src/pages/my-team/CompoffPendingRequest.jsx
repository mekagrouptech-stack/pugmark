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

const CompoffPendingRequest = () => {
  const dispatch = useDispatch()
  const { pendingRequests, loading } = useSelector((state) => state.myTeam)
  const [rejectModalVisible, setRejectModalVisible] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')

  useEffect(() => {
    dispatch(fetchPendingRequests('compoff'))
  }, [dispatch])

  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequest({ type: 'compoff', requestId })).unwrap()
      message.success('Compensatory off request approved successfully!')
      dispatch(fetchPendingRequests('compoff'))
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
        rejectRequest({ type: 'compoff', requestId: selectedRequest.id, reason: rejectReason })
      ).unwrap()
      message.success('Request rejected successfully!')
      setRejectModalVisible(false)
      setRejectReason('')
      setSelectedRequest(null)
      dispatch(fetchPendingRequests('compoff'))
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
      title: 'Work Date',
      dataIndex: 'workDate',
      key: 'workDate',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
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
      // Comp-off follows the two-step leave flow, so show which approval the
      // request is actually waiting on rather than the raw enum.
      render: (status) => {
        const statusMap = {
          Pending_Manager: { color: 'orange', label: 'Pending (Reporting Person)' },
          Pending: { color: 'orange', label: 'Pending (Reporting Person)' },
          Pending_HR: { color: 'blue', label: 'Pending (Head HR)' },
        }
        const { color, label } = statusMap[status] || { color: 'orange', label: status }
        return <Tag color={color}>{label}</Tag>
      },
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
          dataSource={pendingRequests.compoff}
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
                <div>No pending compensatory off requests</div>
              </div>
            ),
          }}
        />
      </Card>

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
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Employee:</strong> {selectedRequest?.employeeName}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Work Date:</strong> {selectedRequest?.workDate}
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

export default CompoffPendingRequest
