import React, { useEffect } from 'react'
import { Card, Table, Tag, DatePicker, Input, Space } from 'antd'
import { SearchOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLateMarkRecords } from '../../features/myTeam/myTeamSlice'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'

const { RangePicker } = DatePicker
const { Search } = Input

const LateMark = () => {
  const dispatch = useDispatch()
  const { lateMarkRecords, loading } = useSelector((state) => state.myTeam)
  const [dateRange, setDateRange] = React.useState(() => [
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [searchText, setSearchText] = React.useState('')

  useEffect(() => {
    const params = {}
    if (dateRange && dateRange[0]) params.startDate = dateRange[0].format('YYYY-MM-DD')
    if (dateRange && dateRange[1]) params.endDate = dateRange[1].format('YYYY-MM-DD')
    dispatch(fetchLateMarkRecords(params))
  }, [dispatch, dateRange])

  const filteredData = lateMarkRecords.filter((item) => {
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (text) => formatDate(text),
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
    },
    {
      title: 'Expected Check In',
      dataIndex: 'expectedCheckIn',
      key: 'expectedCheckIn',
    },
    {
      title: 'Late By',
      dataIndex: 'lateBy',
      key: 'lateBy',
      render: (lateBy) => (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          {lateBy}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="orange">{status}</Tag>,
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
              showTotal: (total) => `Total ${total} late mark records`,
            }}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <div>No late mark records found</div>
                </div>
              ),
            }}
          />
    </Card>
  )
}

export default LateMark
