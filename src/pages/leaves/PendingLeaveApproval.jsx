import React, { useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchPendingApprovalLeaves,
  approveLeave,
  rejectLeave,
} from '../../features/leave/leaveSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { TextArea } = Input

const PendingLeaveApproval = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { pendingApprovalLeaves, loading } = useSelector((state) => state.leave)
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false)
  const [selectedLeave, setSelectedLeave] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')

  useEffect(() => {
    dispatch(fetchPendingApprovalLeaves())
  }, [dispatch])

  const handleApprove = async (id) => {
    try {
      await dispatch(approveLeave(id)).unwrap()
      message.success('Leave approved successfully')
      dispatch(fetchPendingApprovalLeaves())
    } catch (err) {
      message.error(err || 'Failed to approve leave')
    }
  }

  const openRejectModal = (record) => {
    setSelectedLeave(record)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleReject = async () => {
    if (!selectedLeave) return
    try {
      await dispatch(rejectLeave({ id: selectedLeave.id, reason: rejectReason })).unwrap()
      message.success('Leave rejected')
      setRejectModalOpen(false)
      setSelectedLeave(null)
      setRejectReason('')
      dispatch(fetchPendingApprovalLeaves())
    } catch (err) {
      message.error(err || 'Failed to reject leave')
    }
  }

  // Both approvals compulsory: 1) Reporting Person first, 2) Head HR second
  const canApproveLeave = (record) => {
    if (!user) return false
    const role = String(user.role || '').toUpperCase()
    const roleNorm = role.replace(/\s+/g, '_')
    const uid = Number(user.id) || user.id
    const isAdminOrHeadHR = ['ADMIN', 'HEAD_HR', 'HEADHR', 'HR', 'SYSTEM_ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(roleNorm) ||
      role.includes('ADMIN') || role.includes('HEAD') || role.includes('HR')
    // Use == for ID comparison (handles number vs string from API)
    if (record.status === 'Pending_Manager' || record.status === 'Pending') {
      return record.reportingManagerId == uid || record.reportingManagerId === user.id
    }
    if (record.status === 'Pending_HR') {
      return record.hrHeadId == uid || record.hrHeadId === user.id || isAdminOrHeadHR
    }
    return false
  }

  const columns = [
    { title: 'Employee', key: 'employee', render: (_, r) => [r.userName, r.userEmployeeCode ? `(${r.userEmployeeCode})` : ''].filter(Boolean).join(' ') || '—' },
    { title: 'Leave Type', dataIndex: 'type', key: 'type' },
    { title: 'Start', dataIndex: 'startDate', key: 'startDate' },
    { title: 'End', dataIndex: 'endDate', key: 'endDate' },
    { title: 'Days', dataIndex: 'days', key: 'days', width: 70 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const statusMap = {
          Pending_Manager: { color: 'orange', label: 'Pending (Reporting Person)' },
          Pending_HR: { color: 'blue', label: 'Pending (Head HR)' },
          Pending: { color: 'orange', label: 'Pending' },
          Approved: { color: 'green', label: 'Approved' },
          Rejected: { color: 'red', label: 'Rejected' },
        }
        const cfg = statusMap[s] || { color: 'default', label: s }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 220,
      render: (_, record) => {
        if (!['Pending_Manager', 'Pending_HR', 'Pending'].includes(record.status)) return null
        if (canApproveLeave(record)) {
          return (
            <Space>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>
                Approve
              </Button>
              <Button danger size="small" icon={<CloseOutlined />} onClick={() => openRejectModal(record)}>
                Reject
              </Button>
            </Space>
          )
        }
        return (
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>
            {record.status === 'Pending_Manager' ? 'Awaiting Reporting Person' : 'Awaiting Head HR'}
          </span>
        )
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Pending Leave Approval</h1>
          <p className="page-description">
            Two-step approval: 1) Reporting Person (Manager) approves first, then 2) Head HR gives final approval. Both approvals are compulsory.
          </p>
        </div>
        <Card className="card-container">
          <Table
            columns={columns}
            dataSource={pendingApprovalLeaves || []}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <div style={{ padding: 24, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
                  <p style={{ marginBottom: 12, fontSize: 15, fontWeight: 500 }}>No pending leaves to approve</p>
                  <p style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                    To see leaves here:
                  </p>
                  <ol style={{ textAlign: 'left', color: '#595959', fontSize: 13, lineHeight: 1.8, paddingLeft: 24 }}>
                    <li>Go to <strong>User Management</strong> and set yourself as <strong>Reporting Person</strong> (Report To) for the employee.</li>
                    <li>Log in as that employee and apply for leave via <strong>Apply for Leave</strong>.</li>
                    <li>Return here — the leave will appear for your approval.</li>
                  </ol>
                  <p style={{ color: '#8c8c8c', fontSize: 12, marginTop: 12 }}>
                    Admin/Head HR see all pending leaves. If you are Admin and still see nothing, no leaves have been applied yet.
                  </p>
                  {['ADMIN', 'HEAD_HR', 'HR'].includes(String(user?.role || '').toUpperCase()) && (
                    <Button
                      type="link"
                      icon={<UserOutlined />}
                      onClick={() => navigate('/admin/users')}
                      style={{ marginTop: 16 }}
                    >
                      Go to User Management to assign Reporting Person
                    </Button>
                  )}
                </div>
              ),
            }}
          />
        </Card>
      </div>
      <Modal
        title="Reject Leave"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setSelectedLeave(null); setRejectReason('') }}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <p>Please provide a reason for rejection (optional but recommended).</p>
        <TextArea
          rows={3}
          placeholder="Rejection reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </DashboardLayout>
  )
}

export default PendingLeaveApproval
