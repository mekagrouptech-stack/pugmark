import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Space,
  Card,
  Row,
  Col,
  Tag,
  Popconfirm,
  InputNumber,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
  MailOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_BASE_URL } from '../../utils/constants'

const { Option } = Select
const { Search } = Input

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({
    department: '',
    isActive: '',
    search: '',
  })

  // Id of the user whose credentials email is currently being sent
  const [sendingCredsId, setSendingCredsId] = useState(null)

  // Permanent-delete (System Admin only) modal state
  const [permTarget, setPermTarget] = useState(null)
  const [permConfirmText, setPermConfirmText] = useState('')
  const [permLoading, setPermLoading] = useState(false)

  // Current logged-in user — only a System Admin may permanently delete employees
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hrms_user') || '{}')
    } catch {
      return {}
    }
  })
  const isSystemAdmin = ['admin', 'system admin', 'system administrator'].includes(
    String(currentUser?.role || '').toLowerCase()
  )

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('hrms_token')
      const params = new URLSearchParams()
      
      if (filters.department) params.append('department', filters.department)
      if (filters.isActive !== '') params.append('isActive', filters.isActive)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Read raw text first so we can surface non-JSON error bodies (e.g. a bare
      // 500 from a proxy or an unhandled server error) instead of a generic toast.
      const raw = await response.text()
      let data = null
      try {
        data = raw ? JSON.parse(raw) : null
      } catch {
        data = null
      }

      if (response.ok && data?.success) {
        setUsers(data.data || [])
      } else {
        const serverMsg = data?.message
        const bodyHint = !data && raw ? ` — ${raw.slice(0, 200)}` : ''
        const detail =
          serverMsg ||
          `HTTP ${response.status} ${response.statusText}${bodyHint || ' (empty/non-JSON response)'}`
        console.error('[UserManagement] fetch users failed:', response.status, raw)
        message.error(`Failed to fetch users: ${detail}`)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      message.error(
        `Failed to fetch users: ${error?.message || 'network error'}. Is the backend reachable at ${API_BASE_URL}/users ?`
      )
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [filters])

  // Fetch departments from Settings (for dropdowns)
  useEffect(() => {
    const token = localStorage.getItem('hrms_token')
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/departments`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) setDepartments(data.data || [])
      } catch (e) {
        console.error('Failed to fetch departments:', e)
      }
    }
    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        const list = data?.data?.rows || data?.data || []
        if (Array.isArray(list)) setCompanies(list.filter((c) => c.isActive !== false))
      } catch (e) {
        console.error('Failed to fetch companies:', e)
      }
    }
    fetchDepartments()
    fetchCompanies()
  }, [])

  const [submitting, setSubmitting] = useState(false)

  // Handle form submit
  const handleSubmit = async (values) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('hrms_token')
      const url = editingUser
        ? `${API_BASE_URL}/users/${editingUser.id}`
        : `${API_BASE_URL}/users`
      const method = editingUser ? 'PUT' : 'POST'

      // Build clean payload
      const submitValues = { ...values }

      // On edit, the code is read-only — don't resend it. On create, keep the
      // manually-entered employeeCode so the backend validates + stores it.
      if (editingUser) {
        delete submitValues.employeeCode
      }

      // Drop empty password on edit (keep current)
      if (editingUser && (submitValues.password === undefined || submitValues.password === '')) {
        delete submitValues.password
      }

      // Coerce types
      submitValues.isActive = !!submitValues.isActive

      // Joining date: DatePicker gives a dayjs object -> send YYYY-MM-DD (or null)
      submitValues.joinDate = submitValues.joinDate
        ? dayjs(submitValues.joinDate).format('YYYY-MM-DD')
        : null

      // Device PIN: send trimmed value or null (so it can be cleared)
      submitValues.devicePin =
        submitValues.devicePin === undefined ||
        submitValues.devicePin === null ||
        String(submitValues.devicePin).trim() === ''
          ? null
          : String(submitValues.devicePin).trim()
      if (submitValues.reportingManagerId === undefined || submitValues.reportingManagerId === '') {
        submitValues.reportingManagerId = null
      }

      // Punch-in location: send as numbers or null
      submitValues.punchInLatitude =
        submitValues.punchInLatitude === undefined || submitValues.punchInLatitude === '' || submitValues.punchInLatitude === null
          ? null
          : Number(submitValues.punchInLatitude)
      submitValues.punchInLongitude =
        submitValues.punchInLongitude === undefined || submitValues.punchInLongitude === '' || submitValues.punchInLongitude === null
          ? null
          : Number(submitValues.punchInLongitude)
      submitValues.punchInRadius =
        submitValues.punchInRadius === undefined || submitValues.punchInRadius === '' || submitValues.punchInRadius === null
          ? 100
          : Number(submitValues.punchInRadius)

      console.log('[UserManagement] submit', method, url, submitValues)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitValues),
      })

      let data = {}
      try {
        data = await response.json()
      } catch {
        data = { success: false, message: `HTTP ${response.status}` }
      }

      if (response.ok && data.success) {
        // For new users the backend message reports whether the login
        // credentials email was sent to the employee, so prefer it.
        message.success(
          data.message || (editingUser ? 'User updated successfully' : 'User created successfully')
        )
        setModalVisible(false)
        setEditingUser(null)
        form.resetFields()
        fetchUsers()
      } else {
        const errMsg = data.message || data.error || `Failed to save user (HTTP ${response.status})`
        console.error('[UserManagement] save failed:', errMsg, data)
        message.error(errMsg)
      }
    } catch (error) {
      console.error('Error saving user:', error)
      message.error(error?.message || 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit — open modal; an effect below will populate the form once mounted
  const handleEdit = (user) => {
    setEditingUser(user)
    setModalVisible(true)
  }

  // Populate form fields whenever the edit modal opens with a user (after Form mounts)
  useEffect(() => {
    if (modalVisible && editingUser) {
      form.setFieldsValue({
        name: editingUser.name,
        email: editingUser.email,
        companyEmail: editingUser.companyEmail ?? editingUser.company_email ?? undefined,
        employeeCode: editingUser.employeeCode,
        password: undefined,
        role: editingUser.role,
        isActive: editingUser.isActive !== false,
        department: editingUser.department,
        designation: editingUser.designation,
        devicePin: editingUser.devicePin ?? editingUser.device_pin ?? undefined,
        phone: editingUser.phone || editingUser.contactInformation?.mobileNo,
        reportingManagerId:
          editingUser.reportingManagerId ?? editingUser.reportingManager?.id ?? null,
        companyId: editingUser.companyId ?? editingUser.company?.id ?? null,
        joinDate: (() => {
          const d =
            editingUser.dateOfJoining ??
            editingUser.joinDate ??
            editingUser.employmentInformation?.dateOfJoining
          return d ? dayjs(d) : null
        })(),
        punchInLatitude:
          editingUser.punchInLatitude != null ? Number(editingUser.punchInLatitude) : null,
        punchInLongitude:
          editingUser.punchInLongitude != null ? Number(editingUser.punchInLongitude) : null,
        punchInRadius:
          editingUser.punchInRadius != null ? Number(editingUser.punchInRadius) : 100,
      })
    }
  }, [modalVisible, editingUser, form])

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        message.success('User deactivated successfully')
        fetchUsers()
      } else {
        message.error(data.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      message.error('Failed to delete user')
    }
  }

  // Re-send login credentials. The stored password is hashed and cannot be
  // read back, so the backend generates a fresh one, saves it and mails it.
  const handleSendCredentials = async (record) => {
    setSendingCredsId(record.id)
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/users/${record.id}/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success && data.emailSent) {
        message.success(data.message || `Login credentials emailed to ${record.email}`)
      } else if (response.ok && data.success) {
        // Password was reset but SMTP failed — show it so the admin can pass it on
        Modal.warning({
          title: 'Email could not be sent',
          content: (
            <div>
              <p>
                The password for <strong>{record.name}</strong> was reset, but the email
                failed. Share the new password manually:
              </p>
              <p>
                <code style={{ fontSize: 15 }}>{data.password}</code>
              </p>
            </div>
          ),
        })
      } else {
        message.error(data.message || 'Failed to send login credentials')
      }
    } catch (error) {
      console.error('Error sending credentials:', error)
      message.error('Failed to send login credentials')
    } finally {
      setSendingCredsId(null)
    }
  }

  // Handle permanent delete (System Admin only, irreversible cascade wipe)
  const handlePermanentDelete = async () => {
    if (!permTarget) return
    setPermLoading(true)
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/users/${permTarget.id}/permanent`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        message.success('Employee permanently deleted')
        setPermTarget(null)
        setPermConfirmText('')
        fetchUsers()
      } else {
        message.error(data.message || 'Failed to permanently delete employee')
      }
    } catch (error) {
      console.error('Error permanently deleting employee:', error)
      message.error('Failed to permanently delete employee')
    } finally {
      setPermLoading(false)
    }
  }

  // Handle add new
  const handleAddNew = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Company Email',
      dataIndex: 'companyEmail',
      key: 'companyEmail',
      render: (v) => v || <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Report To',
      key: 'reportTo',
      render: (_, record) => record.reportingManager?.name || record.reportingManagerName || '—',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Send login credentials?"
            description={
              <span style={{ display: 'block', maxWidth: 280 }}>
                A new password will be generated and emailed to{' '}
                <strong>{record.email}</strong>. Their old password will stop working.
              </span>
            }
            onConfirm={() => handleSendCredentials(record)}
            okText="Send"
            cancelText="Cancel"
          >
            <Button
              icon={<MailOutlined />}
              size="small"
              loading={sendingCredsId === record.id}
              style={{ background: '#059669', borderColor: '#059669', color: '#fff' }}
            >
              Send Credentials
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to deactivate this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small">
              Deactivate
            </Button>
          </Popconfirm>
          {isSystemAdmin && (
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => {
                setPermTarget(record)
                setPermConfirmText('')
              }}
            >
              Delete Permanently
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <h2 style={{ margin: 0 }}>
                  <UserOutlined /> User Management
                </h2>
                <p style={{ margin: '8px 0 0', color: '#666' }}>
                  Manage users and access permissions
                </p>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
                    Refresh
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
                    Add New User
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Filters */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search users..."
                allowClear
                onSearch={(value) => setFilters({ ...filters, search: value })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by Department"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => setFilters({ ...filters, department: value || '' })}
                value={filters.department || undefined}
              >
                {departments.map((d) => (
                  <Option key={d.id} value={d.name}>{d.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => setFilters({ ...filters, isActive: value !== undefined ? value : '' })}
                value={filters.isActive !== '' ? filters.isActive : undefined}
              >
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Col>
          </Row>

          {/* Users Table */}
          <Table
            columns={columns}
            dataSource={users}
            loading={loading}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Total ${total} users`,
            }}
          />
        </Card>

        {/* Add/Edit User Modal */}
        <Modal
          title={editingUser ? 'Edit User' : 'Add New User'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingUser(null)
            form.resetFields()
          }}
          footer={null}
          width={720}
          destroyOnHidden
          maskClosable={!submitting}
          style={{ top: 20 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              role: 'EMPLOYEE',
              isActive: true,
              punchInRadius: 100,
            }}
          >
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter name' }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Personal Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="Enter personal email address" />
            </Form.Item>

            <Form.Item
              name="companyEmail"
              label="Company Email"
              tooltip="Official notices are sent here. If left blank, notices go to the personal email."
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input placeholder="Enter company email (optional)" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: !editingUser, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="employeeCode"
                  label="Employee Code"
                  tooltip="Unique employee ID entered manually. Duplicate codes are not allowed."
                  rules={[{ required: true, message: 'Please enter an employee code' }]}
                  normalize={(v) => (v ? v.toUpperCase().replace(/\s+/g, '') : v)}
                >
                  <Input
                    placeholder="e.g. MIPL1"
                    maxLength={32}
                    disabled={!!editingUser}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="isActive" label="Status" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </Col>
            </Row>

            {/* Role is set from Settings > Roles; kept hidden here and submitted as-is */}
            <Form.Item name="role" hidden rules={[{ required: true }]}>
              <Input type="hidden" />
            </Form.Item>

            <Form.Item
              name="companyId"
              label="Company"
              tooltip="Company this employee belongs to"
            >
              <Select
                placeholder="Select company"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, opt) =>
                  (opt?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              >
                {companies.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.companyName}
                    {c.employeeCodePrefix ? ` (${c.employeeCodePrefix})` : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="department" label="Department">
              <Select
                placeholder="Select department (optional)"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, opt) =>
                  (opt?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              >
                {departments.map((d) => (
                  <Option key={d.id} value={d.name}>{d.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="designation" label="Designation">
              <Input placeholder="Enter designation (optional)" />
            </Form.Item>

            <Form.Item name="joinDate" label="Joining Date">
              <DatePicker
                style={{ width: '100%' }}
                format="DD MMM YYYY"
                placeholder="Select joining date"
              />
            </Form.Item>

            <Form.Item name="reportingManagerId" label="Report To">
              <Select
                placeholder="Select reporting manager (optional)"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, opt) =>
                  (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={users
                  .filter((u) => u.id !== editingUser?.id)
                  .map((u) => ({
                    value: u.id,
                    label: u.employeeCode ? `${u.name} (${u.employeeCode})` : u.name,
                  }))}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
                <Button onClick={() => { setModalVisible(false); setEditingUser(null); form.resetFields() }} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Permanent delete confirmation — System Admin only, irreversible */}
        <Modal
          title="Permanently delete employee"
          open={!!permTarget}
          onCancel={() => {
            setPermTarget(null)
            setPermConfirmText('')
          }}
          okText="Delete Permanently"
          okButtonProps={{
            danger: true,
            loading: permLoading,
            disabled: permConfirmText.trim() !== (permTarget?.name || ''),
          }}
          onOk={handlePermanentDelete}
          destroyOnClose
        >
          <p style={{ marginTop: 0 }}>
            This will <strong>permanently delete</strong>{' '}
            <strong>{permTarget?.name}</strong> and all of their data — attendance, leaves,
            payroll, salary, profile, documents, reimbursements, DARs and chat messages.
          </p>
          <p style={{ color: '#cf1322', fontWeight: 500 }}>
            This action cannot be undone. To only disable login, use “Deactivate” instead.
          </p>
          <p style={{ marginBottom: 8 }}>
            Type the employee&apos;s name <strong>{permTarget?.name}</strong> to confirm:
          </p>
          <Input
            value={permConfirmText}
            onChange={(e) => setPermConfirmText(e.target.value)}
            placeholder={permTarget?.name || ''}
            onPressEnter={() => {
              if (permConfirmText.trim() === (permTarget?.name || '')) handlePermanentDelete()
            }}
          />
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default UserManagement
