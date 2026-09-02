import React, { useEffect, useState } from 'react'
import { Card, Tabs, Table, Tag, Button, Space, Input, Form, Select, DatePicker, Modal, message } from 'antd'
import { SearchOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchClosedTickets, createTicket, fetchTickets } from '../../features/helpdesk/helpdeskSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import { ROLES } from '../../utils/constants'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'

const { Search, TextArea } = Input
const { RangePicker } = DatePicker

const Helpdesk = () => {
  const dispatch = useDispatch()
  const { closedTickets, tickets, loading } = useSelector((state) => state.helpdesk)
  const { user } = useSelector((state) => state.auth)
  const [form] = Form.useForm()
  const [newTicketModalVisible, setNewTicketModalVisible] = useState(false)
  const [searchMode, setSearchMode] = useState('basic')
  const [searchText, setSearchText] = useState('')
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false)

  useEffect(() => {
    dispatch(fetchClosedTickets())
    dispatch(fetchTickets())
  }, [dispatch])

  const isManagerOrHR = user?.role === ROLES.MANAGER || user?.role === ROLES.HR

  const handleCreateTicket = async (values) => {
    try {
      await dispatch(
        createTicket({
          subject: values.subject,
          description: values.description,
          category: values.category,
          priority: values.priority,
          from: user?.email || '',
        })
      ).unwrap()
      message.success('Ticket created successfully!')
      setNewTicketModalVisible(false)
      form.resetFields()
      dispatch(fetchTickets())
    } catch (error) {
      message.error('Failed to create ticket')
    }
  }

  const handleStaffPanel = () => {
    message.info('Staff Panel functionality will be implemented')
  }

  const closedTicketColumns = [
    {
      title: 'Ticket No',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => formatDate(text),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colorMap = {
          High: 'red',
          Medium: 'orange',
          Low: 'green',
        }
        return <Tag color={colorMap[priority] || 'default'}>{priority}</Tag>
      },
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
    },
    {
      title: 'Closed On',
      dataIndex: 'closedOn',
      key: 'closedOn',
    },
  ]

  const filteredClosedTickets = closedTickets.filter((ticket) => {
    if (searchMode === 'basic') {
      return (
        !searchText ||
        ticket.ticketNo?.toLowerCase().includes(searchText.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchText.toLowerCase()) ||
        ticket.department?.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    return true
  })

  const tabItems = [
    {
      key: 'closed',
      label: 'Closed Tickets',
      children: (
        <div>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space>
              <Select
                value={searchMode}
                onChange={setSearchMode}
                style={{ width: 120 }}
              >
                <Select.Option value="basic">Basic</Select.Option>
                <Select.Option value="advanced">Advanced</Select.Option>
              </Select>
              {searchMode === 'basic' && (
                <Search
                  placeholder="Search tickets"
                  allowClear
                  enterButton={<SearchOutlined />}
                  style={{ width: 300 }}
                  onChange={(e) => setSearchText(e.target.value)}
                  onSearch={setSearchText}
                />
              )}
              {searchMode === 'advanced' && (
                <Button onClick={() => setAdvancedSearchVisible(true)}>
                  Advanced Search
                </Button>
              )}
            </Space>
            {isManagerOrHR && (
              <Button type="primary" icon={<UserOutlined />} onClick={handleStaffPanel}>
                Staff Panel
              </Button>
            )}
          </Space>

          <Table
            columns={closedTicketColumns}
            dataSource={filteredClosedTickets}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} closed tickets`,
            }}
            locale={{
              emptyText: (
                <div className="empty-state">
                  <div>No closed tickets found</div>
                </div>
              ),
            }}
          />
        </div>
      ),
    },
    {
      key: 'new',
      label: 'New Ticket',
      children: (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateTicket}
            autoComplete="off"
          >
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please enter subject!' }]}
            >
              <Input placeholder="Enter ticket subject" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category / Department"
              rules={[{ required: true, message: 'Please select category!' }]}
            >
              <Select placeholder="Select category">
                <Select.Option value="IT Support">IT Support</Select.Option>
                <Select.Option value="HR">HR</Select.Option>
                <Select.Option value="Finance">Finance</Select.Option>
                <Select.Option value="Facilities">Facilities</Select.Option>
                <Select.Option value="Other">Other</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select priority!' }]}
            >
              <Select placeholder="Select priority">
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description!' }]}
            >
              <TextArea rows={6} placeholder="Enter ticket description" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" icon={<PlusOutlined />}>
                Create Ticket
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Helpdesk</h1>
          <p className="page-description">Manage support tickets and requests</p>
        </div>

        <Card className="card-container">
          <Tabs defaultActiveKey="closed" items={tabItems} />
        </Card>

        <Modal
          title="Advanced Search"
          open={advancedSearchVisible}
          onCancel={() => setAdvancedSearchVisible(false)}
          footer={[
            <Button key="reset" onClick={() => setAdvancedSearchVisible(false)}>
              Reset
            </Button>,
            <Button key="search" type="primary" onClick={() => setAdvancedSearchVisible(false)}>
              Search
            </Button>,
          ]}
          width={600}
        >
          <Form layout="vertical">
            <Form.Item name="ticketNo" label="Ticket No">
              <Input placeholder="Enter ticket number" />
            </Form.Item>
            <Form.Item name="subject" label="Subject">
              <Input placeholder="Enter subject" />
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Select placeholder="Select department">
                <Select.Option value="IT Support">IT Support</Select.Option>
                <Select.Option value="HR">HR</Select.Option>
                <Select.Option value="Finance">Finance</Select.Option>
                <Select.Option value="Facilities">Facilities</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <Select placeholder="Select priority">
                <Select.Option value="Low">Low</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="High">High</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" label="Date Range">
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="from" label="From">
              <Input placeholder="Enter email" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default Helpdesk
