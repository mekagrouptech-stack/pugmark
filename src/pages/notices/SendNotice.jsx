import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Radio,
  Button,
  Upload,
  message,
  Table,
  Tag,
  Space,
  Popconfirm,
  Tooltip,
} from 'antd'
import {
  NotificationOutlined,
  UploadOutlined,
  SendOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_BASE_URL, STORAGE_BASE_URL } from '../../utils/constants'

const { TextArea } = Input
const { Option } = Select

const priorityColor = { normal: 'default', important: 'blue', urgent: 'red' }

const SendNotice = () => {
  const [form] = Form.useForm()
  const [audience, setAudience] = useState('all')
  const [employees, setEmployees] = useState([])
  const [fileList, setFileList] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState([])
  const [loadingSent, setLoadingSent] = useState(false)

  const token = localStorage.getItem('hrms_token')

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.data || data.users || []
      setEmployees(list)
    } catch {
      // non-fatal
    }
  }

  const fetchSent = async () => {
    setLoadingSent(true)
    try {
      const res = await fetch(`${API_BASE_URL}/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setSent(data.data || [])
    } catch {
      // non-fatal
    } finally {
      setLoadingSent(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchSent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', values.title)
      fd.append('message', values.message)
      fd.append('priority', values.priority || 'important')
      fd.append('audience', values.audience)
      if (values.audience === 'specific') {
        fd.append('userIds', JSON.stringify(values.userIds || []))
      }
      if (fileList[0]?.originFileObj) {
        fd.append('attachment', fileList[0].originFileObj)
      }

      const res = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()

      if (res.ok && data.success) {
        message.success(data.message || 'Notice sent')
        form.resetFields()
        setAudience('all')
        setFileList([])
        fetchSent()
      } else {
        message.error(data.message || 'Failed to send notice')
      }
    } catch (e) {
      message.error('Failed to send notice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        message.success('Notice deleted')
        fetchSent()
      } else {
        message.error(data.message || 'Failed to delete notice')
      }
    } catch {
      message.error('Failed to delete notice')
    }
  }

  const sentColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (t, r) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{t}</span>
          {r.attachmentPath && (
            <Tooltip title={r.attachmentName || 'Attachment'}>
              <PaperClipOutlined style={{ color: '#4338ca' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (p) => <Tag color={priorityColor[p] || 'default'}>{String(p).toUpperCase()}</Tag>,
    },
    {
      title: 'Audience',
      dataIndex: 'audience',
      key: 'audience',
      render: (a) => (a === 'all' ? 'All employees' : 'Specific'),
    },
    {
      title: 'Read',
      key: 'read',
      render: (_, r) => `${r.readCount} / ${r.totalRecipients}`,
    },
    {
      title: 'Sent',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY, HH:mm') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          {r.attachmentPath && (
            <a href={`${STORAGE_BASE_URL}${r.attachmentPath}`} target="_blank" rel="noreferrer">
              View PDF
            </a>
          )}
          <Popconfirm
            title="Delete this notice?"
            onConfirm={() => handleDelete(r.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">
            <NotificationOutlined /> Important Notice
          </h1>
          <p className="page-description">
            Send an important notice to a specific employee or to everyone, with an optional PDF
            attachment.
          </p>
        </div>

        <Card style={{ marginBottom: 24 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ priority: 'important', audience: 'all' }}
          >
            <Form.Item
              name="title"
              label="Notice Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="e.g. Office closed on 15th August" maxLength={200} />
            </Form.Item>

            <Space size="large" style={{ display: 'flex', flexWrap: 'wrap' }}>
              <Form.Item name="priority" label="Priority">
                <Select style={{ width: 180 }}>
                  <Option value="normal">Normal</Option>
                  <Option value="important">Important</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>

              <Form.Item name="audience" label="Send To">
                <Radio.Group onChange={(e) => setAudience(e.target.value)}>
                  <Radio.Button value="all">All Employees</Radio.Button>
                  <Radio.Button value="specific">Specific Employee(s)</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Space>

            {audience === 'specific' && (
              <Form.Item
                name="userIds"
                label="Select Employees"
                rules={[{ required: true, message: 'Select at least one employee' }]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Search and select employees"
                  optionFilterProp="label"
                  options={employees.map((u) => ({
                    label: `${u.name}${u.employeeCode ? ` (${u.employeeCode})` : ''}`,
                    value: u.id,
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: 'Please enter the notice message' }]}
            >
              <TextArea rows={6} placeholder="Write the notice details here..." maxLength={5000} />
            </Form.Item>

            <Form.Item label="Attachment (PDF, optional)">
              <Upload
                accept="application/pdf"
                maxCount={1}
                fileList={fileList}
                beforeUpload={(file) => {
                  const isPdf = file.type === 'application/pdf'
                  if (!isPdf) {
                    message.error('Only PDF files are allowed')
                    return Upload.LIST_IGNORE
                  }
                  const under10mb = file.size / 1024 / 1024 < 10
                  if (!under10mb) {
                    message.error('PDF must be smaller than 10MB')
                    return Upload.LIST_IGNORE
                  }
                  return false // keep the file locally; upload happens on submit
                }}
                onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
                onRemove={() => setFileList([])}
              >
                <Button icon={<UploadOutlined />}>Select PDF</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={submitting}
              >
                Send Notice
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card
          title="Sent Notices"
          extra={
            <Button icon={<ReloadOutlined />} size="small" onClick={fetchSent}>
              Refresh
            </Button>
          }
        >
          <Table
            rowKey="id"
            columns={sentColumns}
            dataSource={sent}
            loading={loadingSent}
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default SendNotice
