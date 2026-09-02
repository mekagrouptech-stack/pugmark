import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Divider,
  message,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  UserAddOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import DashboardLayout from '../../layouts/DashboardLayout'
import hrService from '../../features/hr/hrService'
import { generateInvoicePdf } from '../../utils/invoiceTemplate'

/**
 * Invoice Employees
 * -----------------------------------------------------------------------------
 * Daily-wage workers and contractors who work for the company but are NOT
 * registered as HRMS users — no login, no employee code, no CTC, and nothing to
 * do with payroll. They submit an invoice for the period worked.
 *
 * Each invoice has the two lines from the paper document: base charges
 * (monthly gross x work days) and overtime (hourly rate x hours). "Invoice PDF"
 * prints it in that same layout, ready to sign.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS_COLORS = {
  PENDING: 'orange',
  APPROVED: 'blue',
  PAID: 'green',
  REJECTED: 'red',
}

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Rejected', value: 'REJECTED' },
]

const CURRENCY_OPTIONS = [
  { label: 'QAR — Qatar Riyal', value: 'QAR' },
  { label: 'INR — Indian Rupee', value: 'INR' },
  { label: 'AED — UAE Dirham', value: 'AED' },
  { label: 'USD — US Dollar', value: 'USD' },
]

const money = (n, currency = 'QAR') =>
  `${currency} ${(Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const InvoiceEmployees = () => {
  const [invoices, setInvoices] = useState([])
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState(null)
  const [form] = Form.useForm()

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false)
  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  const [employeeForm] = Form.useForm()

  const currentYear = new Date().getFullYear()
  const monthOptions = MONTH_NAMES.map((name, i) => ({ label: name, value: i + 1 }))
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i + 1).map((y) => ({
    label: String(y),
    value: y,
  }))

  const load = async () => {
    try {
      setLoading(true)
      const [list, empList, sum, companyList] = await Promise.all([
        hrService.getInvoices(),
        hrService.getInvoiceEmployees(),
        hrService.getInvoiceSummary(),
        // The bill-to dropdown is a convenience, not the point of the page:
        // if companies cannot be read the rest must still load.
        hrService.getCompanies().catch(() => []),
      ])
      setInvoices((list || []).map((item) => ({ ...item, key: item.id })))
      setEmployees(empList || [])
      setSummary(sum || {})
      setCompanies(companyList || [])
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load invoices')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // ── Invoice employees (the people) ───────────────────────────────
  const handleAddEmployee = () => {
    setEditingEmployeeId(null)
    employeeForm.resetFields()
    employeeForm.setFieldsValue({ currency: 'QAR' })
    setEmployeeModalOpen(true)
  }

  const handleEditEmployee = (record) => {
    setEditingEmployeeId(record.id)
    employeeForm.setFieldsValue({ ...record })
    setEmployeeModalOpen(true)
  }

  const handleSaveEmployee = async () => {
    try {
      const values = await employeeForm.validateFields()
      setSaving(true)
      if (editingEmployeeId) {
        await hrService.updateInvoiceEmployee(editingEmployeeId, values)
        message.success('Invoice employee updated')
      } else {
        await hrService.createInvoiceEmployee(values)
        message.success('Invoice employee added')
      }
      setEmployeeModalOpen(false)
      load()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEmployee = async (id) => {
    try {
      await hrService.deleteInvoiceEmployee(id)
      message.success('Invoice employee deleted')
      load()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete')
    }
  }

  // ── Invoices ─────────────────────────────────────────────────────
  const handleAddInvoice = () => {
    if (employees.length === 0) {
      message.warning('Add an invoice employee first')
      return
    }
    setEditingInvoiceId(null)
    form.resetFields()
    form.setFieldsValue({
      // A single configured company is not a choice — pick it for them.
      companyId: companies.length === 1 ? companies[0].id : undefined,
      invoiceDate: dayjs(),
      month: new Date().getMonth() + 1,
      year: currentYear,
      currency: 'QAR',
      workDays: 0,
      overtimeHours: 0,
      status: 'PENDING',
    })
    setInvoiceModalOpen(true)
  }

  // Picking the person pre-fills their standing rates, work type and vehicle,
  // so a monthly invoice is usually just days + overtime hours.
  const handleEmployeePicked = (invoiceEmployeeId) => {
    const emp = employees.find((e) => e.id === invoiceEmployeeId)
    if (!emp) return
    form.setFieldsValue({
      currency: emp.currency || 'QAR',
      monthlyGross: emp.monthlyGross ?? undefined,
      overtimeRate: emp.overtimeRate ?? undefined,
      vehicleNo: emp.vehicleNo || undefined,
    })
    recalcTotals()
  }

  // Keep the amount columns in step with the rates as they are typed. Both
  // amounts stay editable — the paper invoices round overtime
  // (8.33 x 120 = 999.60 billed as 1,000.00) and the printed figure wins.
  const recalcTotals = () => {
    const v = form.getFieldsValue()
    const base = Number(v.monthlyGross) || 0
    const overtime = (Number(v.overtimeRate) || 0) * (Number(v.overtimeHours) || 0)
    form.setFieldsValue({
      baseAmount: base,
      overtimeAmount: Math.round(overtime * 100) / 100,
    })
  }

  const handleEditInvoice = (record) => {
    setEditingInvoiceId(record.id)
    form.setFieldsValue({
      invoiceEmployeeId: record.invoiceEmployeeId,
      companyId: record.companyId || undefined,
      invoiceNumber: record.invoiceNumber,
      invoiceDate: record.invoiceDate ? dayjs(record.invoiceDate) : null,
      month: record.month,
      year: record.year,
      periodFrom: record.periodFrom ? dayjs(record.periodFrom) : null,
      periodTo: record.periodTo ? dayjs(record.periodTo) : null,
      particulars: record.particulars,
      vehicleNo: record.vehicleNo,
      currency: record.currency,
      monthlyGross: record.monthlyGross,
      workDays: record.workDays,
      baseAmount: record.baseAmount,
      overtimeRate: record.overtimeRate,
      overtimeHours: record.overtimeHours,
      overtimeAmount: record.overtimeAmount,
      status: record.status,
      remarks: record.remarks,
    })
    setInvoiceModalOpen(true)
  }

  const handleSaveInvoice = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const payload = {
        ...values,
        invoiceDate: values.invoiceDate ? values.invoiceDate.format('YYYY-MM-DD') : null,
        periodFrom: values.periodFrom ? values.periodFrom.format('YYYY-MM-DD') : null,
        periodTo: values.periodTo ? values.periodTo.format('YYYY-MM-DD') : null,
      }
      if (editingInvoiceId) {
        await hrService.updateInvoice(editingInvoiceId, payload)
        message.success('Invoice updated')
      } else {
        await hrService.createInvoice(payload)
        message.success('Invoice recorded')
      }
      setInvoiceModalOpen(false)
      load()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInvoice = async (id) => {
    try {
      await hrService.deleteInvoice(id)
      message.success('Invoice deleted')
      load()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete')
    }
  }

  const handleDownloadPdf = async (record) => {
    try {
      await generateInvoicePdf(record)
    } catch (err) {
      message.error('Failed to generate the invoice PDF')
    }
  }

  // Totals only make sense when everything in view uses one currency.
  const singleCurrency =
    Array.isArray(summary.currencies) && summary.currencies.length === 1
      ? summary.currencies[0]
      : null

  const invoiceColumns = [
    {
      title: 'Invoice No.',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (value) => <strong>{value}</strong>,
    },
    { title: 'Name', dataIndex: 'employee', key: 'employee' },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '—'),
    },
    { title: 'Period', dataIndex: 'monthYear', key: 'monthYear' },
    {
      title: 'Work Days',
      dataIndex: 'workDays',
      key: 'workDays',
      align: 'center',
      render: (value) => Number(value) || '—',
    },
    {
      title: 'Base',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      align: 'right',
      render: (value, record) => money(value, record.currency),
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimeAmount',
      key: 'overtimeAmount',
      align: 'right',
      render: (value, record) =>
        Number(value) > 0 ? money(value, record.currency) : '—',
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (value, record) => (
        <strong style={{ color: '#16a34a' }}>{money(value, record.currency)}</strong>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: STATUS_OPTIONS.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
      render: (value) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<FilePdfOutlined />} onClick={() => handleDownloadPdf(record)}>
            Invoice PDF
          </Button>
          <Button type="link" onClick={() => handleEditInvoice(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this invoice?"
            onConfirm={() => handleDeleteInvoice(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const employeeColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Work Type',
      dataIndex: 'workType',
      key: 'workType',
      render: (value) => value || '—',
    },
    {
      title: 'Vehicle No.',
      dataIndex: 'vehicleNo',
      key: 'vehicleNo',
      render: (value) => value || '—',
    },
    {
      title: 'Monthly Gross',
      dataIndex: 'monthlyGross',
      key: 'monthlyGross',
      align: 'right',
      render: (value, record) => (value ? money(value, record.currency) : '—'),
    },
    {
      title: 'OT Rate / hr',
      dataIndex: 'overtimeRate',
      key: 'overtimeRate',
      align: 'right',
      render: (value, record) => (value ? money(value, record.currency) : '—'),
    },
    {
      title: 'Bank',
      dataIndex: 'bankName',
      key: 'bankName',
      render: (value, record) =>
        value ? (
          <div>
            <div>{value}</div>
            {record.accountNo && (
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.accountNo}</div>
            )}
          </div>
        ) : (
          '—'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEditEmployee(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this person?"
            onConfirm={() => handleDeleteEmployee(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
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
        <Card className="card-container">
          <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <h2 style={{ margin: 0 }}>Invoice Employees</h2>
              <p style={{ margin: '8px 0 0', color: '#666' }}>
                Daily-wage workers and contractors who bill by invoice
              </p>
            </Col>
            <Col>
              <Space wrap>
                <Button icon={<ReloadOutlined />} onClick={load}>
                  Refresh
                </Button>
                <Button icon={<UserAddOutlined />} onClick={handleAddEmployee}>
                  Add Person
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvoice}>
                  Add Invoice
                </Button>
              </Space>
            </Col>
          </Row>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
            message="These people are not registered employees"
            description="They have no login, no employee code and no CTC, and they never appear in payroll. Record the days they worked and their overtime here, then print the invoice for signing."
          />

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="People"
                  value={summary.invoiceEmployees || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Invoices"
                  value={summary.totalInvoices || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Paid"
                  value={summary.paidAmount || 0}
                  prefix={<CheckCircleOutlined />}
                  formatter={(value) =>
                    singleCurrency ? money(value, singleCurrency) : `${summary.paidCount || 0} invoice(s)`
                  }
                  valueStyle={{ color: '#16a34a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Pending"
                  value={summary.pendingAmount || 0}
                  prefix={<ClockCircleOutlined />}
                  formatter={(value) =>
                    singleCurrency
                      ? money(value, singleCurrency)
                      : `${summary.pendingCount || 0} invoice(s)`
                  }
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={invoiceColumns}
            dataSource={invoices}
            pagination={{ pageSize: 10 }}
            loading={loading}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText:
                employees.length === 0
                  ? 'No invoice employees yet. Click "Add Person" to add one.'
                  : 'No invoices recorded. Click "Add Invoice" to record one.',
            }}
          />
        </Card>

        <Card
          className="card-container"
          style={{ marginTop: 24 }}
          title={`People working on invoice (${employees.length})`}
        >
          <Table
            columns={employeeColumns}
            dataSource={employees.map((e) => ({ ...e, key: e.id }))}
            pagination={false}
            loading={loading}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Nobody added yet. Click "Add Person" above.' }}
          />
        </Card>

        {/* ── Add / edit an invoice ─────────────────────────────── */}
        <Modal
          title={editingInvoiceId ? 'Edit Invoice' : 'Add Invoice'}
          open={invoiceModalOpen}
          onCancel={() => setInvoiceModalOpen(false)}
          onOk={handleSaveInvoice}
          okText="Save"
          confirmLoading={saving}
          width={760}
          forceRender
        >
          <Form form={form} layout="vertical" onValuesChange={recalcTotals}>
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="companyId"
                  label="Company"
                  extra="Billed to this company — its name and address head the invoice PDF."
                  rules={[{ required: true, message: 'Select the company being billed' }]}
                >
                  <Select
                    placeholder="Select company"
                    showSearch
                    optionFilterProp="label"
                    options={companies.map((c) => ({
                      label: c.companyName,
                      value: c.id,
                    }))}
                    notFoundContent="No companies configured"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="invoiceEmployeeId"
                  label="Person"
                  rules={[{ required: true, message: 'Select a person' }]}
                >
                  <Select
                    placeholder="Select person"
                    showSearch
                    optionFilterProp="label"
                    disabled={!!editingInvoiceId}
                    onChange={handleEmployeePicked}
                    options={employees.map((e) => ({
                      label: e.workType ? `${e.name} — ${e.workType}` : e.name,
                      value: e.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="invoiceNumber"
                  label="Invoice Number"
                  rules={[{ required: true, message: 'Enter the invoice number' }]}
                >
                  <Input placeholder="e.g. ARE/2025-26/07" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="invoiceDate"
                  label="Invoice Date"
                  rules={[{ required: true, message: 'Select the date' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="month" label="Month" rules={[{ required: true }]}>
                  <Select options={monthOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="year" label="Year" rules={[{ required: true }]}>
                  <Select options={yearOptions} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="periodFrom" label="Period From">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="periodTo" label="Period To">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="vehicleNo" label="Vehicle No.">
                  <Input placeholder="e.g. 107810" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="particulars"
              label="Particulars"
              extra="Printed on line 1 of the invoice. Left blank, it is built from the work type and period."
            >
              <Input.TextArea rows={2} placeholder="Driver Charges (Qatar Site) ..." />
            </Form.Item>

            <Divider orientation="left" style={{ margin: '4px 0 12px' }}>
              Line 1 — Base Charges
            </Divider>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="monthlyGross" label="Monthly Gross">
                  <InputNumber style={{ width: '100%' }} min={0} step={100} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="workDays" label="Work Days">
                  <InputNumber style={{ width: '100%' }} min={0} max={31} step={1} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="baseAmount" label="Amount">
                  <InputNumber style={{ width: '100%' }} min={0} step={100} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" style={{ margin: '4px 0 12px' }}>
              Line 2 — Overtime
            </Divider>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="overtimeRate" label="Rate / hour">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="overtimeHours" label="Hours">
                  <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="overtimeAmount"
                  label="Amount"
                  extra="Auto-calculated — edit to match the billed figure"
                >
                  <InputNumber style={{ width: '100%' }} min={0} step={10} />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '4px 0 12px' }} />
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
                  <Select options={CURRENCY_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="status" label="Status">
                  <Select options={STATUS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="remarks" label="Remarks">
                  <Input placeholder="Optional" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item shouldUpdate noStyle>
              {() => {
                const v = form.getFieldsValue()
                const total = (Number(v.baseAmount) || 0) + (Number(v.overtimeAmount) || 0)
                return (
                  <Alert
                    type="success"
                    message={
                      <span style={{ fontSize: 15 }}>
                        <strong>Invoice Total: {money(total, v.currency || 'QAR')}</strong>
                      </span>
                    }
                  />
                )
              }}
            </Form.Item>
          </Form>
        </Modal>

        {/* ── Add / edit a person ───────────────────────────────── */}
        <Modal
          title={editingEmployeeId ? 'Edit Invoice Employee' : 'Add Invoice Employee'}
          open={employeeModalOpen}
          onCancel={() => setEmployeeModalOpen(false)}
          onOk={handleSaveEmployee}
          okText="Save"
          confirmLoading={saving}
          width={700}
          forceRender
        >
          <Form form={employeeForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: 'Enter their name' }]}
                >
                  <Input placeholder="e.g. Ajmal Rayaroth Edathil" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="phone" label="Phone">
                  <Input placeholder="Optional" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="address"
              label="Address"
              extra="Printed as the letterhead at the top of their invoice"
            >
              <Input.TextArea rows={2} placeholder="House, Post Office, District, Pin Code, State, Country" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="workType" label="Work Type">
                  <Input placeholder="e.g. Driver Charges (Qatar Site)" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="projectName" label="Project">
                  <Input placeholder="e.g. NFXP project trenching and Backfilling" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="vehicleNo" label="Vehicle No.">
                  <Input placeholder="e.g. 107810" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
                  <Select options={CURRENCY_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="monthlyGross" label="Monthly Gross">
                  <InputNumber style={{ width: '100%' }} min={0} step={100} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="overtimeRate"
              label="Overtime Rate / hour"
              extra="Both rates just pre-fill new invoices — they can be changed per invoice"
            >
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>

            <Divider orientation="left" style={{ margin: '4px 0 12px' }}>
              Bank Details (printed on the invoice)
            </Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="bankName" label="Bank Name">
                  <Input placeholder="e.g. Commercial Bank" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="bankSwift" label="Swift Code">
                  <Input placeholder="e.g. CBQAQAQA" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="accountNo" label="Account No.">
                  <Input placeholder="e.g. 4770-167608-101" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="iban" label="IBAN">
                  <Input placeholder="e.g. QA97C6QA400000004770167608101" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default InvoiceEmployees
