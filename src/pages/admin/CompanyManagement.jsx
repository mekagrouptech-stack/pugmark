import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Upload,
  message,
  Space,
  Card,
  Row,
  Col,
  Tag,
  Popconfirm,
  InputNumber,
  Descriptions,
  Typography,
  Avatar,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  BankOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_BASE_URL, STORAGE_BASE_URL, getStorageUrl } from '../../utils/constants'

const { Option } = Select
const { Search, TextArea } = Input
const { Text } = Typography

const FALLBACK_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBMb2dvPC90ZXh0Pjwvc3ZnPg=='

const CompanyManagement = () => {
  const dispatch = useDispatch()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [form] = Form.useForm()
  const [logoFileList, setLogoFileList] = useState([])
  const [viewModalUploading, setViewModalUploading] = useState(false)
  const [viewModalLoading, setViewModalLoading] = useState(false)
  const [filters, setFilters] = useState({
    isActive: '',
    country: '',
    search: '',
  })

  // Fetch companies
  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('hrms_token')
      const params = new URLSearchParams()
      
      if (filters.isActive !== '') params.append('isActive', filters.isActive)
      if (filters.country) params.append('country', filters.country)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`${API_BASE_URL}/companies?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setCompanies(data.data || [])
      } else {
        message.error(data.message || 'Failed to fetch companies')
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      message.error('Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [filters])

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('hrms_token')
      const url = editingCompany
        ? `${API_BASE_URL}/companies/${editingCompany.id}`
        : `${API_BASE_URL}/companies`
      const method = editingCompany ? 'PUT' : 'POST'

      // Explicitly include logoUrl - form hidden field can be unreliable
      const logoUrl = form.getFieldValue('logoUrl')
      const payload = { ...values }
      // Always send logoUrl: value or null (to clear when removed)
      payload.logoUrl = logoUrl || null

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        message.success(editingCompany ? 'Company updated successfully' : 'Company created successfully')
        setModalVisible(false)
        setEditingCompany(null)
        form.resetFields()
        fetchCompanies()
      } else {
        message.error(data.message || 'Failed to save company')
      }
    } catch (error) {
      console.error('Error saving company:', error)
      message.error('Failed to save company')
    }
  }

  // Handle view - fetch full company by ID to get logo and latest data
  const handleView = async (company) => {
    setViewModalVisible(true)
    if (!company?.id) {
      setSelectedCompany(company)
      return
    }
    setViewModalLoading(true)
    setSelectedCompany(company)
    try {
      const token = localStorage.getItem('hrms_token')
      const res = await fetch(`${API_BASE_URL}/companies/${company.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data) {
        setSelectedCompany(data.data)
      }
    } catch {
      // Keep list data on error
    } finally {
      setViewModalLoading(false)
    }
  }

  // Handle edit - fetch full company to get latest logo, then open modal
  const handleEdit = async (company) => {
    setEditingCompany(company)
    setModalVisible(true)
    // Pre-fill from list data first
    const logoPath = company.logoUrl || company.logo_url
    form.setFieldsValue({
      ...company,
      workingDaysConfig: company.workingDaysConfig || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      logoUrl: logoPath || undefined,
    })
    if (logoPath && company?.id) {
      // Use the direct API endpoint for reliable logo display
      const logoApiUrl = `${STORAGE_BASE_URL}/api/companies/${company.id}/logo?t=${Date.now()}`
      const logoStorageUrl = getStorageUrl(logoPath)
      setLogoFileList([
        { uid: '-1', name: 'logo', status: 'done', url: logoApiUrl, thumbUrl: logoStorageUrl },
      ])
    } else {
      setLogoFileList([])
    }
    // Fetch full company to get latest logo (in case list data is stale)
    if (company?.id) {
      try {
        const token = localStorage.getItem('hrms_token')
        const res = await fetch(`${API_BASE_URL}/companies/${company.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.data) {
          const fresh = data.data
          const freshLogo = fresh.logoUrl || fresh.logo_url
          if (freshLogo) {
            const logoApiUrl = `${STORAGE_BASE_URL}/api/companies/${fresh.id}/logo?t=${Date.now()}`
            const logoStorageUrl = getStorageUrl(freshLogo)
            setLogoFileList([
              { uid: '-1', name: 'logo', status: 'done', url: logoApiUrl, thumbUrl: logoStorageUrl },
            ])
            form.setFieldsValue({ logoUrl: freshLogo })
          }
          setEditingCompany(fresh)
          form.setFieldsValue({
            ...fresh,
            workingDaysConfig: fresh.workingDaysConfig || form.getFieldValue('workingDaysConfig'),
            logoUrl: freshLogo || form.getFieldValue('logoUrl'),
          })
        }
      } catch {
        // Keep list data on error
      }
    }
  }

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('hrms_token')
      const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        message.success('Company deleted successfully')
        fetchCompanies()
      } else {
        message.error(data.message || 'Failed to delete company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      message.error('Failed to delete company')
    }
  }

  // Handle add
  const handleAdd = () => {
    setEditingCompany(null)
    form.resetFields()
    setLogoFileList([])
    form.setFieldsValue({
      workingDaysConfig: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      currency: 'INR',
      payrollCycle: 'MONTHLY',
      payrollDay: 1,
      payslipTemplate: 'STANDARD',
      isActive: true,
    })
    setModalVisible(true)
  }

  // Handle logo upload (Edit modal)
  const handleLogoUpload = async (file) => {
    const isImage = file.type.startsWith('image/')
    const isLt5M = file.size / 1024 / 1024 < 5

    if (!isImage) {
      message.error('You can only upload image files!')
      return false
    }

    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!')
      return false
    }

    try {
      const token = localStorage.getItem('hrms_token')
      if (!token) {
        message.error('Please log in to upload')
        return false
      }

      let logoUrl = null

      // Try companies/upload/logo first
      const formDataLogo = new FormData()
      formDataLogo.append('logo', file)
      const resLogo = await fetch(`${API_BASE_URL}/companies/upload/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataLogo,
      })
      const dataLogo = await resLogo.json().catch(() => ({}))
      if (dataLogo.success && dataLogo.data?.url) {
        logoUrl = dataLogo.data.url
      } else {
        // Fallback: profile upload (saves to storage/documents)
        const formDataDoc = new FormData()
        formDataDoc.append('document', file)
        formDataDoc.append('field', 'companyLogo')
        const resDoc = await fetch(`${API_BASE_URL}/profile/upload/document`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formDataDoc,
        })
        const dataDoc = await resDoc.json().catch(() => ({}))
        if (dataDoc.success && dataDoc.data?.url) {
          logoUrl = dataDoc.data.url
        } else {
          message.error(dataLogo.message || dataDoc.message || 'Upload failed')
          return false
        }
      }

      form.setFieldsValue({ logoUrl })
      setLogoFileList([
        { uid: '-1', name: file.name, status: 'done', url: getStorageUrl(logoUrl) || logoUrl },
      ])
      message.success('Company logo uploaded! Click Update to save.')
    } catch (error) {
      console.error('Error uploading logo:', error)
      message.error(error.message || 'Upload failed! Please try again.')
    }
    return false
  }

  // Upload logo from View modal (when company has no logo)
  const handleLogoUploadFromView = async (file) => {
    if (!selectedCompany?.id) return false
    const isImage = file.type.startsWith('image/')
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isImage) {
      message.error('You can only upload image files!')
      return false
    }
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!')
      return false
    }
    setViewModalUploading(true)
    try {
      const token = localStorage.getItem('hrms_token')
      if (!token) {
        message.error('Please log in to upload')
        return false
      }

      let logoUrl = null
      const formDataLogo = new FormData()
      formDataLogo.append('logo', file)
      const resLogo = await fetch(`${API_BASE_URL}/companies/upload/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataLogo,
      })
      const dataLogo = await resLogo.json().catch(() => ({}))
      if (dataLogo.success && dataLogo.data?.url) {
        logoUrl = dataLogo.data.url
      } else {
        const formDataDoc = new FormData()
        formDataDoc.append('document', file)
        formDataDoc.append('field', 'companyLogo')
        const resDoc = await fetch(`${API_BASE_URL}/profile/upload/document`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formDataDoc,
        })
        const dataDoc = await resDoc.json().catch(() => ({}))
        if (dataDoc.success && dataDoc.data?.url) {
          logoUrl = dataDoc.data.url
        } else {
          message.error(dataLogo.message || dataDoc.message || 'Upload failed')
          return false
        }
      }

      const updateRes = await fetch(`${API_BASE_URL}/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ logoUrl }),
      })
      const updateData = await updateRes.json()
      if (updateData.success) {
        message.success('Company logo uploaded successfully!')
        setSelectedCompany({ ...selectedCompany, logoUrl })
        fetchCompanies()
      } else {
        message.error(updateData.message || 'Failed to save logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      message.error('Upload failed! Please try again.')
    } finally {
      setViewModalUploading(false)
    }
    return false
  }

  const columns = [
    {
      title: 'Company Code',
      dataIndex: 'companyCode',
      key: 'companyCode',
      sorter: (a, b) => a.companyCode.localeCompare(b.companyCode),
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
    },
    {
      title: 'Payroll Cycle',
      dataIndex: 'payrollCycle',
      key: 'payrollCycle',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this company?"
            description="This will deactivate the company. Employees assigned to this company will need to be reassigned."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <h2 style={{ margin: 0 }}>Company Management</h2>
                <p style={{ margin: '8px 0 0', color: '#666' }}>
                  Manage companies and their configurations
                </p>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={fetchCompanies}>
                    Refresh
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Add Company
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Filters */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8} md={6}>
              <Search
                placeholder="Search companies"
                allowClear
                onSearch={(value) => setFilters({ ...filters, search: value })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => setFilters({ ...filters, isActive: value !== undefined ? value : '' })}
              >
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Country"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => setFilters({ ...filters, country: value || '' })}
              >
                <Option value="India">India</Option>
                <Option value="USA">USA</Option>
                <Option value="UK">UK</Option>
              </Select>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={companies}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={editingCompany ? 'Edit Company' : 'Add Company'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingCompany(null)
            form.resetFields()
            setLogoFileList([])
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              currency: 'INR',
              payrollCycle: 'MONTHLY',
              payrollDay: 1,
              payslipTemplate: 'STANDARD',
              isActive: true,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input placeholder="Enter company name" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="address" label="Address">
              <TextArea rows={2} placeholder="Enter company address" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="city" label="City">
                  <Input placeholder="City" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="state" label="State">
                  <Input placeholder="State" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="country" label="Country">
                  <Input placeholder="Country" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="postalCode" label="Postal Code">
                  <Input placeholder="Postal Code" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="currency" label="Currency">
                  <Select>
                    <Option value="INR">INR (Indian Rupee)</Option>
                    <Option value="USD">USD (US Dollar)</Option>
                    <Option value="EUR">EUR (Euro)</Option>
                    <Option value="GBP">GBP (British Pound)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="phone" label="Phone">
                  <Input placeholder="Phone number" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                >
                  <Input placeholder="Email address" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="website" label="Website">
              <Input placeholder="https://www.example.com" />
            </Form.Item>

            <Form.Item name="logoUrl" noStyle>
              <Input style={{ display: 'none' }} />
            </Form.Item>
            <Form.Item label="Company Logo">
              {/* Show existing logo as plain img */}
              {logoFileList.length > 0 && logoFileList[0]?.url ? (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ position: 'relative', display: 'inline-block', width: 120, height: 120, border: '1px solid #d9d9d9', borderRadius: 8, backgroundColor: '#fafafa', overflow: 'hidden' }}>
                    <img
                      src={logoFileList[0].url}
                      alt="Company Logo"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                      onError={(e) => {
                        // Try storage URL as fallback
                        if (logoFileList[0]?.thumbUrl && !e.target.dataset.triedThumb) {
                          e.target.dataset.triedThumb = 'true'
                          e.target.src = logoFileList[0].thumbUrl
                        } else if (editingCompany?.id && !e.target.dataset.triedApi) {
                          e.target.dataset.triedApi = 'true'
                          e.target.src = `${STORAGE_BASE_URL}/api/companies/${editingCompany.id}/logo?t=${Date.now()}`
                        } else {
                          e.target.onerror = null
                          e.target.src = FALLBACK_SVG
                        }
                      }}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => {
                        setLogoFileList([])
                        form.setFieldsValue({ logoUrl: undefined })
                      }}
                    />
                  </div>
                </div>
              ) : null}
              {/* Upload button - shown when no logo or after removing */}
              {logoFileList.length === 0 && (
                <Upload
                  listType="picture-card"
                  fileList={[]}
                  beforeUpload={(file) => {
                    handleLogoUpload(file)
                    return false
                  }}
                  customRequest={() => {}}
                  showUploadList={false}
                  accept="image/*"
                  multiple={false}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              )}
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                PNG, JPG up to 5MB. Upload before saving.
              </Text>
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="registrationNumber" label="Registration Number">
                  <Input placeholder="Company registration number" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="taxId" label="Tax ID">
                  <Input placeholder="Tax identification number" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="employeeCodePrefix"
                  label="Employee Code Prefix"
                  tooltip="Used for auto-generated employee codes, e.g. AMPL → AMPL1, AMPL2, AMPL3"
                  normalize={(v) => (v ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v)}
                >
                  <Input placeholder="e.g. AMPL" maxLength={16} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="payrollCycle" label="Payroll Cycle">
                  <Select>
                    <Option value="MONTHLY">Monthly</Option>
                    <Option value="BIWEEKLY">Bi-Weekly</Option>
                    <Option value="WEEKLY">Weekly</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="payrollDay" label="Payroll Day">
                  <InputNumber min={1} max={31} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="payslipTemplate" label="Payslip Template">
                  <Select>
                    <Option value="STANDARD">Standard</Option>
                    <Option value="COMPACT">Compact</Option>
                    <Option value="DETAILED">Detailed</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="isActive" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingCompany ? 'Update' : 'Create'}
                </Button>
                <Button onClick={() => {
                  setModalVisible(false)
                  setEditingCompany(null)
                  form.resetFields()
                  setLogoFileList([])
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* View Company Modal */}
        <Modal
          title={
            <Space>
              <BankOutlined style={{ color: '#1890ff' }} />
              <span>Company Details</span>
            </Space>
          }
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false)
            setSelectedCompany(null)
          }}
          footer={[
            <Button
              key="edit"
              icon={<EditOutlined />}
              onClick={() => {
                setViewModalVisible(false)
                setSelectedCompany(null)
                handleEdit(selectedCompany)
              }}
            >
              Edit
            </Button>,
            <Button
              key="close"
              type="primary"
              onClick={() => {
                setViewModalVisible(false)
                setSelectedCompany(null)
              }}
            >
              Close
            </Button>,
          ]}
          width={800}
        >
          {selectedCompany && (
            <Spin spinning={viewModalLoading} tip="Loading company details...">
              <div style={{ padding: '8px 0', minHeight: 120 }}>
                <Descriptions
                  bordered
                  column={2}
                  size="middle"
                  labelStyle={{
                    fontWeight: 600,
                    backgroundColor: '#fafafa',
                    width: '35%',
                  }}
                  contentStyle={{
                    backgroundColor: '#fff',
                  }}
                >
                <Descriptions.Item label="Company Logo" span={2}>
                  {(selectedCompany.logoUrl || selectedCompany.logo_url) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={selectedCompany.id ? `${STORAGE_BASE_URL}/api/companies/${selectedCompany.id}/logo?t=${Date.now()}` : getStorageUrl(selectedCompany.logoUrl || selectedCompany.logo_url)}
                        alt={selectedCompany.companyName || 'Company Logo'}
                        width={120}
                        height={120}
                        style={{
                          objectFit: 'contain',
                          border: '1px solid #d9d9d9',
                          borderRadius: 8,
                          padding: 8,
                          backgroundColor: '#fafafa',
                        }}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = FALLBACK_SVG
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <Avatar
                        size={120}
                        icon={<BankOutlined />}
                        style={{
                          backgroundColor: '#1890ff',
                          fontSize: '48px',
                        }}
                      />
                      <div>
                        <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
                          No logo uploaded
                        </Text>
                        <Upload
                          beforeUpload={handleLogoUploadFromView}
                          showUploadList={false}
                          accept="image/*"
                          disabled={viewModalUploading}
                        >
                          <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            loading={viewModalUploading}
                          >
                            Upload Logo
                          </Button>
                        </Upload>
                      </div>
                    </div>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Company Code" span={1}>
                  <Text strong>{selectedCompany.companyCode || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Company Name" span={1}>
                  <Text strong>{selectedCompany.companyName || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status" span={1}>
                  <Tag color={selectedCompany.isActive ? 'green' : 'red'}>
                    {selectedCompany.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Currency" span={1}>
                  <Text>{selectedCompany.currency || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>
                  <Text>
                    {selectedCompany.address || 'N/A'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="City">
                  <Text>{selectedCompany.city || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="State">
                  <Text>{selectedCompany.state || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Country">
                  <Text>{selectedCompany.country || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Postal Code">
                  <Text>{selectedCompany.postalCode || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  <Text>{selectedCompany.phone || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Text copyable={{ text: selectedCompany.email }}>
                    {selectedCompany.email || 'N/A'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Website" span={2}>
                  {selectedCompany.website ? (
                    <Text>
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedCompany.website}
                      </a>
                    </Text>
                  ) : (
                    <Text>N/A</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Registration Number">
                  <Text>{selectedCompany.registrationNumber || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tax ID">
                  <Text>{selectedCompany.taxId || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payroll Cycle">
                  <Text>{selectedCompany.payrollCycle || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payroll Day">
                  <Text>{selectedCompany.payrollDay || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payslip Template">
                  <Text>{selectedCompany.payslipTemplate || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Working Days" span={2}>
                  {selectedCompany.workingDaysConfig ? (
                    <div>
                      {Object.entries(selectedCompany.workingDaysConfig).map(
                        ([day, isWorking]) => (
                          <Tag
                            key={day}
                            color={isWorking ? 'green' : 'default'}
                            style={{ marginBottom: 4 }}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}:{' '}
                            {isWorking ? 'Working' : 'Off'}
                          </Tag>
                        )
                      )}
                    </div>
                  ) : (
                    <Text>N/A</Text>
                  )}
                </Descriptions.Item>
                </Descriptions>
              </div>
            </Spin>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default CompanyManagement
