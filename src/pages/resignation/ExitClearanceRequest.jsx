import React, { useEffect } from 'react'
import { Card, Table, Tag, Input, Select, Space, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchExitClearanceRequests } from '../../features/resignation/exitClearanceSlice'
import DashboardLayout from '../../layouts/DashboardLayout'

const { Search } = Input

const ExitClearanceRequest = () => {
  const dispatch = useDispatch()
  const { requests, loading } = useSelector((state) => state.exitClearance)
  const [searchText, setSearchText] = React.useState('')
  const [departmentFilter, setDepartmentFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')

  useEffect(() => {
    dispatch(fetchExitClearanceRequests())
  }, [dispatch])

  const departments = ['IT', 'HR', 'Finance', 'Operations']

  const filteredData = requests.filter((item) => {
    const matchesSearch =
      !searchText ||
      item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.employeeCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchText.toLowerCase())
    const matchesDepartment =
      departmentFilter === 'all' || item.clearanceDepartment === departmentFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Emp Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Clearance Department',
      dataIndex: 'clearanceDepartment',
      key: 'clearanceDepartment',
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
      title: 'LWD',
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
          Completed: 'blue',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: 'Action On',
      dataIndex: 'actionOn',
      key: 'actionOn',
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Exit Clearance Request</h1>
          <p className="page-description">View and manage exit clearance requests</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space>
              <Search
                placeholder="Search by employee name, code, or designation"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 300 }}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={setSearchText}
              />
              <Select
                placeholder="Filter by department"
                style={{ width: 180 }}
                value={departmentFilter}
                onChange={setDepartmentFilter}
              >
                <Select.Option value="all">All Departments</Select.Option>
                {departments.map((dept) => (
                  <Select.Option key={dept} value={dept}>
                    {dept}
                  </Select.Option>
                ))}
              </Select>
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
                <Select.Option value="Completed">Completed</Select.Option>
              </Select>
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
              showTotal: (total) => `Total ${total} requests`,
            }}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <div>No exit clearance requests found</div>
                </div>
              ),
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ExitClearanceRequest
