import React, { useEffect, useMemo, useState } from 'react'
import { Card, Table, Button, Space, Select, DatePicker, Tag, message } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import DashboardLayout from '../../layouts/DashboardLayout'
import hrService from '../../features/hr/hrService'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const statusColor = {
  PAID: 'green',
  PROCESSED: 'blue',
  LOCKED: 'purple',
  PENDING: 'orange',
}

const formatCurrency = (value) => {
  const num = Number(value) || 0
  return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const SalaryReports = () => {
  const [loading, setLoading] = useState(false)
  const [payrolls, setPayrolls] = useState([])
  const [monthFilter, setMonthFilter] = useState(dayjs())
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      const params = {}
      if (monthFilter) {
        params.month = monthFilter.month() + 1
        params.year = monthFilter.year()
      }
      const data = await hrService.getPayroll(params)
      setPayrolls(Array.isArray(data) ? data : [])
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load salary records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [monthFilter])

  const filteredData = useMemo(() => {
    const rows = payrolls.map((p) => ({
      key: p.id,
      employee: p.user?.name || '—',
      employeeCode: p.user?.employeeCode || '—',
      department: p.user?.department || '—',
      designation: p.user?.designation || '—',
      month: `${MONTH_NAMES[(p.payrollMonth || 1) - 1]} ${p.payrollYear || ''}`.trim(),
      monthlySalary: p.monthlySalary, // Monthly CTC
      workingDays: p.totalWorkingDays,
      payableDays: p.payableDays,
      lopDays: p.lopDays,
      // Salary structure breakup stored on the payroll row — the same
      // components the salary slip prints. Older rows predate these columns.
      basic: p.basic,
      hra: p.hra,
      grossEarned: p.grossEarned ?? p.finalSalary,
      employeePF: p.employeePF,
      professionalTax: p.professionalTax,
      totalDeductions: p.totalDeductions,
      finalSalary: p.netPayable ?? p.finalSalary,
      status: p.status || 'PENDING',
    }))
    if (statusFilter === 'ALL') return rows
    return rows.filter((r) => r.status === statusFilter)
  }, [payrolls, statusFilter])

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee', fixed: 'left', width: 180 },
    { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 120 },
    { title: 'Department', dataIndex: 'department', key: 'department', width: 140 },
    { title: 'Designation', dataIndex: 'designation', key: 'designation', width: 140 },
    { title: 'Month', dataIndex: 'month', key: 'month', width: 140 },
    {
      title: 'Monthly CTC',
      dataIndex: 'monthlySalary',
      key: 'monthlySalary',
      width: 150,
      render: formatCurrency,
    },
    { title: 'Working Days', dataIndex: 'workingDays', key: 'workingDays', width: 120 },
    { title: 'Payable Days', dataIndex: 'payableDays', key: 'payableDays', width: 120 },
    { title: 'LOP Days', dataIndex: 'lopDays', key: 'lopDays', width: 100 },
    { title: 'Basic', dataIndex: 'basic', key: 'basic', width: 130, render: formatCurrency },
    { title: 'HRA', dataIndex: 'hra', key: 'hra', width: 130, render: formatCurrency },
    {
      title: 'Gross Earned',
      dataIndex: 'grossEarned',
      key: 'grossEarned',
      width: 150,
      render: formatCurrency,
    },
    {
      title: 'Employee PF',
      dataIndex: 'employeePF',
      key: 'employeePF',
      width: 140,
      render: formatCurrency,
    },
    {
      title: 'Prof. Tax',
      dataIndex: 'professionalTax',
      key: 'professionalTax',
      width: 130,
      render: formatCurrency,
    },
    {
      title: 'Total Deductions',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      width: 160,
      render: formatCurrency,
    },
    {
      title: 'Net Payable',
      dataIndex: 'finalSalary',
      key: 'finalSalary',
      width: 150,
      render: formatCurrency,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s) => <Tag color={statusColor[s] || 'default'}>{s}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: () => (
        <Button type="link" icon={<DownloadOutlined />} size="small">
          Download
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">List Salary Reports</h1>
          <p className="page-description">View salaries of all users</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }} wrap>
            <DatePicker
              picker="month"
              value={monthFilter}
              onChange={setMonthFilter}
              allowClear={false}
              format="MMMM YYYY"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'PROCESSED', label: 'Processed' },
                { value: 'LOCKED', label: 'Locked' },
                { value: 'PAID', label: 'Paid' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchPayrolls}>
              Refresh
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1500 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default SalaryReports
