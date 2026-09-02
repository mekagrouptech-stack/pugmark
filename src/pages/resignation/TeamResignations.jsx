import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Descriptions, Upload, message } from 'antd'
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTeamResignations,
  approveResignation,
  rejectResignation,
} from '../../features/resignation/resignationSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { Search } = Input

const TeamResignations = () => {
  const dispatch = useDispatch()
  const { teamResignations, loading } = useSelector((state) => state.resignation)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [selectedResignation, setSelectedResignation] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    dispatch(fetchTeamResignations())
  }, [dispatch])

  const handleView = (record) => {
    setSelectedResignation(record)
    setViewModalVisible(true)
  }

  const handleApprove = async (id) => {
    try {
      await dispatch(approveResignation({ id })).unwrap()
      message.success('Resignation approved successfully!')
      dispatch(fetchTeamResignations())
    } catch (error) {
      message.error('Failed to approve resignation')
    }
  }

  const handleReject = (record) => {
    setSelectedResignation(record)
    setRejectModalVisible(true)
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection')
      return
    }
    try {
      await dispatch(rejectResignation({ id: selectedResignation.id, reason: rejectReason })).unwrap()
      message.success('Resignation rejected successfully!')
      setRejectModalVisible(false)
      setRejectReason('')
      setSelectedResignation(null)
      dispatch(fetchTeamResignations())
    } catch (error) {
      message.error('Failed to reject resignation')
    }
  }

  const handleExport = () => {
    message.success('Export functionality will be implemented')
  }

  const handleImport = () => {
    message.success('Import functionality will be implemented')
  }

  const filteredData = teamResignations.filter((item) => {
    const matchesSearch =
      !searchText ||
      item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.empCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Emp Code',
      dataIndex: 'empCode',
      key: 'empCode',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'DOJ',
      dataIndex: 'dateOfJoining',
      key: 'dateOfJoining',
    },
    {
      title: 'Resigned On',
      dataIndex: 'resignedOn',
      key: 'resignedOn',
    },
    {
      title: 'Last Working Date',
      dataIndex: 'lastWorkingDate',
      key: 'lastWorkingDate',
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            onClick={() => handleApprove(record.id)}
            disabled={record.status !== 'Pending'}
          >
            Approve
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
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Team's Resignations</h1>
          <p className="page-description">Review and manage team resignation requests</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space>
              <Input
                placeholder="Search by name, code, or designation"
                allowClear
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={(e) => setSearchText(e.target.value)}
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
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                Export
              </Button>
              <Button icon={<UploadOutlined />} onClick={handleImport}>
                Import CSV
              </Button>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} resignations`,
            }}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <div>No resignation requests found</div>
                </div>
              ),
            }}
          />
        </Card>

        <Modal
          title="Resignation Details"
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false)
            setSelectedResignation(null)
          }}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Close
            </Button>,
          ]}
          width={800}
        >
          {selectedResignation && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Name" span={2}>
                {selectedResignation.name}
              </Descriptions.Item>
              <Descriptions.Item label="Employee Code">{selectedResignation.empCode}</Descriptions.Item>
              <Descriptions.Item label="Designation">{selectedResignation.designation}</Descriptions.Item>
              <Descriptions.Item label="Date of Joining">{selectedResignation.dateOfJoining}</Descriptions.Item>
              <Descriptions.Item label="Resigned On">{selectedResignation.resignedOn}</Descriptions.Item>
              <Descriptions.Item label="Last Working Date" span={2}>
                {selectedResignation.lastWorkingDate}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag
                  color={
                    selectedResignation.status === 'Approved'
                      ? 'green'
                      : selectedResignation.status === 'Rejected'
                      ? 'red'
                      : 'orange'
                  }
                >
                  {selectedResignation.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Modal
          title="Reject Resignation"
          open={rejectModalVisible}
          onOk={confirmReject}
          onCancel={() => {
            setRejectModalVisible(false)
            setRejectReason('')
            setSelectedResignation(null)
          }}
          okText="Confirm Reject"
          cancelText="Cancel"
        >
          <div style={{ marginBottom: 16 }}>
            <strong>Employee:</strong> {selectedResignation?.name} ({selectedResignation?.empCode})
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Reason for Rejection:</strong>
          </div>
          <Input.TextArea
            rows={4}
            placeholder="Enter reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default TeamResignations
