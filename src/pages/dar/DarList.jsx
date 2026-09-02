import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Select, DatePicker, Input, message, Modal, Form, Tooltip } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { formatDate } from '../../utils/attendanceTimeUtils'
import { fetchDarList, fetchProjects } from '../../features/dar/darSlice'
import darService from '../../features/dar/darService'
import DashboardLayout from '../../layouts/DashboardLayout'
import ActionButton from '../../components/common/ActionButton'
import ButtonGroup from '../../components/common/ButtonGroup'
import usePagination from '../../hooks/usePagination'
import { getTablePagination } from '../../components/common/TablePagination'

const { RangePicker } = DatePicker
const { Search } = Input

const DarList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { darList, projects, loading } = useSelector((state) => state.dar)
  const [filters, setFilters] = useState({
    dateRange: null,
    project: undefined,
    status: undefined,
    search: '',
  })
  const [exportLoading, setExportLoading] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportForm] = Form.useForm()
  
  // Pagination hook - resets when filters change
  const { pagination, handleTableChange, setTotal } = usePagination(1, 10, [
    filters.dateRange,
    filters.project,
    filters.status,
    filters.search,
  ])

  useEffect(() => {
    dispatch(fetchDarList())
    dispatch(fetchProjects())
  }, [dispatch])

  // Update total when data changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    const params = {}
    if (newFilters.dateRange && newFilters.dateRange.length === 2) {
      params.dateFrom = newFilters.dateRange[0].format('YYYY-MM-DD')
      params.dateTo = newFilters.dateRange[1].format('YYYY-MM-DD')
    }
    if (newFilters.project) {
      params.project = newFilters.project
    }
    if (newFilters.status) {
      params.status = newFilters.status
    }

    dispatch(fetchDarList(params))
  }

  const handleView = (record) => {
    navigate(`/dar/view/${record.id}`)
  }

  const handleEdit = (record) => {
    navigate(`/dar/edit/${record.id}`)
  }

  const openExportModal = () => {
    exportForm.setFieldsValue({
      dateRange: filters.dateRange || null,
      project: filters.project,
      status: filters.status,
    })
    setExportModalOpen(true)
  }

  const runExport = async () => {
    try {
      setExportLoading(true)
      const values = exportForm.getFieldsValue()
      const params = {}
      if (values.dateRange && values.dateRange.length === 2) {
        params.dateFrom = values.dateRange[0].format('YYYY-MM-DD')
        params.dateTo = values.dateRange[1].format('YYYY-MM-DD')
      }
      if (values.status) params.status = values.status

      let dataToExport = await darService.getDarList(params)
      if (values.project) {
        dataToExport = dataToExport.filter((item) => item.project === values.project)
      }
      if (dataToExport.length === 0) {
        message.warning('No DAR data match the selected filters')
        return
      }

      const escapeCsv = (val) => {
        const str = String(val ?? '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const headers = [
        'Date',
        'Project',
        'Employee',
        'Department',
        'Designation',
        'Total Hours',
        'Start Time',
        'End Time',
        'Task Category',
        'Activity Description',
        'Remarks',
        'Issues Faced',
        'Status',
        'Submitted At',
        'Created At',
      ]

      const rows = dataToExport.map((item) => [
        item.date || '',
        item.project || '',
        item.employeeName || '',
        item.department || '',
        item.designation || '',
        item.totalHours ?? '',
        item.startTime || '',
        item.endTime || '',
        item.taskCategory || '',
        (item.activityDescription || '').replace(/\n/g, ' '),
        (item.remarks || '').replace(/\n/g, ' '),
        (item.issuesFaced || '').replace(/\n/g, ' '),
        item.status || '',
        item.submittedAt ? dayjs(item.submittedAt).format('YYYY-MM-DD HH:mm') : '',
        item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : '',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `DAR_Report_${dayjs().format('YYYY-MM-DD_HHmm')}.csv`
      link.click()
      URL.revokeObjectURL(url)

      setExportModalOpen(false)
      message.success(`DAR list exported successfully (${dataToExport.length} records)`)
    } catch (error) {
      console.error('Export failed:', error)
      message.error('Failed to export DAR list')
    } finally {
      setExportLoading(false)
    }
  }

  const handleExport = () => openExportModal()

  const getStatusColor = (status) => {
    const colorMap = {
      Draft: 'default',
      Submitted: 'processing',
      Approved: 'success',
      Rejected: 'error',
    }
    return colorMap[status] || 'default'
  }

  const filteredData = darList.filter((item) => {
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        item.project?.toLowerCase().includes(searchLower) ||
        item.date?.includes(searchLower)
      if (!matchesSearch) return false
    }

    // Apply status filter
    if (filters.status && item.status !== filters.status) {
      return false
    }

    // Apply project filter
    if (filters.project && item.project !== filters.project) {
      return false
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const itemDate = dayjs(item.date)
      const [start, end] = filters.dateRange
      if (itemDate.isBefore(start, 'day') || itemDate.isAfter(end, 'day')) {
        return false
      }
    }

    return true
  })

  // Apply pagination to filtered data
  const paginatedData = filteredData.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  )

  // Update total when filtered list length changes (use length to avoid infinite loop)
  const filteredLength = filteredData.length
  useEffect(() => {
    setTotal(filteredLength)
  }, [filteredLength, setTotal])

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (text) => formatDate(text),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours) => `${hours} hrs`,
      sorter: (a, b) => a.totalHours - b.totalHours,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
      filters: [
        { text: 'Draft', value: 'Draft' },
        { text: 'Submitted', value: 'Submitted' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.status === value,
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
          <Tooltip
            title={
              record.status !== 'Draft' && record.status !== 'Rejected'
                ? 'Only Draft or Rejected DARs can be edited'
                : ''
            }
          >
            <span>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => (record.status === 'Draft' || record.status === 'Rejected' ? handleEdit(record) : null)}
                disabled={record.status !== 'Draft' && record.status !== 'Rejected'}
              >
                Edit
              </Button>
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Daily Activity Report (DAR)</h1>
          <p className="page-description">View and manage your daily activity reports</p>
        </div>

        <Card className="card-container">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <ButtonGroup align="start" style={{ marginBottom: 16 }}>
              <ActionButton
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/dar/create')}
              >
                Create DAR
              </ActionButton>
              <ActionButton
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exportLoading}
              >
                Export
              </ActionButton>
            </ButtonGroup>

            <Space wrap>
              <RangePicker
                placeholder={['From Date', 'To Date']}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                style={{ width: 250 }}
              />
              <Select
                placeholder="Select Project"
                style={{ width: 200 }}
                allowClear
                value={filters.project}
                onChange={(value) => handleFilterChange('project', value)}
              >
                {projects.map((project) => (
                  <Select.Option key={project.id} value={project.name}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="Select Status"
                style={{ width: 150 }}
                allowClear
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Submitted">Submitted</Select.Option>
                <Select.Option value="Approved">Approved</Select.Option>
                <Select.Option value="Rejected">Rejected</Select.Option>
              </Select>
              <Search
                placeholder="Search by project or date"
                style={{ width: 250 }}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                allowClear
              />
            </Space>

            <Table
              columns={columns}
              dataSource={paginatedData}
              loading={loading}
              rowKey="id"
              pagination={getTablePagination({
                ...pagination,
                total: filteredData.length,
              })}
              onChange={handleTableChange}
              locale={{
                emptyText: 'No DARs found. Click "Create DAR" to add a new report.',
              }}
            />
          </Space>
        </Card>

        <Modal
          title="Export DAR Report"
          open={exportModalOpen}
          onCancel={() => setExportModalOpen(false)}
          okText="Export"
          onOk={runExport}
          confirmLoading={exportLoading}
          width={480}
          destroyOnClose
        >
          <p style={{ marginBottom: 16, color: '#666' }}>
            Choose filters to export. Leave empty to export all DARs.
          </p>
          <Form form={exportForm} layout="vertical">
            <Form.Item name="dateRange" label="Date Range">
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['From Date', 'To Date']}
              />
            </Form.Item>
            <Form.Item name="project" label="Project">
              <Select
                placeholder="All Projects"
                allowClear
                options={projects.map((p) => ({ label: p.name, value: p.name }))}
              />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select
                placeholder="All Statuses"
                allowClear
                options={[
                  { label: 'Draft', value: 'Draft' },
                  { label: 'Submitted', value: 'Submitted' },
                  { label: 'Approved', value: 'Approved' },
                  { label: 'Rejected', value: 'Rejected' },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default DarList
