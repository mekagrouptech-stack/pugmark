import React, { useEffect } from 'react'
import { Card, Table, Input, InputNumber, Space, Avatar, Tag, Button, Modal, Descriptions, Row, Col, Typography, Form, Select, DatePicker, App, Progress, Tooltip } from 'antd'
import { SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined, EyeOutlined, TeamOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchTeamMembers } from '../../features/myTeam/myTeamSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import myTeamService from '../../features/myTeam/myTeamService'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'

const { Search } = Input
const { Title, Text } = Typography
const { Option } = Select

/** Red below a third filled, amber while incomplete, green once fully filled. */
const completionColor = (percent) => {
  if (percent >= 100) return '#52c41a'
  if (percent >= 67) return '#1677ff'
  if (percent >= 34) return '#faad14'
  return '#ff4d4f'
}

const TeamMembers = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { teamMembers, loading } = useSelector((state) => state.myTeam)
  const { user } = useSelector((state) => state.auth)
  const { message } = App.useApp()
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN'
  // Roles the /companies endpoint is open to.
  const canPickCompany = ['ADMIN', 'HR', 'HEAD_HR'].includes(user?.role?.toUpperCase())
  const [searchText, setSearchText] = React.useState('')
  const [filteredData, setFilteredData] = React.useState([])
  const [viewModalVisible, setViewModalVisible] = React.useState(false)
  const [editModalVisible, setEditModalVisible] = React.useState(false)
  const [selectedMember, setSelectedMember] = React.useState(null)
  const [companies, setCompanies] = React.useState([])
  const [updating, setUpdating] = React.useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchTeamMembers())
    // The company dropdown only appears inside the edit form, which is an
    // HR/Admin affair — and /companies is closed to everyone else, so asking
    // for it as a reporting person just logs a 403 on every visit.
    if (canPickCompany) {
      myTeamService.getCompanies().then(setCompanies).catch(console.error)
    }
  }, [dispatch, canPickCompany])

  useEffect(() => {
    if (searchText) {
      const filtered = teamMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(searchText.toLowerCase()) ||
          member.employeeCode.toLowerCase().includes(searchText.toLowerCase()) ||
          member.email.toLowerCase().includes(searchText.toLowerCase())
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(teamMembers)
    }
  }, [searchText, teamMembers])

  const handleViewDetails = (member) => {
    setSelectedMember(member)
    setViewModalVisible(true)
  }

  const handleEditMember = (member) => {
    setSelectedMember(member)
    form.setFieldsValue({
      name: member.name,
      employeeCode: member.employeeCode,
      email: member.email,
      designation: member.designation,
      department: member.department,
      phone: member.phone,
      status: member.status,
      companyId: member.companyId,
      joinDate: member.joinDate ? dayjs(member.joinDate) : null,
      monthlySalary: member.monthlySalary || null,
      reportingManagerId: member.reportingManagerId ?? member.reportingManager?.id ?? undefined,
    })
    setEditModalVisible(true)
  }

  const handleSaveEdit = async (values) => {
    if (!selectedMember || !selectedMember.id) {
      message.error('No member selected for update')
      return
    }

    setUpdating(true)
    try {
      // Prepare update data
      const updateData = {
        name: values.name,
        email: values.email,
        designation: values.designation || null,
        department: values.department || null,
        isActive: values.status === 'Active',
        companyId: values.companyId || null,
        phone: values.phone || null,
        joinDate: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : null,
        monthlySalary: values.monthlySalary || null,
        reportingManagerId: values.reportingManagerId === undefined || values.reportingManagerId === '' ? null : values.reportingManagerId,
      }

      // Remove null/undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key]
        }
      })

      console.log('Updating member:', selectedMember.id, updateData)

      // Call API to update the member
      await myTeamService.updateTeamMember(selectedMember.id, updateData)

      message.success('Team member updated successfully')
      
      setEditModalVisible(false)
      setSelectedMember(null)
      form.resetFields()
      
      // Refresh team members after update
      dispatch(fetchTeamMembers())
    } catch (error) {
      console.error('Error updating member:', error)
      message.error(error.message || 'Failed to update team member')
    } finally {
      setUpdating(false)
    }
  }

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <Space size={12} style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={36} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff', flexShrink: 0 }} 
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: '#262626', marginBottom: 2, lineHeight: '20px' }}>
              {record.name || 'N/A'}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: '16px' }}>
              {record.employeeCode || 'N/A'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 160,
      render: (text) => <Text style={{ fontSize: 13 }}>{text || 'N/A'}</Text>,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text) => <Text style={{ fontSize: 13 }}>{text || 'N/A'}</Text>,
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'company',
      width: 150,
      render: (text) => <Text style={{ fontSize: 13 }}>{text || 'N/A'}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250,
      ellipsis: true,
      render: (email) => (
        <Space size={8} style={{ display: 'flex', alignItems: 'center' }}>
          <MailOutlined style={{ color: '#1890ff', fontSize: 14, flexShrink: 0 }} />
          <Text style={{ fontSize: 13 }} ellipsis={{ tooltip: email }}>
            {email || 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone) => (
        <Space size={8} style={{ display: 'flex', alignItems: 'center' }}>
          <PhoneOutlined style={{ color: '#52c41a', fontSize: 14, flexShrink: 0 }} />
          <Text style={{ fontSize: 13 }}>{phone || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 120,
      render: (date) => (
        <Text style={{ fontSize: 13 }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: 'Account Completed',
      dataIndex: 'profileCompletion',
      key: 'profileCompletion',
      width: 170,
      sorter: (a, b) => (a.profileCompletion || 0) - (b.profileCompletion || 0),
      render: (percent = 0, record) => {
        const missing = record.profileMissing || []
        return (
          <Tooltip
            title={
              missing.length === 0
                ? 'All profile details are filled in'
                : `Missing (${missing.length}): ${missing.join(', ')}`
            }
          >
            <Progress
              percent={percent}
              size="small"
              status={percent === 100 ? 'success' : 'normal'}
              strokeColor={completionColor(percent)}
            />
          </Tooltip>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => (
        <Tag 
          color={status === 'Active' ? 'success' : 'default'}
          style={{ 
            margin: 0,
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 500,
            fontSize: 12,
            lineHeight: '20px'
          }}
        >
          {status || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{ 
              padding: 0,
              height: 'auto',
              fontSize: 13,
              color: '#1890ff'
            }}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
            style={{ 
              padding: 0,
              height: 'auto',
              fontSize: 13,
              color: '#52c41a'
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout hideHeader={true}>
      <div style={{ padding: '0', background: '#f0f2f5', minHeight: '100vh' }}>
        {/* Main Card */}
        <Card
          style={{
            borderRadius: '0',
            boxShadow: 'none',
            margin: 0,
          }}
          bodyStyle={{ padding: '20px' }}
        >
          {/* Search Bar & Add Employee */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Search
              placeholder="Search by name, employee code, or email"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              style={{ width: '100%', maxWidth: '400px' }}
            />
            {isAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/admin/users')}
                style={{ borderRadius: '4px' }}
              >
                Add Employee
              </Button>
            )}
          </div>

          {/* Table */}
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
                `${range[0]}-${range[1]} of ${total} members`,
              pageSizeOptions: ['10', '20', '50', '100'],
              style: { marginTop: '16px' },
            }}
            style={{
              backgroundColor: '#fff',
            }}
            size="middle"
            bordered={false}
            locale={{
              emptyText: (
                <div style={{ 
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#999'
                }}>
                  <UserOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#595959' }}>
                    No team members found
                  </div>
                  <div style={{ fontSize: 14, marginTop: 8 }}>
                    {searchText ? 'Try adjusting your search criteria' : 'No team members available'}
                  </div>
                </div>
              ),
            }}
          />

          {/* View Details Modal */}
          <Modal
            title={
              <Space>
                <TeamOutlined style={{ color: '#1890ff' }} />
                <span>Team Member Details</span>
              </Space>
            }
            open={viewModalVisible}
            onCancel={() => {
              setViewModalVisible(false)
              setSelectedMember(null)
            }}
            footer={[
              <Button 
                key="close" 
                type="primary"
                onClick={() => setViewModalVisible(false)}
                style={{ borderRadius: '4px' }}
              >
                Close
              </Button>,
            ]}
            width={700}
            style={{ top: 50 }}
          >
            {selectedMember && (
              <div style={{ padding: '8px 0' }}>
                <Descriptions 
                  bordered 
                  column={2}
                  size="middle"
                  labelStyle={{ 
                    fontWeight: 600,
                    backgroundColor: '#fafafa',
                    width: '35%'
                  }}
                  contentStyle={{ 
                    backgroundColor: '#fff'
                  }}
                >
                  <Descriptions.Item label="Name" span={2}>
                    <Space size="middle">
                      <Avatar 
                        size={48}
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: '#1890ff' }} 
                      />
                      <span style={{ fontWeight: 600, fontSize: 16 }}>
                        {selectedMember.name || 'N/A'}
                      </span>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Employee Code">
                    <Text strong>{selectedMember.employeeCode || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag 
                      color={selectedMember.status === 'Active' ? 'success' : 'default'}
                      style={{ 
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}
                    >
                      {selectedMember.status || 'N/A'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Designation">
                    <Text>{selectedMember.designation || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    <Text>{selectedMember.department || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Company">
                    <Text>{selectedMember.companyName || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email" span={2}>
                    <Space size="small">
                      <MailOutlined style={{ color: '#1890ff' }} />
                      <Text copyable={{ text: selectedMember.email }}>
                        {selectedMember.email || 'N/A'}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Space size="small">
                      <PhoneOutlined style={{ color: '#52c41a' }} />
                      <Text>{selectedMember.phone || 'N/A'}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Join Date">
                    <Text>
                      {selectedMember.joinDate 
                        ? new Date(selectedMember.joinDate).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Report To">
                    <Text>{selectedMember.reportingManagerName || selectedMember.reportTo || '—'}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Modal>

          {/* Edit Member Modal */}
          <Modal
            title={
              <Space>
                <EditOutlined style={{ color: '#52c41a' }} />
                <span>Edit Team Member</span>
              </Space>
            }
            open={editModalVisible}
            onCancel={() => {
              setEditModalVisible(false)
              setSelectedMember(null)
              form.resetFields()
            }}
            footer={null}
            width={700}
            style={{ top: 50 }}
          >
            {selectedMember && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSaveEdit}
                style={{ marginTop: 20 }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label={
                        <Space>
                          <UserOutlined />
                          <span>Name</span>
                        </Space>
                      }
                      name="name"
                      rules={[{ required: true, message: 'Please enter name' }]}
                    >
                      <Input placeholder="Enter name" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Employee Code"
                      name="employeeCode"
                      rules={[{ required: true, message: 'Please enter employee code' }]}
                    >
                      <Input placeholder="Enter employee code" size="large" disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Status"
                      name="status"
                      rules={[{ required: true, message: 'Please select status' }]}
                    >
                      <Select placeholder="Select status" size="large">
                        <Option value="Active">Active</Option>
                        <Option value="Inactive">Inactive</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Designation"
                      name="designation"
                    >
                      <Input placeholder="Enter designation" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Department"
                      name="department"
                    >
                      <Input placeholder="Enter department" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Company"
                      name="companyId"
                    >
                      <Select 
                        placeholder="Select company" 
                        size="large"
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        allowClear
                      >
                        {companies.map((company) => (
                          <Option key={company.id} value={company.id}>
                            {company.companyName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <Space>
                          <MailOutlined />
                          <span>Email</span>
                        </Space>
                      }
                      name="email"
                      rules={[
                        { required: true, message: 'Please enter email' },
                        { type: 'email', message: 'Please enter a valid email' }
                      ]}
                    >
                      <Input placeholder="Enter email" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <Space>
                          <PhoneOutlined />
                          <span>Phone</span>
                        </Space>
                      }
                      name="phone"
                    >
                      <Input placeholder="Enter phone number" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Join Date"
                      name="joinDate"
                    >
                      <DatePicker 
                        style={{ width: '100%' }} 
                        size="large"
                        format="DD/MM/YYYY"
                        placeholder="Select join date"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Monthly Salary (₹)"
                      name="monthlySalary"
                      help="Required for payroll generation"
                    >
                      <InputNumber 
                        style={{ width: '100%' }} 
                        size="large"
                        placeholder="Enter monthly salary"
                        min={0}
                        step={1000}
                        formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="reportingManagerId" label="Report To">
                      <Select
                        placeholder="Select reporting manager (optional)"
                        size="large"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={teamMembers
                          .filter((m) => m.id !== selectedMember?.id)
                          .map((m) => ({
                            value: m.id,
                            label: m.employeeCode ? `${m.name} (${m.employeeCode})` : m.name,
                          }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button 
                      onClick={() => {
                        setEditModalVisible(false)
                        setSelectedMember(null)
                        form.resetFields()
                      }}
                      size="large"
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      size="large"
                      loading={updating}
                      style={{ borderRadius: '4px' }}
                    >
                      Save Changes
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Modal>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default TeamMembers
