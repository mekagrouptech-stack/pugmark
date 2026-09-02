import React, { useEffect } from 'react'
import { Card, Table, Tag, DatePicker, Input, Space, Button, Modal, message } from 'antd'
import { SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTeamLeavesForManager,
  approveLeave,
  rejectLeave,
} from '../../features/leave/leaveSlice'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Search } = Input
const { TextArea } = Input

const TeamLeaveHistory = () => {
  const dispatch = useDispatch()
  const { teamLeavesForManager, loading } = useSelector((state) => state.leave)
  const [dateRange, setDateRange] = React.useState(null)
  const [searchText, setSearchText] = React.useState('')
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false)
  const [selectedLeave, setSelectedLeave] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')

  useEffect(() => {
    dispatch(fetchTeamLeavesForManager())
  }, [dispatch])

  const filteredData = (teamLeavesForManager || []).filter((item) => {
    const name = item.userName || ''
    const code = item.userEmployeeCode || ''
    const matchesSearch =
      !searchText ||
      name.toLowerCase().includes(searchText.toLowerCase()) ||
      code.toLowerCase().includes(searchText.toLowerCase())
    const matchesDateRange =
      !dateRange ||
      !dateRange[0] ||
      !dateRange[1] ||
      (item.startDate &&
        !dayjs(item.startDate).isBefore(dateRange[0], 'day') &&
        !dayjs(item.startDate).isAfter(dateRange[1], 'day'))
    return matchesSearch && matchesDateRange
  })

  const handleApprove = async (id) => {
    try {
      await dispatch(approveLeave(id)).unwrap()
      message.success('Leave approved successfully')
      dispatch(fetchTeamLeavesForManager())
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
      dispatch(fetchTeamLeavesForManager())
    } catch (err) {
      message.error(err || 'Failed to reject leave')
    }
  }

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'userName',
      key: 'employeeName',
      render: (val) => val || '—',
    },
    {
      title: 'Employee Code',
      dataIndex: 'userEmployeeCode',
      key: 'employeeCode',
      render: (val) => val || '—',
    },
    {
      title: 'Leave Type',
      dataIndex: 'type',
      key: 'leaveType',
      render: (val) => val || '—',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a, b) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
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
      width: 70,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (val) => val || '—',
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
      render: (status) => {
        const colorMap = {
          Approved: 'green',
          Pending: 'orange',
          Rejected: 'red',
          Cancelled: 'default',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 160,
      render: (_, record) =>
        record.status === 'Pending' ? (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
            >
              Approve
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => openRejectModal(record)}
            >
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <>
      <Card className="card-container">
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <RangePicker onChange={setDateRange} format="DD/MM/YYYY" />
          <Search
            placeholder="Search employee"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={setSearchText}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} leave records`,
          }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div>No leave history found. Leaves from your reportees will appear here.</div>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="Reject Leave"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false)
          setSelectedLeave(null)
          setRejectReason('')
        }}
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
    </>
  )
}

export default TeamLeaveHistory
