import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  App,
  Descriptions,
  Row,
  Col,
  Statistic,
  Divider,
  Typography,
  Spin,
  Alert,
} from 'antd'
import { generateSalarySlipPdf } from '../../utils/salarySlipTemplate'
import salaryService from '../../features/salary/salaryService'
import SalaryStructureView from '../../components/salary/SalaryStructureView'
import SalaryStructureEditor from '../../components/salary/SalaryStructureEditor'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPayroll, fetchEmployees, calculatePayroll, calculateAllPayroll } from '../../features/hr/hrSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import hrService from '../../features/hr/hrService'
import dayjs from 'dayjs'

const { Option } = Select
const { Title, Text } = Typography

const Payroll = () => {
  const dispatch = useDispatch()
  const { message } = App.useApp()
  const { payroll, loading, employees } = useSelector((state) => state.hr)
  const [generateModalVisible, setGenerateModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [attendancePreviewVisible, setAttendancePreviewVisible] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [pendingPayrollData, setPendingPayrollData] = useState(null)
  const [runAllModalVisible, setRunAllModalVisible] = useState(false)
  const [runAllLoading, setRunAllLoading] = useState(false)
  const [runSingleModalVisible, setRunSingleModalVisible] = useState(false)
  const [runSingleEmployee, setRunSingleEmployee] = useState(null)
  const [runSingleLoading, setRunSingleLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [runAllForm] = Form.useForm()
  const [runSingleForm] = Form.useForm()
  
  // Salary structure preview for the employee chosen in the Generate modal.
  // Fetched from /api/salary/structure/:userId — the SAME structure the salary
  // slip is generated from, so payroll can never be run against a different
  // breakup than the one the employee sees.
  const [employeeName, setEmployeeName] = useState('')
  const [previewStructure, setPreviewStructure] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  // Locally calculated structure shown while the CTC editor has unsaved changes.
  const [draftStructure, setDraftStructure] = useState(null)

  const loadStructurePreview = async (userId) => {
    if (!userId) {
      setPreviewStructure(null)
      return
    }
    setPreviewLoading(true)
    try {
      const data = await salaryService.getUserSalaryStructure(userId)
      setPreviewStructure(data || null)
    } catch (err) {
      setPreviewStructure(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  // The employee chosen in the Generate modal, watched so the inline salary
  // structure editor knows whose CTC it is setting.
  const selectedUserId = Form.useWatch('userId', form)

  useEffect(() => {
    dispatch(fetchPayroll())
    dispatch(fetchEmployees())
  }, [dispatch])

  // Debug: Log payroll data when it changes
  useEffect(() => {
    console.log('Payroll data updated:', {
      count: payroll?.length || 0,
      payroll: payroll,
    })
  }, [payroll])

  // Debug: Log employees data when it changes
  useEffect(() => {
    console.log('Employees data updated:', {
      count: employees?.length || 0,
      employees: employees,
    })
  }, [employees])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!generateModalVisible) {
      form.resetFields()
      form.setFieldsValue({
        month: undefined,
      })
    }
  }, [generateModalVisible, form])

  // ===== REAL PAYROLL DATA ONLY (NO MOCK DATA) =====
  // Transform backend payroll records into a UI-friendly shape
  const payrollData = (payroll || []).map((p) => {
    const monthName =
      p.payrollMonth && p.payrollYear
        ? new Date(p.payrollYear, p.payrollMonth - 1, 1).toLocaleString('default', { month: 'long' })
        : ''
    const monthLabel = p.payrollMonth && p.payrollYear ? `${monthName} ${p.payrollYear}` : 'N/A'

    const statusMap = {
      PENDING: 'Pending',
      PROCESSED: 'Processed',
      LOCKED: 'Locked',
      PAID: 'Paid',
    }

    return {
      ...p,
      employeeName: p.user?.name || '',
      employeeCode: p.user?.employeeCode || '',
      // monthlySalary is Monthly CTC. Gross and Net come from the salary
      // structure breakup stored on the payroll row (see
      // backend/utils/salaryStructure.js); older rows predate those columns and
      // fall back to the flat prorated figure.
      monthlyCTC: Number(p.monthlySalary || 0),
      grossSalary: p.grossEarned != null ? Number(p.grossEarned) : Number(p.finalSalary || 0),
      netSalary: p.netPayable != null ? Number(p.netPayable) : Number(p.finalSalary || 0),
      month: monthLabel,
      statusLabel: statusMap[p.status] || p.status || 'N/A',
    }
  })

  // Handle Run All Payroll
  const handleRunAllPayroll = async (values) => {
    if (!values.month) {
      message.error('Please select a month')
      return
    }
    const monthDate = dayjs(values.month)
    if (!monthDate.isValid()) {
      message.error('Invalid month selected')
      return
    }
    const year = monthDate.year()
    const month = monthDate.month() + 1
    const monthText = monthDate.format('MMMM YYYY')

    setRunAllLoading(true)
    message.loading(`Running payroll for all employees — ${monthText}...`, 0)
    try {
      const result = await dispatch(calculateAllPayroll({ year, month })).unwrap()
      message.destroy()
      const { processed, failed, skipped } = result.data || {}
      message.success(
        `Payroll done for ${monthText}: ${processed} processed, ${skipped} skipped, ${failed} failed.`
      )
      setRunAllModalVisible(false)
      runAllForm.resetFields()
      setTimeout(() => dispatch(fetchPayroll()), 500)
    } catch (error) {
      message.destroy()
      message.error(error || 'Failed to run payroll for all employees')
    } finally {
      setRunAllLoading(false)
    }
  }

  // Handle Run Single Employee Payroll (per-row)
  const handleOpenRunSingle = (record) => {
    setRunSingleEmployee(record)
    runSingleForm.resetFields()
    setRunSingleModalVisible(true)
  }

  const handleRunSinglePayroll = async (values) => {
    if (!values.month) {
      message.error('Please select a month')
      return
    }
    const monthDate = dayjs(values.month)
    if (!monthDate.isValid()) {
      message.error('Invalid month selected')
      return
    }
    const year = monthDate.year()
    const month = monthDate.month() + 1
    const monthText = monthDate.format('MMMM YYYY')

    setRunSingleLoading(true)
    message.loading(`Running payroll for ${runSingleEmployee?.employeeName}...`, 0)
    try {
      const result = await dispatch(
        calculatePayroll({ userId: runSingleEmployee.userId, year, month })
      ).unwrap()
      message.destroy()
      if (result && result.success !== false) {
        message.success(`Payroll generated for ${runSingleEmployee?.employeeName} — ${monthText}!`)
      } else {
        message.warning(result?.message || 'Payroll completed but no new record created.')
      }
      setRunSingleModalVisible(false)
      setRunSingleEmployee(null)
      runSingleForm.resetFields()
      setTimeout(() => dispatch(fetchPayroll()), 500)
    } catch (error) {
      message.destroy()
      message.error(error || 'Failed to run payroll')
    } finally {
      setRunSingleLoading(false)
    }
  }

  // Handle Generate Payroll
  const handleGeneratePayroll = () => {
    // Reset form and clear any date values
    form.resetFields()
    form.setFieldsValue({
      month: null, // Explicitly set to null to avoid invalid date objects
    })
    setGenerateModalVisible(true)
  }

  const handleGenerateSubmit = async (values) => {
    try {
      // Validate required fields
      if (!values.userId) {
        message.error('Please select an employee')
        return
      }

      if (!values.month) {
        message.error('Please select a month')
        return
      }

      message.loading('Generating payroll...', 0)

      // Get selected employee for display / future API call
      const selectedEmp = (employees || []).find((e) => e.id === values.userId)
      if (selectedEmp) {
        setEmployeeName(selectedEmp.name || selectedEmp.employeeCode || '')
      }

      // Format month for display (handle dayjs object)
      let monthText = 'selected month'
      let year, month
      
      if (values.month) {
        try {
          // Convert to dayjs if not already
          const monthDate = dayjs(values.month)
          if (monthDate && typeof monthDate.isValid === 'function' && monthDate.isValid()) {
            monthText = monthDate.format('MMMM YYYY')
            year = monthDate.year()
            month = monthDate.month() + 1 // 0-based -> 1-12
          } else {
            message.destroy()
            message.error('Invalid month selected. Please try again.')
            return
          }
        } catch (e) {
          console.error('Error formatting month:', e)
          message.destroy()
          message.error('Error processing month. Please try again.')
          return
        }
      } else {
        message.destroy()
        message.error('Please select a month')
        return
      }

      console.log('Checking attendance before payroll generation:', { userId: values.userId, year, month })

      // First, fetch attendance summary
      message.destroy()
      message.loading('Checking attendance...', 0)

      try {
        const attendanceData = await hrService.getAttendanceSummary({
          userId: values.userId,
          year,
          month,
        })

        message.destroy()

        // Store attendance summary and pending payroll data
        setAttendanceSummary(attendanceData)
        setPendingPayrollData({ userId: values.userId, year, month, monthText })
        
        // Show attendance preview modal
        setAttendancePreviewVisible(true)
        setGenerateModalVisible(false)
      } catch (error) {
        message.destroy()
        console.error('Error fetching attendance:', error)
        message.error(error.message || 'Failed to fetch attendance data. Please check attendance records first.')
      }
    } catch (error) {
      message.destroy()
      console.error('Error generating payroll:', error)
      
      // Extract error message
      let errorMessage = 'Failed to generate payroll'
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      message.error(errorMessage)
    }
  }

  // Handle View Payroll
  const handleViewPayroll = (record) => {
    setSelectedPayroll(record)
    setViewModalVisible(true)
  }

  // Handle Edit Payroll
  const handleEditPayroll = (record) => {
    setSelectedPayroll(record)
    form.setFieldsValue({
      ...record,
      month: record.month,
      status: record.status,
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async (values) => {
    try {
      message.loading('Updating payroll...', 0)
      
      // TODO: Replace with real API call to update payroll
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // After backend is implemented, re-fetch real data
      dispatch(fetchPayroll())
      
      message.destroy()
      message.success('Payroll updated successfully!')
      setEditModalVisible(false)
      setSelectedPayroll(null)
      form.resetFields()
    } catch (error) {
      message.destroy()
      message.error('Failed to update payroll')
    }
  }

  // Helper function to format currency in Indian format
  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Handle Download Payslip - renders the LATEST salary-slip design
  // (see src/utils/salarySlipTemplate.js) using the employee's CTC structure and
  // the attendance/leave summary for this payroll's month.
  const handleDownloadPayslip = async (record) => {
    try {
      message.loading('Generating salary slip PDF...', 0)
      const userId = record.userId || record.user?.id
      const month = record.payrollMonth
      const year = record.payrollYear
      if (!userId) throw new Error('Missing employee id on payroll record')
      const structure = await salaryService.getUserSalaryStructure(userId, { month, year })
      await generateSalarySlipPdf(structure)
      message.destroy()
      message.success('Salary slip downloaded successfully!')
    } catch (error) {
      message.destroy()
      console.error('Error generating PDF:', error)
      message.error('Failed to generate salary slip PDF. Please try again.')
    }
  }


  // Handle Export to Excel
  const handleExportExcel = () => {
    try {
      // Always use real payroll data (already transformed above)
      const dataToExport = payrollData

      if (!dataToExport || dataToExport.length === 0) {
        message.warning('No payroll data to export')
        return
      }

      message.loading('Exporting payroll to Excel...', 0)

      // Prepare data for Excel export. Columns mirror the salary structure
      // stored on each payroll row (backend/utils/salaryStructure.js), so the
      // export, the payslip and the on-screen figures always agree.
      const excelData = dataToExport.map((record, index) => {
        const user = record.User || record.user || {}
        const employeeName = user.name || record.employeeName || record.name || 'N/A'
        const employeeCode = user.employeeCode || record.employeeCode || 'N/A'
        const month = record.month || 'N/A'
        const num = (v) => (v == null ? 0 : Number(v))

        return {
          'S.No': index + 1,
          'Employee Name': employeeName,
          'Employee Code': employeeCode,
          'Month': month,
          'Monthly CTC': num(record.monthlySalary),
          'Basic': num(record.basic),
          'HRA': num(record.hra),
          'Special Allowance': num(record.specialAllowance),
          'Bonus': num(record.bonus),
          'Gross Earned': num(record.grossEarned ?? record.finalSalary),
          'Employee PF': num(record.employeePF),
          'Professional Tax': num(record.professionalTax),
          'Total Deductions': num(record.totalDeductions),
          'Net Payable': num(record.netPayable ?? record.finalSalary),
          'Employer PF': num(record.employerPF),
          'Gratuity': num(record.gratuity),
          'Status': record.status || 'N/A',
          'Payable Days': record.payableDays ?? 'N/A',
          'LOP Days': record.lopDays ?? 'N/A',
        }
      })

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Data')

      // Set column widths (must stay in step with excelData's keys above)
      const columnWidths = [
        { wch: 8 },  // S.No
        { wch: 25 }, // Employee Name
        { wch: 15 }, // Employee Code
        { wch: 18 }, // Month
        { wch: 14 }, // Monthly CTC
        { wch: 12 }, // Basic
        { wch: 12 }, // HRA
        { wch: 18 }, // Special Allowance
        { wch: 12 }, // Bonus
        { wch: 14 }, // Gross Earned
        { wch: 14 }, // Employee PF
        { wch: 16 }, // Professional Tax
        { wch: 16 }, // Total Deductions
        { wch: 14 }, // Net Payable
        { wch: 14 }, // Employer PF
        { wch: 12 }, // Gratuity
        { wch: 12 }, // Status
        { wch: 12 }, // Payable Days
        { wch: 12 }, // LOP Days
      ]
      worksheet['!cols'] = columnWidths

      // Generate filename with current date
      const currentDate = dayjs().format('YYYY-MM-DD')
      const fileName = `Payroll_Export_${currentDate}.xlsx`

      // Write file
      XLSX.writeFile(workbook, fileName)
      message.destroy()
      message.success('Payroll data exported to Excel successfully!')
    } catch (error) {
      message.destroy()
      console.error('Error exporting to Excel:', error)
      message.error('Failed to export payroll data to Excel')
    }
  }

  // Handle Refresh
  const handleRefresh = () => {
    dispatch(fetchPayroll())
    message.success('Payroll data refreshed!')
  }

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      sorter: (a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''),
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      key: 'grossSalary',
      render: (amount) => `₹${amount?.toLocaleString() || '0'}`,
      sorter: (a, b) => (a.grossSalary || 0) - (b.grossSalary || 0),
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (amount) => `₹${amount?.toLocaleString() || '0'}`,
      sorter: (a, b) => (a.netSalary || 0) - (b.netSalary || 0),
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      sorter: (a, b) => a.month.localeCompare(b.month),
    },
    {
      title: 'Status',
      dataIndex: 'statusLabel',
      key: 'status',
      render: (status) => {
        const colorMap = {
          Processed: 'green',
          Pending: 'orange',
          Draft: 'blue',
          Failed: 'red',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
      filters: [
        { text: 'Processed', value: 'Processed' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Draft', value: 'Draft' },
      ],
      onFilter: (value, record) => record.statusLabel === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleOpenRunSingle(record)}
          >
            Run Payroll
          </Button>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewPayroll(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditPayroll(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPayslip(record)}
          >
            Download
          </Button>
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
                <h2 style={{ margin: 0 }}>Payroll Management</h2>
                <p style={{ margin: '8px 0 0', color: '#666' }}>
                  Manage employee payroll and payslips
                </p>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                    Refresh
                  </Button>
                  <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
                    Export Excel
                  </Button>
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={() => navigate('/hr/invoice-employees')}
                  >
                    Invoice Employees
                  </Button>
                  <Button
                    icon={<TeamOutlined />}
                    onClick={() => { runAllForm.resetFields(); setRunAllModalVisible(true) }}
                  >
                    Run All Payroll
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleGeneratePayroll}>
                    Generate Payroll
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Summary Statistics */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Employees"
                  value={payrollData.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Processed"
                  value={payrollData.filter((p) => p.statusLabel === 'Processed' || p.statusLabel === 'Paid' || p.statusLabel === 'Locked').length}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Pending"
                  value={payrollData.filter((p) => p.statusLabel === 'Pending').length}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Payroll"
                  prefix="₹"
                  value={payrollData.reduce((sum, p) => sum + (p.netSalary || 0), 0).toLocaleString()}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={payrollData}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>

        {/* Generate Payroll Modal - Full Salary Structure Form */}
        <Modal
          title={
            <Title level={4} style={{ margin: 0 }}>
              Salary Structure {employeeName ? `- ${employeeName}` : ''}
            </Title>
          }
          open={generateModalVisible}
          onCancel={() => {
            setGenerateModalVisible(false)
            form.resetFields()
            form.setFieldsValue({
              month: null,
            })
          }}
          footer={null}
          width={1400}
          style={{ top: 20 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerateSubmit}
            style={{ maxHeight: '80vh', overflowY: 'auto' }}
            initialValues={{
              month: null,
            }}
          >
            {/* Month and Employee Selection */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="month"
                  label="Select Month"
                  rules={[{ required: true, message: 'Please select month' }]}
                >
                  <DatePicker
                    picker="month"
                    style={{ width: '100%' }}
                    format="MMMM YYYY"
                    placeholder="Select month"
                    allowClear
                    disabledDate={(current) => {
                      // Disable future months
                      return current && current > dayjs().endOf('month')
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="userId"
                  label="Select Employee"
                  rules={[{ required: true, message: 'Please select employee' }]}
                >
                  <Select
                    placeholder={loading ? 'Loading employees...' : 'Select employee'}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    loading={loading}
                    notFoundContent={
                      loading
                        ? 'Loading employees...'
                        : employees?.length === 0
                        ? 'No employees found. Please ensure employees are created and active.'
                        : 'No employees match your search'
                    }
                    onChange={(value) => {
                      const emp = (employees || []).find((e) => e.id === value)
                      if (emp) {
                        setEmployeeName(emp.name || emp.employeeCode || '')
                      }
                      loadStructurePreview(value)
                    }}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {employees && employees.length > 0 ? (
                      employees.map((emp) => (
                        <Option key={emp.id} value={emp.id}>
                          {emp.name || emp.employeeCode || `Employee ${emp.id}`} ({emp.employeeCode || 'N/A'})
                        </Option>
                      ))
                    ) : (
                      !loading && (
                        <Option disabled value="no-employees">
                          No employees available
                        </Option>
                      )
                    )}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Salary structure — identical to the salary slip. The figures
                come from /api/salary/structure/:userId, the same source the
                slip PDF and the employee's My Salary page use; the editor above
                them sets the Monthly CTC and PF flag they are derived from. */}
            <Divider orientation="left" style={{ marginTop: 8 }}>
              Salary Structure
            </Divider>
            {selectedUserId && (
              <SalaryStructureEditor
                userId={selectedUserId}
                structure={previewStructure}
                onSaved={() => loadStructurePreview(selectedUserId)}
                onPreview={setDraftStructure}
              />
            )}
            {!previewStructure && !draftStructure && !previewLoading ? (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
                message="Select an employee to preview their salary structure"
                description="Payroll is calculated from the company CTC structure, prorated by attendance. Earnings scale with payable days; Professional Tax is flat and PF follows the earned Basic up to the statutory ceiling."
              />
            ) : previewLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                <SalaryStructureView
                  structure={draftStructure || previewStructure}
                  showBanner={false}
                />
              </div>
            )}

            {/* Form Actions */}
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />}>
                  Generate Payroll
                </Button>
                <Button onClick={() => setGenerateModalVisible(false)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* View Payroll Modal */}
        <Modal
          title={`Payroll Details - ${selectedPayroll?.employeeName}`}
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false)
            setSelectedPayroll(null)
          }}
          footer={[
            <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadPayslip(selectedPayroll)}>
              Download Payslip
            </Button>,
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Close
            </Button>,
          ]}
          width={700}
        >
          {selectedPayroll && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Employee Name">
                {selectedPayroll.employeeName}
              </Descriptions.Item>
              <Descriptions.Item label="Employee Code">
                {selectedPayroll.employeeCode}
              </Descriptions.Item>
              <Descriptions.Item label="Month">
                {selectedPayroll.month}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedPayroll.status === 'Processed' ? 'green' : 'orange'}>
                  {selectedPayroll.status}
                </Tag>
              </Descriptions.Item>
              {/* Structure breakup as stored on the payroll row — the same
                  components the salary slip prints, prorated by attendance. */}
              <Descriptions.Item label="Monthly CTC">
                ₹{Number(selectedPayroll.monthlySalary || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Gross Earned">
                ₹{Number(selectedPayroll.grossSalary || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Basic">
                ₹{Number(selectedPayroll.basic || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="HRA">
                ₹{Number(selectedPayroll.hra || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Special Allowance">
                ₹{Number(selectedPayroll.specialAllowance || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Bonus">
                ₹{Number(selectedPayroll.bonus || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Employee PF">
                ₹{Number(selectedPayroll.employeePF || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Professional Tax">
                ₹{Number(selectedPayroll.professionalTax || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Total Deductions">
                ₹{Number(selectedPayroll.totalDeductions || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Net Payable">
                <strong>₹{Number(selectedPayroll.netSalary || 0).toLocaleString('en-IN')}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Employer PF">
                ₹{Number(selectedPayroll.employerPF || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Gratuity">
                ₹{Number(selectedPayroll.gratuity || 0).toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Paid Date" span={2}>
                {selectedPayroll.paidDate || 'Not Paid'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Edit Payroll Modal */}
        <Modal
          title={`Edit Payroll - ${selectedPayroll?.employeeName}`}
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false)
            setSelectedPayroll(null)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleEditSubmit}
          >
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value="Draft">Draft</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Processed">Processed</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="netSalary"
              label="Net Salary"
              rules={[{ required: true, message: 'Please enter net salary' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="grossSalary"
              label="Gross Salary"
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Update Payroll
                </Button>
                <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Attendance Preview Modal - Show before generating payroll */}
        <Modal
          title={
            <Title level={4} style={{ margin: 0 }}>
              Attendance Summary - {pendingPayrollData?.monthText || 'Selected Month'}
            </Title>
          }
          open={attendancePreviewVisible}
          onCancel={() => {
            setAttendancePreviewVisible(false)
            setAttendanceSummary(null)
            setPendingPayrollData(null)
            setGenerateModalVisible(true)
          }}
          footer={[
            <Button
              key="back"
              onClick={() => {
                setAttendancePreviewVisible(false)
                setAttendanceSummary(null)
                setPendingPayrollData(null)
                setGenerateModalVisible(true)
              }}
            >
              Back
            </Button>,
            <Button
              key="generate"
              type="primary"
              onClick={async () => {
                if (!pendingPayrollData) return

                try {
                  message.loading('Generating payroll...', 0)

                  // Call backend to actually calculate payroll
                  const result = await dispatch(
                    calculatePayroll({
                      userId: pendingPayrollData.userId,
                      year: pendingPayrollData.year,
                      month: pendingPayrollData.month,
                    })
                  ).unwrap()

                  message.destroy()

                  console.log('Payroll calculation result:', result)

                  // Check if payroll was actually created
                  if (result && result.success !== false) {
                    if (result.data) {
                      message.success(`Payroll generated successfully for ${pendingPayrollData.monthText}!`)
                    } else {
                      message.warning(
                        result.message || 'Payroll calculation completed, but no new payroll was created (may already exist).'
                      )
                    }
                  } else {
                    message.warning(result?.message || 'Payroll calculation completed, but no new payroll was created.')
                  }

                  setAttendancePreviewVisible(false)
                  setAttendanceSummary(null)
                  setPendingPayrollData(null)
                  form.resetFields()

                  // Refresh payroll list - wait a bit to ensure database is updated
                  setTimeout(() => {
                    dispatch(fetchPayroll())
                  }, 500)
                } catch (error) {
                  message.destroy()
                  console.error('Error generating payroll:', error)
                  message.error(error.message || 'Failed to generate payroll')
                }
              }}
            >
              Generate Payroll
            </Button>,
          ]}
          width={700}
        >
          {attendanceSummary && (
            <div>
              <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                Please review the attendance summary before generating the payslip:
              </Text>

              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Total Working Days" span={2}>
                  <Text strong>{attendanceSummary.totalWorkingDays || 0} days</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Full Days (Present)">
                  <Text style={{ color: '#52c41a' }}>{attendanceSummary.fullDays || 0} days</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Half Days">
                  <Text style={{ color: '#faad14' }}>{attendanceSummary.halfDays || 0} days</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Absent Days">
                  <Text style={{ color: '#ff4d4f' }}>{attendanceSummary.absentDays || 0} days</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payable Days" span={2}>
                  <Text strong style={{ fontSize: 16 }}>
                    {(
                      (attendanceSummary.fullDays || 0) +
                      (attendanceSummary.halfDays || 0) * 0.5
                    ).toFixed(2)}{' '}
                    days
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              {attendanceSummary.absentDays > 0 && (
                <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4 }}>
                  <Text type="warning">
                    ⚠️ Note: Employee has {attendanceSummary.absentDays} absent day(s). Salary will be calculated based on
                    payable days.
                  </Text>
                </div>
              )}

              {attendanceSummary.fullDays === 0 && attendanceSummary.halfDays === 0 && (
                <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff1f0', borderRadius: 4 }}>
                  <Text type="danger">
                    ⚠️ Warning: No attendance records found for this month. Please verify attendance data before
                    generating payroll.
                  </Text>
                </div>
              )}
            </div>
          )}
        </Modal>
        {/* Run All Payroll Modal */}
        <Modal
          title={
            <Space>
              <TeamOutlined style={{ color: '#1890ff' }} />
              <span>Run Payroll for All Employees</span>
            </Space>
          }
          open={runAllModalVisible}
          onCancel={() => { setRunAllModalVisible(false); runAllForm.resetFields() }}
          footer={null}
          width={420}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
            This will calculate payroll for <strong>all active employees</strong> for the selected month.
            Existing payroll records will be updated.
          </Text>
          <Form form={runAllForm} layout="vertical" onFinish={handleRunAllPayroll}>
            <Form.Item
              name="month"
              label="Select Month"
              rules={[{ required: true, message: 'Please select a month' }]}
            >
              <DatePicker
                picker="month"
                style={{ width: '100%' }}
                format="MMMM YYYY"
                placeholder="Select month"
                disabledDate={(current) => current && current > dayjs().endOf('month')}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => { setRunAllModalVisible(false); runAllForm.resetFields() }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<TeamOutlined />}
                  loading={runAllLoading}
                >
                  Run Payroll for All
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Run Single Employee Payroll Modal */}
        <Modal
          title={
            <Space>
              <PlayCircleOutlined style={{ color: '#52c41a' }} />
              <span>Run Payroll — {runSingleEmployee?.employeeName}</span>
            </Space>
          }
          open={runSingleModalVisible}
          onCancel={() => { setRunSingleModalVisible(false); setRunSingleEmployee(null); runSingleForm.resetFields() }}
          footer={null}
          width={420}
        >
          {runSingleEmployee && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f6f6f6', borderRadius: 6 }}>
              <Text strong>{runSingleEmployee.employeeName}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>({runSingleEmployee.employeeCode})</Text>
            </div>
          )}
          <Form form={runSingleForm} layout="vertical" onFinish={handleRunSinglePayroll}>
            <Form.Item
              name="month"
              label="Select Month"
              rules={[{ required: true, message: 'Please select a month' }]}
            >
              <DatePicker
                picker="month"
                style={{ width: '100%' }}
                format="MMMM YYYY"
                placeholder="Select month"
                disabledDate={(current) => current && current > dayjs().endOf('month')}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => { setRunSingleModalVisible(false); setRunSingleEmployee(null); runSingleForm.resetFields() }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlayCircleOutlined />}
                  loading={runSingleLoading}
                >
                  Run Payroll
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default Payroll
