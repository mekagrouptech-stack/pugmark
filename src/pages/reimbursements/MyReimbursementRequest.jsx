import React, { useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Descriptions, message } from 'antd'
import { SearchOutlined, EyeOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchReimbursements } from '../../features/reimbursement/reimbursementSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'

const { Search } = Input

const MyReimbursementRequest = () => {
  const dispatch = useDispatch()
  const { requests, loading } = useSelector((state) => state.reimbursement)
  const [searchText, setSearchText] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [viewModalVisible, setViewModalVisible] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState(null)

  useEffect(() => {
    dispatch(fetchReimbursements())
  }, [dispatch])

  const handleView = (record) => {
    setSelectedRequest(record)
    setViewModalVisible(true)
  }

  const handleExport = () => {
    message.success('Export functionality will be implemented')
  }

  const filteredData = requests.filter((item) => {
    const matchesSearch =
      !searchText ||
      item.requestType?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.periodFrom?.includes(searchText) ||
      item.periodTo?.includes(searchText)
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
      title: 'Period',
      key: 'period',
      render: (_, record) => `${record.periodFrom || ''} to ${record.periodTo || ''}`,
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
      title: 'Pending From',
      dataIndex: 'pendingFrom',
      key: 'pendingFrom',
      render: (pendingFrom) => pendingFrom || '-',
    },
    {
      title: 'Created On',
      dataIndex: 'createdOn',
      key: 'createdOn',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Reimbursement Request</h1>
          <p className="page-description">View all your reimbursement requests</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space>
              <Search
                placeholder="Search by type or period"
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
                  <div>No reimbursement requests found</div>
                </div>
              ),
            }}
          />
        </Card>

        <Modal
          title="Reimbursement Request Details"
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false)
            setSelectedRequest(null)
          }}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Close
            </Button>,
          ]}
          width={800}
        >
          {selectedRequest && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Request Type" span={2}>
                {selectedRequest.requestType}
              </Descriptions.Item>
              <Descriptions.Item label="Period From">{selectedRequest.periodFrom}</Descriptions.Item>
              <Descriptions.Item label="Period To">{selectedRequest.periodTo}</Descriptions.Item>
              <Descriptions.Item label="Total Amount" span={2}>
                ₹{selectedRequest.totalAmount?.toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={selectedRequest.status === 'Approved' ? 'green' : selectedRequest.status === 'Rejected' ? 'red' : 'orange'}>
                  {selectedRequest.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created On" span={2}>
                {selectedRequest.createdOn}
              </Descriptions.Item>
              {selectedRequest.expenseDetails && (
                <Descriptions.Item label="Expense Details" span={2}>
                  <Table
                    columns={[
                      { title: 'Type', dataIndex: 'type', key: 'type' },
                      { title: 'Date', dataIndex: 'date', key: 'date', render: (text) => formatDate(text) },
                      { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amt) => `₹${amt}` },
                      { title: 'Purpose', dataIndex: 'purpose', key: 'purpose' },
                    ]}
                    dataSource={selectedRequest.expenseDetails}
                    pagination={false}
                    size="small"
                  />
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default MyReimbursementRequest
