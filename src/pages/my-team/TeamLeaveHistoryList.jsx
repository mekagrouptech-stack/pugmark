import React, { useEffect } from 'react'
import { Card, Table, Tag, DatePicker, Input, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPendingRequests } from '../../features/myTeam/myTeamSlice'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Search } = Input

const TeamLeaveHistoryList = () => {
  const dispatch = useDispatch()
  const { pendingRequests, loading } = useSelector((state) => state.myTeam)
  const [dateRange, setDateRange] = React.useState(null)
  const [searchText, setSearchText] = React.useState('')

  useEffect(() => {
    dispatch(fetchPendingRequests('leave'))
  }, [dispatch])

  const filteredData = (pendingRequests.leave || []).filter((item) => {
    const matchesSearch =
      !searchText ||
      item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.employeeCode.toLowerCase().includes(searchText.toLowerCase())
    return matchesSearch
  })

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
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
  ]

  return (
    <Card className="card-container">
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <RangePicker
              onChange={setDateRange}
              format="DD/MM/YYYY"
            />
            <Search
              placeholder="Search employee"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 300 }}
              onChange={(e) => setSearchText(e.target.value)}
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
                  <div>No leave history found</div>
                </div>
              ),
            }}
          />
    </Card>
  )
}

export default TeamLeaveHistoryList
