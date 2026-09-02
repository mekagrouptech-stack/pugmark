import React, { useEffect, useMemo } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Input, message, Row, Col, Statistic, Avatar, Tooltip } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBiometricRequests, approveRequest, rejectRequest } from '../../features/myTeam/myTeamSlice'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'

const { TextArea } = Input
const { Search } = Input

const BiometricRequests = () => {
  const dispatch = useDispatch()
  const { biometricRequests, loading } = useSelector((state) => state.myTeam)
  const [rejectModalVisible, setRejectModalVisible] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [searchText, setSearchText] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  useEffect(() => {
    dispatch(fetchBiometricRequests())
  }, [dispatch])

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = biometricRequests.length
    const pending = biometricRequests.filter((req) => req.status === 'Pending').length
    const approved = biometricRequests.filter((req) => req.status === 'Approved').length
    const rejected = biometricRequests.filter((req) => req.status === 'Rejected').length
    return { total, pending, approved, rejected }
  }, [biometricRequests])

  // Filter data based on search and status
  const filteredData = useMemo(() => {
    let filtered = biometricRequests

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter)
    }

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(
        (req) =>
          req.employeeName?.toLowerCase().includes(searchLower) ||
          req.employeeCode?.toLowerCase().includes(searchLower) ||
          req.reason?.toLowerCase().includes(searchLower) ||
          req.punchType?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [biometricRequests, searchText, statusFilter])

  const handleRefresh = () => {
    dispatch(fetchBiometricRequests())
  }

  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequest({ type: 'biometric', requestId })).unwrap()
      message.success('Biometric request approved successfully!')
      dispatch(fetchBiometricRequests())
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
        rejectRequest({ type: 'biometric', requestId: selectedRequest.id, reason: rejectReason })
      ).unwrap()
      message.success('Request rejected successfully!')
      setRejectModalVisible(false)
      setRejectReason('')
      setSelectedRequest(null)
      dispatch(fetchBiometricRequests())
    } catch (error) {
      message.error('Failed to reject request')
    }
  }

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{record.employeeName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeCode}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => formatDate(date),
      sorter: (a, b) => {
        if (!a.date || !b.date) return 0
        return dayjs(a.date).unix() - dayjs(b.date).unix()
      },
    },
    {
      title: 'Punch Type',
      dataIndex: 'punchType',
      key: 'punchType',
      width: 130,
      render: (type) => (
        <Tag color={type === 'Check In' ? 'blue' : 'purple'} icon={<ClockCircleOutlined />}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: 110,
      render: (time) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{time || '-'}</span>
        </Space>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip title={text || 'No reason provided'}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FileTextOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text || 'No reason provided'}
            </span>
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Requested Date',
      dataIndex: 'requestedDate',
      key: 'requestedDate',
      width: 140,
      render: (date) => formatDate(date),
      sorter: (a, b) => {
        if (!a.requestedDate || !b.requestedDate) return 0
        return dayjs(a.requestedDate).unix() - dayjs(b.requestedDate).unix()
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const statusConfig = {
          Pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          Approved: { color: 'green', icon: <CheckCircleOutlined /> },
          Rejected: { color: 'red', icon: <CloseCircleOutlined /> },
        }
        const config = statusConfig[status] || { color: 'default', icon: null }
        return (
          <Tag color={config.color} icon={config.icon} style={{ padding: '4px 12px', fontSize: 12 }}>
            {status}
          </Tag>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        if (record.status !== 'Pending') {
          return <span style={{ color: '#8c8c8c', fontSize: 12 }}>No action available</span>
        }
        return (
          <Space size="small">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleApprove(record.id)}
              style={{ borderRadius: 4 }}
            >
              Approve
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={() => handleReject(record)}
              style={{ borderRadius: 4 }}
            >
              Reject
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={statistics.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={statistics.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved"
              value={statistics.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={statistics.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        className="card-container"
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>Virtual Biometric Requests</span>
          </div>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            style={{ borderRadius: 4 }}
          >
            Refresh
          </Button>
        }
      >
        {/* Search and Filter Bar */}
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Search
            placeholder="Search by employee name, code, reason, or punch type"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 400, maxWidth: '100%' }}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            value={searchText}
          />
          <Space>
            <Button
              type={statusFilter === 'all' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('all')}
              style={{ borderRadius: 4 }}
            >
              All ({statistics.total})
            </Button>
            <Button
              type={statusFilter === 'Pending' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('Pending')}
              style={{ borderRadius: 4 }}
            >
              Pending ({statistics.pending})
            </Button>
            <Button
              type={statusFilter === 'Approved' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('Approved')}
              style={{ borderRadius: 4 }}
            >
              Approved ({statistics.approved})
            </Button>
            <Button
              type={statusFilter === 'Rejected' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('Rejected')}
              style={{ borderRadius: 4 }}
            >
              Rejected ({statistics.rejected})
            </Button>
          </Space>
        </Space>

        {/* Table */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} requests`,
              responsive: true,
              style: { marginTop: 16 },
            }}
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <div style={{ color: '#8c8c8c', fontSize: 14 }}>No biometric requests found</div>
                </div>
              ),
            }}
            style={{
              minWidth: '100%',
            }}
            rowClassName={(record) => (record.status === 'Pending' ? 'pending-row' : '')}
          />
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <span>Reject Biometric Request</span>
          </div>
        }
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false)
          setRejectReason('')
          setSelectedRequest(null)
        }}
        okText="Confirm Reject"
        cancelText="Cancel"
        okButtonProps={{ danger: true, style: { borderRadius: 4 } }}
        cancelButtonProps={{ style: { borderRadius: 4 } }}
        width={600}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#595959' }}>Employee:</strong>{' '}
              <span style={{ fontSize: 15, fontWeight: 500 }}>{selectedRequest?.employeeName}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#595959' }}>Employee Code:</strong>{' '}
              <span>{selectedRequest?.employeeCode}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#595959' }}>Punch Type:</strong>{' '}
              <Tag color="blue">{selectedRequest?.punchType}</Tag>
            </div>
            <div>
              <strong style={{ color: '#595959' }}>Requested Time:</strong>{' '}
              <span style={{ fontWeight: 500 }}>{selectedRequest?.time}</span>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Reason for Rejection:</strong>
            <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
          </div>
          <TextArea
            rows={4}
            placeholder="Please provide a reason for rejecting this request..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ borderRadius: 4 }}
          />
        </div>
      </Modal>

      <style>{`
        .pending-row {
          background-color: #fffbe6;
        }
        .pending-row:hover {
          background-color: #fff7d9 !important;
        }
      `}</style>
    </>
  )
}

export default BiometricRequests
