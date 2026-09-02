import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, DatePicker, Button, Space, Input, Select, Modal, Form, TimePicker, App, Popconfirm, Upload, Alert, Typography, Checkbox, Divider, Tabs } from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { exportAttendanceToExcel, saveBlob } from '../../utils/attendanceExcel'
import { calcLiveTotal, formatDate } from '../../utils/attendanceTimeUtils'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAttendance, updateAttendance } from '../../features/myTeam/myTeamSlice'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import myTeamService from '../../features/myTeam/myTeamService'

const { RangePicker } = DatePicker
const { Search } = Input
const { Option } = Select

const TeamAttendance = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { attendanceData, loading } = useSelector((state) => state.myTeam)
  const [updating, setUpdating] = React.useState(false)
  const [dateRange, setDateRange] = React.useState(null)
  const [searchText, setSearchText] = React.useState('')
  const [selectedEmployee, setSelectedEmployee] = React.useState(null)
  const [localData, setLocalData] = React.useState([])
  const [editModalVisible, setEditModalVisible] = React.useState(false)
  const [editingRecord, setEditingRecord] = React.useState(null)
  const [form] = Form.useForm()
  const [now, setNow] = useState(new Date())
  const [importModalVisible, setImportModalVisible] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [importResult, setImportResult] = React.useState(null)
  const [bulkModalVisible, setBulkModalVisible] = React.useState(false)
  const [bulkBusy, setBulkBusy] = React.useState(false)
  const [bulkResult, setBulkResult] = React.useState(null)
  const [bulkForm] = Form.useForm()
  const [roster, setRoster] = React.useState([])
  const [pasteText, setPasteText] = React.useState('')
  const [pasteBusy, setPasteBusy] = React.useState(false)
  const [pastePreview, setPastePreview] = React.useState(null)
  const [pasteResult, setPasteResult] = React.useState(null)
  const [pasteStatus, setPasteStatus] = React.useState('P')
  const [pasteDates, setPasteDates] = React.useState(null)

  /**
   * Load the team's attendance for the picked range.
   *
   * The range picker used to set state that nothing read: every dispatch sent
   * no params, so the API always fell back to its own default of the last seven
   * days and picking a range silently changed nothing. Anything older than a
   * week — an imported monthly report, most obviously — was unreachable from
   * this screen. Every load now goes through here so the range cannot be
   * dropped again.
   */
  const loadAttendance = React.useCallback(() => {
    const params =
      dateRange && dateRange[0] && dateRange[1]
        ? {
            startDate: dateRange[0].format('YYYY-MM-DD'),
            endDate: dateRange[1].format('YYYY-MM-DD'),
          }
        : {}
    return dispatch(fetchAttendance(params))
  }, [dispatch, dateRange])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => loadAttendance(), 60000)
    return () => clearInterval(interval)
  }, [loadAttendance])

  // Live clock tick every second for running totals
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])



  // Sync local editable data with Redux data
  useEffect(() => {
    setLocalData(attendanceData || [])
  }, [attendanceData])

  const handleRefresh = () => {
    loadAttendance()
  }

  const handleDelete = async (record) => {
    try {
      if (!record?.id) {
        message.error('Attendance record ID not found. Please refresh and try again.')
        return
      }

      await myTeamService.deleteAttendance(record.id)
      message.success('Attendance record deleted successfully')

      // Optimistically update local list
      setLocalData((prev) => prev.filter((item) => item.id !== record.id))

      // Also refresh from server to keep Redux state in sync
      loadAttendance()
    } catch (error) {
      console.error('Delete attendance error:', error)
      message.error(error.message || 'Failed to delete attendance record')
    }
  }

  /**
   * Export what the table is currently showing — filters and search included.
   * Exporting the full set instead would hand back a different answer than the
   * one on screen.
   */
  const handleExportExcel = () => {
    const count = exportAttendanceToExcel(filteredData, { fileName: 'team-attendance' })
    if (count === 0) {
      message.info('No records to export — an empty sheet with headers was downloaded.')
    } else {
      message.success(`Exported ${count} record${count === 1 ? '' : 's'} to Excel`)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await myTeamService.downloadImportTemplate()
      saveBlob(blob, 'attendance-import-template.xlsx')
    } catch (error) {
      message.error(error.message || 'Failed to download template')
    }
  }

  /**
   * Upload handler. Returns false from beforeUpload so antd never performs its
   * own XHR — the file goes through myTeamService with the app's auth
   * interceptor attached instead.
   */
  const handleImportFile = async (file) => {
    setImporting(true)
    setImportResult(null)
    try {
      const result = await myTeamService.importAttendanceExcel(file)
      setImportResult(result)

      if (result.imported > 0) {
        message.success(`Imported ${result.imported} of ${result.total} row(s)`)
        loadAttendance()
      } else {
        message.warning('No rows were imported — see the details below.')
      }
    } catch (error) {
      message.error(error.message || 'Import failed')
      setImportResult(null)
    } finally {
      setImporting(false)
    }
    return false
  }

  /**
   * Fill an entire month in one action.
   *
   * The defaults are the safe reading of "fill this month": stop at today
   * rather than asserting attendance nobody can know yet, and never touch a day
   * that already has a real punch or a manual correction. Both are surfaced as
   * checkboxes so an HR user correcting a closed month can turn them off
   * deliberately.
   */
  const handleBulkFill = async () => {
    try {
      const values = await bulkForm.validateFields()
      setBulkBusy(true)
      setBulkResult(null)

      const result = await myTeamService.bulkFillMonth({
        month: values.month.format('YYYY-MM'),
        userIds: values.userIds || [],
        weekOffDays: values.weekOffDays || [],
        workingStatus: values.workingStatus,
        markHolidays: values.markHolidays,
        skipFuture: values.skipFuture,
        preserveExisting: values.preserveExisting,
      })

      setBulkResult(result)
      if (result.written > 0) {
        message.success(`Filled ${result.written} day(s) for ${result.employees} employee(s)`)
        loadAttendance()
      } else {
        message.info(result.message || 'Nothing to fill for that month.')
      }
    } catch (error) {
      if (error?.errorFields) return // form validation already shows the problem
      message.error(error.message || 'Bulk fill failed')
    } finally {
      setBulkBusy(false)
    }
  }

  /** Download the month as a matrix sheet to fill offline and re-import. */
  const handleDownloadMonthlySheet = async (prefill) => {
    try {
      const values = bulkForm.getFieldsValue()
      if (!values.month) {
        message.warning('Pick a month first')
        return
      }
      const month = values.month.format('YYYY-MM')
      const blob = await myTeamService.downloadMonthlySheet({
        month,
        prefill,
        weekOffDays: values.weekOffDays || [],
      })
      saveBlob(blob, `attendance-${month}.xlsx`)
    } catch (error) {
      message.error(error.message || 'Failed to download the monthly sheet')
    }
  }

  /**
   * Load the employee roster when the bulk modal opens.
   *
   * The toolbar's employee filter is derived from the attendance rows on
   * screen, which is right for filtering but wrong here: bulk fill exists
   * precisely for months that have no attendance yet, and deriving the list
   * from those rows would offer an empty dropdown exactly when it is needed.
   */
  useEffect(() => {
    if (!bulkModalVisible || roster.length > 0) return
    let cancelled = false
    myTeamService
      .getTeamMembers()
      .then((members) => {
        if (!cancelled) setRoster(Array.isArray(members) ? members : [])
      })
      .catch(() => {
        // Non-fatal: "leave empty for all active employees" still works.
        if (!cancelled) setRoster([])
      })
    return () => {
      cancelled = true
    }
  }, [bulkModalVisible, roster.length])

  /** Export the picked month as a matrix workbook of what is actually recorded. */
  const handleExportMonth = async () => {
    try {
      const values = bulkForm.getFieldsValue()
      if (!values.month) {
        message.warning('Pick a month first')
        return
      }
      const month = values.month.format('YYYY-MM')
      const blob = await myTeamService.exportMonthlyMatrix({
        month,
        userIds: values.userIds || [],
      })
      saveBlob(blob, `attendance-${month}-export.xlsx`)
      message.success(`Exported ${values.month.format('MMM YYYY')}`)
    } catch (error) {
      message.error(error.message || 'Failed to export the month')
    }
  }

  /**
   * Import a filled monthly sheet from inside the bulk modal.
   *
   * Shares handleImportFile so a month brought back here and a file dropped on
   * Import Excel take exactly the same path and report the same way — there is
   * no second import behaviour to keep in step.
   */
  const handleBulkImportFile = async (file) => {
    await handleImportFile(file)
    return false
  }

  /**
   * Analyse the pasted block without writing anything.
   *
   * A paste is invisible until it lands, so this runs before any write: a stray
   * header row or a mistyped code should be visible as a name that did not
   * resolve, not as attendance that quietly went to the wrong person.
   */
  const handlePastePreview = async () => {
    if (!pasteText.trim()) {
      message.warning('Paste something first')
      return
    }
    setPasteBusy(true)
    setPasteResult(null)
    try {
      const dates =
        pasteDates && pasteDates[0] && pasteDates[1]
          ? [pasteDates[0].format('YYYY-MM-DD'), pasteDates[1].format('YYYY-MM-DD')]
          : []
      const result = await myTeamService.previewPaste({
        text: pasteText,
        dates,
        status: pasteStatus,
      })
      setPastePreview(result)
    } catch (error) {
      message.error(error.message || 'Could not read the pasted data')
      setPastePreview(null)
    } finally {
      setPasteBusy(false)
    }
  }

  const handlePasteApply = async () => {
    if (!pasteText.trim()) {
      message.warning('Paste something first')
      return
    }
    // A plain list of employees carries no dates of its own, so the form has to
    // supply them; a matrix or row paste already contains its own.
    const needsDates = !pastePreview || pastePreview.shape === 'list'
    if (needsDates && !(pasteDates && pasteDates[0])) {
      message.warning('Pick the date (or date range) to mark')
      return
    }

    setPasteBusy(true)
    try {
      const result = await myTeamService.applyPaste({
        text: pasteText,
        status: pasteStatus,
        startDate: pasteDates?.[0]?.format('YYYY-MM-DD'),
        endDate: pasteDates?.[1]?.format('YYYY-MM-DD'),
      })
      setPasteResult(result)
      if (result.imported > 0) {
        message.success(
          result.shape === 'list'
            ? `${result.imported} day(s) marked ${result.statusLabel}`
            : `${result.imported} of ${result.total} row(s) imported`
        )
        loadAttendance()
      } else {
        message.warning('Nothing was applied — see the details below.')
      }
    } catch (error) {
      message.error(error.message || 'Failed to apply the pasted data')
    } finally {
      setPasteBusy(false)
    }
  }

  const resetPaste = () => {
    setPasteText('')
    setPastePreview(null)
    setPasteResult(null)
  }

  const closeBulkModal = () => {
    setBulkModalVisible(false)
    setBulkResult(null)
  }

  const closeImportModal = () => {
    setImportModalVisible(false)
    setImportResult(null)
  }

  const filteredData = localData.filter((item) => {
    const matchesSearch = searchText
      ? item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.employeeCode.toLowerCase().includes(searchText.toLowerCase())
      : true

    const matchesEmployee = selectedEmployee
      ? item.employeeCode === selectedEmployee
      : true

    return matchesSearch && matchesEmployee
  })

  // Build unique employee list for dropdown
  const employeeOptions = Array.from(
    new Map(
      (localData || []).map((item) => [item.employeeCode, item])
    ).values()
  )

  const handleEditClick = (record) => {
    setEditingRecord(record)

    const parseTime = (timeStr) => {
      if (!timeStr) return null
      const formats = ['hh:mm A', 'h:mm A', 'HH:mm', 'HH:mm:ss']
      for (const fmt of formats) {
        const m = dayjs(timeStr, fmt, true)
        if (m.isValid()) return m
      }
      const fallback = dayjs(timeStr)
      return fallback.isValid() ? fallback : null
    }

    form.setFieldsValue({
      employeeName: record.employeeName,
      employeeCode: record.employeeCode,
      date: record.date,
      checkIn: parseTime(record.checkIn),
      checkOut: parseTime(record.checkOut),
      totalHours: record.totalHours,
      status: record.status,
    })

    setEditModalVisible(true)
  }

  const recalculateTotalHours = (changedField, changedValue) => {
    // Use setTimeout to ensure form values are updated after TimePicker onChange
    setTimeout(() => {
      const currentValues = form.getFieldsValue(['checkIn', 'checkOut'])
      
      // Use the changed value directly, and get the other from form
      const checkIn = changedField === 'checkIn' ? changedValue : currentValues.checkIn
      const checkOut = changedField === 'checkOut' ? changedValue : currentValues.checkOut
      
      // Calculate total hours if both times are available
      if (checkIn && checkOut && dayjs.isDayjs(checkIn) && dayjs.isDayjs(checkOut)) {
        const diffMinutes = checkOut.diff(checkIn, 'minute')
        if (diffMinutes > 0) {
          const hours = Math.floor(diffMinutes / 60)
          const minutes = diffMinutes % 60
          form.setFieldsValue({
            totalHours: `${hours}h ${minutes.toString().padStart(2, '0')}m`,
          })
        } else if (diffMinutes <= 0) {
          // If check out is before or equal to check in, set to 0
          form.setFieldsValue({
            totalHours: '0h 00m',
          })
        }
      } else {
        // If one of the times is missing, set to 0
        form.setFieldsValue({
          totalHours: '0h 00m',
        })
      }
    }, 0)
  }

  const handleEditSubmit = async () => {
    try {
      setUpdating(true)
      const values = await form.validateFields()

      // Format times for API (HH:mm format - 24-hour)
      const checkInTime = values.checkIn ? values.checkIn.format('HH:mm') : null
      const checkOutTime = values.checkOut ? values.checkOut.format('HH:mm') : null

      // Get user ID from the record - the API returns userId in the grouped data
      if (!editingRecord.userId) {
        message.error('User ID not found. Please refresh and try again.')
        setUpdating(false)
        return
      }

      // Call the update API - ensure userId is a number
      let userId = editingRecord.userId
      
      // Convert to number if it's a string
      if (typeof userId === 'string') {
        userId = parseInt(userId, 10)
      }
      
      // Ensure it's a valid number
      if (!userId || isNaN(userId) || userId <= 0) {
        message.error('Invalid user ID. Please refresh and try again.')
        setUpdating(false)
        return
      }

      // Prepare update data - only include fields that have values
      const updateData = {
        userId: Number(userId), // Explicitly convert to number
        date: editingRecord.date,
      }

      // Only add time fields if they have values
      if (checkInTime) {
        updateData.checkInTime = checkInTime
      }
      if (checkOutTime) {
        updateData.checkOutTime = checkOutTime
      }
      if (values.status) {
        updateData.status = values.status
      }

      console.log('Sending update request:', updateData)

      await dispatch(updateAttendance(updateData)).unwrap()

      message.success('Attendance updated successfully!')
      
      // Refresh attendance data to show updated values
      await loadAttendance()

      setEditModalVisible(false)
      setEditingRecord(null)
      form.resetFields()
    } catch (error) {
      console.error('Update attendance error:', error)
      let errorMessage = 'Failed to update attendance'
      
      // Handle different error formats
      console.error('Full error object:', error)
      console.error('Error response:', error?.response?.data)
      
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.response?.data) {
        const responseData = error.response.data
        errorMessage = responseData.message || 'Validation failed'
        
        // Handle validation errors with detailed messages
        if (responseData.errors) {
          const validationErrors = responseData.errors
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            const errorDetails = validationErrors.map(e => {
              if (typeof e === 'string') return e
              if (e.message) return `${e.field || 'Field'}: ${e.message}`
              return JSON.stringify(e)
            }).join('; ')
            errorMessage = `${errorMessage}: ${errorDetails}`
          } else if (typeof validationErrors === 'object') {
            errorMessage = `${errorMessage}: ${JSON.stringify(validationErrors)}`
          }
        }
      } else if (error?.payload) {
        errorMessage = typeof error.payload === 'string' ? error.payload : error.payload.message || 'Validation failed'
      }
      
      message.error(errorMessage || 'Failed to update attendance. Please check your input and try again.')
    } finally {
      setUpdating(false)
    }
  }

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (text) => formatDate(text),
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (text) => text ? (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{text}</span>
      ) : <span style={{ color: '#d1d5db' }}>--:--</span>,
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (text) => text ? (
        <span style={{ color: '#dc2626', fontWeight: 600 }}>{text}</span>
      ) : <span style={{ color: '#d1d5db' }}>--:--</span>,
    },
    {
      title: 'Total Hours',
      key: 'totalHours',
      render: (_, record) => {
        const isToday = record.date === dayjs().format('YYYY-MM-DD')
        const hasCheckIn = !!record.checkIn
        const hasCheckOut = !!record.checkOut

        // For today's records without checkout, show live running time
        if (isToday && hasCheckIn && !hasCheckOut) {
          return (
            <span style={{ color: '#2563eb', fontWeight: 600 }}>
              <ClockCircleOutlined style={{ marginRight: 4, fontSize: 12 }} />
              {calcLiveTotal(record.checkIn, null, now)}
            </span>
          )
        }

        // For completed records or past dates, show calculated total
        if (hasCheckIn && hasCheckOut) {
          return <span style={{ fontWeight: 600 }}>{calcLiveTotal(record.checkIn, record.checkOut, now)}</span>
        }

        return <span style={{ color: '#9ca3af' }}>{record.totalHours || '0h 00m'}</span>
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          Present: 'green',
          Absent: 'red',
          Late: 'orange',
          'Half Day': 'blue',
          // Days that arrive from a monthly report rather than a punch.
          'Week Off': 'default',
          Holiday: 'purple',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEditClick(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete Attendance"
            description="Are you sure you want to delete this attendance record?"
            okText="Yes, Delete"
            cancelText="Cancel"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  /** Body of the "Upload a file" tab — unchanged behaviour, just relocated. */
  const renderUploadTab = () => (
    <>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Required columns"
              description={
                <div>
                  <Typography.Text>
                    The sheet needs an <strong>Employee Code</strong> column and a{' '}
                    <strong>Date</strong> column, plus <strong>Check In</strong> and/or{' '}
                    <strong>Check Out</strong>. <strong>Status</strong> is optional.
                  </Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Dates may be DD/MM/YYYY or YYYY-MM-DD; times may be 09:30 or 9:30 AM.
                      Importing the same day again updates that day rather than adding a
                      duplicate.
                    </Typography.Text>
                    <div style={{ marginTop: 6 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        A <strong>monthly attendance report</strong> (one row per employee,
                        one column per day, cells marked P / WOF) is also recognised
                        automatically — every sheet in the workbook is read. Leave codes
                        (EL, CO, LWP…) are reported but not imported.
                      </Typography.Text>
                    </div>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    style={{ paddingLeft: 0, marginTop: 4 }}
                    onClick={handleDownloadTemplate}
                  >
                    Download template
                  </Button>
                </div>
              }
            />

            <Upload.Dragger
              name="file"
              accept=".xlsx,.xls,.csv"
              multiple={false}
              showUploadList={false}
              disabled={importing}
              beforeUpload={handleImportFile}
            >
              <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                <FileExcelOutlined style={{ fontSize: 40, color: '#22c55e' }} />
              </p>
              <p className="ant-upload-text">
                {importing ? 'Importing…' : 'Click or drag an Excel file here'}
              </p>
              <p className="ant-upload-hint">Supports .xlsx, .xls and .csv — up to 5MB</p>
            </Upload.Dragger>

            {importResult && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  type={
                    importResult.skipped === 0
                      ? 'success'
                      : importResult.imported > 0
                        ? 'warning'
                        : 'error'
                  }
                  showIcon
                  message={
                    importResult.format === 'matrix'
                      ? `${importResult.imported} of ${importResult.total} day(s) imported` +
                        (importResult.sheets?.length
                          ? ` from ${importResult.sheets
                              .map((sh) => `${sh.name} (${sh.employees})`)
                              .join(', ')}`
                          : '')
                      : `${importResult.imported} of ${importResult.total} row(s) imported`
                  }
                  description={
                    importResult.skipped > 0
                      ? `${importResult.skipped} row(s) were skipped. Fix them in the sheet and import again — imported rows will simply be updated.`
                      : 'All rows imported successfully.'
                  }
                />

                {importResult.errors?.length > 0 && (
                  <Table
                    size="small"
                    style={{ marginTop: 12 }}
                    rowKey={(row, i) => `${row.sheet || ''}-${row.row}-${row.employeeCode}-${i}`}
                    dataSource={importResult.errors}
                    pagination={{ pageSize: 5, hideOnSinglePage: true }}
                    columns={[
                      // The sheet column only earns its width on a monthly report,
                      // which spans several tabs; a single-sheet import omits it.
                      ...(importResult.errors.some((e) => e.sheet)
                        ? [{ title: 'Sheet', dataIndex: 'sheet', width: 110 }]
                        : []),
                      { title: 'Excel Row', dataIndex: 'row', width: 90 },
                      { title: 'Employee', dataIndex: 'employeeCode', width: 150 },
                      { title: 'Why it was skipped', dataIndex: 'reason' },
                    ]}
                  />
                )}
              </div>
            )}
    </>
  )

  /**
   * Body of the "Paste from Excel" tab.
   *
   * Copying cells in Excel puts tab-separated text on the clipboard, so the
   * textarea below receives the selection verbatim. The shape is worked out from
   * the content, which is why Preview exists: it names what was recognised and
   * which employees resolved, before anything is written.
   */
  const renderPasteTab = () => {
    const isList = !pastePreview || pastePreview.shape === 'list'

    return (
      <>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Copy cells in Excel, then paste below"
          description={
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Three shapes are recognised automatically: a <strong>list of employees</strong>{' '}
              (one code per line — pick the status and dates below), a{' '}
              <strong>row-per-day block</strong> with Employee Code / Date / Check In / Check
              Out, or a <strong>monthly report block</strong> with a column per day.
            </Typography.Text>
          }
        />

        <Input.TextArea
          rows={7}
          value={pasteText}
          onChange={(e) => {
            setPasteText(e.target.value)
            setPastePreview(null)
            setPasteResult(null)
          }}
          placeholder={'MIPL10\nMIPL20\nMIPL30'}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />

        {isList && (
          <Space wrap style={{ marginTop: 12 }}>
            <span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Mark as
              </Typography.Text>
              <br />
              <Select value={pasteStatus} onChange={setPasteStatus} style={{ width: 150 }}>
                <Option value="P">Present</Option>
                <Option value="A">Absent</Option>
                <Option value="HD">Half Day</Option>
                <Option value="WOF">Week Off</Option>
                <Option value="H">Holiday</Option>
              </Select>
            </span>
            <span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                For these dates
              </Typography.Text>
              <br />
              <RangePicker
                value={pasteDates}
                onChange={setPasteDates}
                format="DD/MM/YYYY"
                style={{ width: 260 }}
              />
            </span>
          </Space>
        )}

        <div style={{ marginTop: 12 }}>
          <Space>
            <Button onClick={handlePastePreview} loading={pasteBusy}>
              Preview
            </Button>
            <Button type="primary" onClick={handlePasteApply} loading={pasteBusy}>
              Apply
            </Button>
            <Button type="link" onClick={resetPaste}>
              Clear
            </Button>
          </Space>
        </div>

        {pastePreview && (
          <div style={{ marginTop: 14 }}>
            {pastePreview.shape !== 'list' ? (
              <Alert type="info" showIcon message={pastePreview.message} />
            ) : (
              <>
                <Alert
                  type={pastePreview.unmatched?.length ? 'warning' : 'success'}
                  showIcon
                  message={`${pastePreview.employees?.length || 0} employee(s) recognised${
                    pastePreview.unmatched?.length
                      ? `, ${pastePreview.unmatched.length} not found`
                      : ''
                  }`}
                  description={
                    pasteDates && pasteDates[0]
                      ? `Applying will mark ${
                          (pastePreview.employees?.length || 0) *
                          (pasteDates[1]
                            ? pasteDates[1].diff(pasteDates[0], 'day') + 1
                            : 1)
                        } day(s).`
                      : 'Pick the date (or date range) to mark.'
                  }
                />
                {pastePreview.employees?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {pastePreview.employees.map((e) => (
                      <Tag key={e.userId} color="green" style={{ marginBottom: 4 }}>
                        {e.name} ({e.employeeCode})
                      </Tag>
                    ))}
                  </div>
                )}
                {pastePreview.unmatched?.length > 0 && (
                  <Table
                    size="small"
                    style={{ marginTop: 10 }}
                    rowKey={(row) => `unmatched-${row.line}`}
                    dataSource={pastePreview.unmatched}
                    pagination={{ pageSize: 5, hideOnSinglePage: true }}
                    columns={[
                      { title: 'Line', dataIndex: 'line', width: 70 },
                      { title: 'Pasted text', dataIndex: 'raw', width: 200 },
                      { title: 'Why', dataIndex: 'reason' },
                    ]}
                  />
                )}
              </>
            )}
          </div>
        )}

        {pasteResult && (
          <Alert
            style={{ marginTop: 14 }}
            type={pasteResult.imported > 0 ? 'success' : 'error'}
            showIcon
            message={
              pasteResult.shape === 'list'
                ? `${pasteResult.imported} day(s) marked ${pasteResult.statusLabel} for ${pasteResult.employees} employee(s)`
                : `${pasteResult.imported} of ${pasteResult.total} row(s) imported`
            }
            description={
              pasteResult.preserved > 0
                ? `${pasteResult.preserved} day(s) already had a punch or manual entry and were left untouched.`
                : null
            }
          />
        )}
      </>
    )
  }


  return (
    <Card className="card-container">
      <Space
        style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        <Space>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            format="DD/MM/YYYY"
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh
          </Button>
        </Space>
        <Space>
          <Select
            allowClear
            placeholder="Select employee"
            style={{ width: 220 }}
            value={selectedEmployee}
            onChange={(value) => setSelectedEmployee(value || null)}
          >
            {employeeOptions.map((emp) => (
              <Option key={emp.employeeCode} value={emp.employeeCode}>
                {emp.employeeName} ({emp.employeeCode})
              </Option>
            ))}
          </Select>
          <Search
            placeholder="Search employee"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 260 }}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
          />
          <Button icon={<CalendarOutlined />} onClick={() => setBulkModalVisible(true)}>
            Bulk Attendance
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
            Import Excel
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            Export Excel
          </Button>
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
          showTotal: (total) => `Total ${total} records`,
        }}
        locale={{
          emptyText: (
            <div className="empty-state">
              <div>No attendance records found</div>
            </div>
          ),
        }}
      />

      <Modal
        title="Edit Attendance"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          if (!updating) {
            setEditModalVisible(false)
            setEditingRecord(null)
            form.resetFields()
          }
        }}
        okText="Save"
        okButtonProps={{ loading: updating }}
        cancelButtonProps={{ disabled: updating }}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Form.Item label="Employee Name" name="employeeName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Employee Code" name="employeeCode">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Date" name="date">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Check In"
            name="checkIn"
            preserve
          >
            <TimePicker
              use12Hours
              format="hh:mm A"
              style={{ width: '100%' }}
              placeholder={editingRecord?.checkIn || 'Select time'}
              onChange={(value) => {
                // Ensure the value is set and preserve checkOut
                const currentCheckOut = form.getFieldValue('checkOut')
                form.setFieldsValue({
                  checkIn: value,
                  checkOut: currentCheckOut, // Preserve checkOut
                })
                recalculateTotalHours('checkIn', value)
              }}
            />
          </Form.Item>
          <Form.Item
            label="Check Out"
            name="checkOut"
            preserve
          >
            <TimePicker
              use12Hours
              format="hh:mm A"
              style={{ width: '100%' }}
              placeholder={editingRecord?.checkOut || 'Select time'}
              onChange={(value) => {
                // Ensure the value is set and preserve checkIn
                const currentCheckIn = form.getFieldValue('checkIn')
                form.setFieldsValue({
                  checkIn: currentCheckIn, // Preserve checkIn
                  checkOut: value,
                })
                recalculateTotalHours('checkOut', value)
              }}
            />
          </Form.Item>
          <Form.Item
            label="Total Hours"
            name="totalHours"
          >
            <Input placeholder="e.g., 9h 00m" />
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="Present">Present</Option>
              <Option value="Absent">Absent</Option>
              <Option value="Late">Late</Option>
              <Option value="Half Day">Half Day</Option>
            </Select>
          </Form.Item>
          </Form>
        </Modal>

        {/* Bulk attendance for a whole month */}
        <Modal
          title="Bulk Attendance — Whole Month"
          open={bulkModalVisible}
          onCancel={closeBulkModal}
          width={680}
          destroyOnClose
          footer={[
            <Button key="close" onClick={closeBulkModal}>
              Close
            </Button>,
            <Button key="fill" type="primary" loading={bulkBusy} onClick={handleBulkFill}>
              Fill Month
            </Button>,
          ]}
        >
          <Form
            form={bulkForm}
            layout="vertical"
            initialValues={{
              month: dayjs().subtract(1, 'month'),
              userIds: [],
              weekOffDays: [0],
              workingStatus: 'P',
              markHolidays: true,
              skipFuture: true,
              preserveExisting: true,
            }}
          >
            <Space size="large" align="start" style={{ display: 'flex', flexWrap: 'wrap' }}>
              <Form.Item
                label="Month"
                name="month"
                rules={[{ required: true, message: 'Pick a month' }]}
              >
                <DatePicker picker="month" format="MMM YYYY" style={{ width: 180 }} />
              </Form.Item>

              <Form.Item label="Working days marked as" name="workingStatus">
                <Select style={{ width: 180 }}>
                  <Option value="P">Present</Option>
                  <Option value="A">Absent</Option>
                  <Option value="HD">Half Day</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Weekly off" name="weekOffDays">
                <Select mode="multiple" allowClear style={{ width: 200 }} placeholder="None">
                  <Option value={0}>Sunday</Option>
                  <Option value={1}>Monday</Option>
                  <Option value={2}>Tuesday</Option>
                  <Option value={3}>Wednesday</Option>
                  <Option value={4}>Thursday</Option>
                  <Option value={5}>Friday</Option>
                  <Option value={6}>Saturday</Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item
              label="Employees"
              name="userIds"
              extra="Leave empty to apply to every active employee."
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="All active employees"
                optionFilterProp="label"
                options={
                  roster.length > 0
                    ? roster.map((m) => ({
                        value: m.id,
                        label: `${m.name}${m.employeeCode ? ` (${m.employeeCode})` : ''}`,
                      }))
                    : employeeOptions.map((emp) => ({
                        value: emp.userId,
                        label: `${emp.employeeName} (${emp.employeeCode})`,
                      }))
                }
              />
            </Form.Item>

            <Form.Item name="markHolidays" valuePropName="checked" noStyle>
              <Checkbox>Mark company holidays as Holiday</Checkbox>
            </Form.Item>
            <br />
            <Form.Item name="skipFuture" valuePropName="checked" noStyle>
              <Checkbox>Stop at today (do not fill future dates)</Checkbox>
            </Form.Item>
            <br />
            <Form.Item name="preserveExisting" valuePropName="checked" noStyle>
              <Checkbox>Keep days that already have a punch or manual entry</Checkbox>
            </Form.Item>

            <Divider style={{ margin: '16px 0 12px' }}>or work in Excel</Divider>

            <Typography.Text strong style={{ fontSize: 13 }}>
              Bulk export
            </Typography.Text>
            <div style={{ margin: '6px 0 4px' }}>
              <Space wrap>
                <Button icon={<FileExcelOutlined />} onClick={handleExportMonth}>
                  Export this month
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadMonthlySheet(null)}
                >
                  Blank sheet
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadMonthlySheet('P')}
                >
                  Pre-filled sheet
                </Button>
              </Space>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              One row per employee, one column per day, with per-code totals.
              &quot;Export this month&quot; contains what is currently recorded; the sheets are
              empty forms.
            </Typography.Text>

            <div style={{ marginTop: 14 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                Bulk import
              </Typography.Text>
            </div>
            <Upload.Dragger
              name="file"
              accept=".xlsx,.xls,.csv"
              multiple={false}
              showUploadList={false}
              disabled={importing}
              beforeUpload={handleBulkImportFile}
              style={{ marginTop: 6, padding: '8px 0' }}
            >
              <p style={{ margin: 0 }}>
                <UploadOutlined style={{ fontSize: 20, color: '#2563eb' }} />
              </p>
              <p className="ant-upload-text" style={{ margin: '4px 0 0', fontSize: 13 }}>
                {importing ? 'Importing…' : 'Click or drag a filled monthly sheet here'}
              </p>
              <p className="ant-upload-hint" style={{ margin: 0, fontSize: 12 }}>
                Re-importing a month updates it rather than duplicating it.
              </p>
            </Upload.Dragger>

            {importResult && (
              <Alert
                style={{ marginTop: 12 }}
                type={
                  importResult.skipped === 0
                    ? 'success'
                    : importResult.imported > 0
                      ? 'warning'
                      : 'error'
                }
                showIcon
                message={`${importResult.imported} of ${importResult.total} day(s) imported`}
                description={
                  importResult.skipped > 0
                    ? `${importResult.skipped} skipped — open Import Excel for the full breakdown.`
                    : null
                }
              />
            )}
          </Form>

          {bulkResult && (
            <Alert
              style={{ marginTop: 16 }}
              type={bulkResult.written > 0 ? 'success' : 'info'}
              showIcon
              message={
                bulkResult.written > 0
                  ? `${bulkResult.written} day(s) filled for ${bulkResult.employees} employee(s)`
                  : bulkResult.message || 'Nothing to fill'
              }
              description={
                bulkResult.written > 0 ? (
                  <div>
                    {Object.entries(bulkResult.byStatus || {}).map(([code, count]) => (
                      <Tag key={code} style={{ marginBottom: 4 }}>
                        {code}: {count}
                      </Tag>
                    ))}
                    {bulkResult.preserved > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {bulkResult.preserved} day(s) already had a punch or manual entry and
                          were left untouched.
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                ) : null
              }
            />
          )}
        </Modal>

        {/* Import from Excel */}
        <Modal
          title="Import Attendance from Excel"
          open={importModalVisible}
          onCancel={closeImportModal}
          footer={[
            <Button key="close" onClick={closeImportModal}>
              Close
            </Button>,
          ]}
          width={720}
          destroyOnClose
        >
          <Tabs
            defaultActiveKey="upload"
            items={[
              { key: 'upload', label: 'Upload a file', children: renderUploadTab() },
              { key: 'paste', label: 'Paste from Excel', children: renderPasteTab() },
            ]}
          />
        </Modal>
      </Card>
    )
  }
  
  export default TeamAttendance
