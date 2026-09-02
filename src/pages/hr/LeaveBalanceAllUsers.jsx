import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Card,
  Table,
  Input,
  Space,
  Select,
  message,
  Tag,
  Progress,
  Button,
  Row,
  Col,
  Alert,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Empty,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SlidersOutlined,
} from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatsCard from '../../components/dashboard/StatsCard'
import leaveService from '../../features/leave/leaveService'
import socketService from '../../services/socketService'

// Roles that may create/edit/delete adjustments. Mirrors the server's own check
// in leaveController — the UI only hides what the API would reject anyway.
const WRITE_ROLES = ['ADMIN', 'HR', 'HEAD_HR']

const TYPE_LABELS = { earned: 'Earned Leave', compOff: 'Comp Off' }

const formatDays = (n) => {
  const d = Number(n) || 0
  const shown = Number.isInteger(d) ? d : d.toFixed(1)
  return `${d > 0 ? '+' : ''}${shown}`
}

const usedTotal = (used, total) => {
  const u = Number(used) || 0
  const t = Number(total) || 0
  const remaining = Math.max(0, t - u)
  const pct = t > 0 ? Math.min(100, Math.round((u / t) * 100)) : 0
  return { used: u, total: t, remaining, pct }
}

const colorForPct = (pct) => {
  if (pct >= 90) return '#cf1322'
  if (pct >= 60) return '#fa8c16'
  return '#52c41a'
}

const renderBreakdown = (used, total, note) => {
  const { used: u, total: t, remaining, pct } = usedTotal(used, total)
  return (
    <div style={{ minWidth: 140 }}>
      <div style={{ fontSize: 13, marginBottom: 2 }}>
        <b>{remaining}</b> left <span style={{ color: '#888' }}>/ {t}</span>
      </div>
      <Progress
        percent={pct}
        size="small"
        strokeColor={colorForPct(pct)}
        format={() => `${u} used`}
      />
      {note && <div style={{ fontSize: 11, color: '#999', marginTop: -2 }}>{note}</div>}
    </div>
  )
}

// LWP is a ceiling, not an entitlement, so it reads as days-taken against the
// limit rather than the "X left / Y" the granted types use.
const renderAgainstLimit = (days, limit) => {
  const d = Number(days) || 0
  const l = Number(limit) || 0
  return (
    <span style={{ fontSize: 14 }}>
      <b style={{ color: d > 0 ? '#cf1322' : undefined }}>{d}</b>
      <span style={{ color: '#888' }}>/{l}</span>
    </span>
  )
}

// Sum of the column widths defined below. Two columns lighter than before, so
// the table now fits a normal desktop without horizontal scrolling rather than
// clipping Department behind the fixed Employee column.
const TABLE_MIN_WIDTH = 1340

const LeaveBalanceAllUsers = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('ALL')
  const [year, setYear] = useState(new Date().getFullYear())

  const { user } = useSelector((state) => state.auth)
  const canEdit = WRITE_ROLES.includes(String(user?.role || '').toUpperCase())

  const [form] = Form.useForm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  // "Edit balance" is a separate flow from the adjustment ledger below: it sets
  // the totals outright, and the server works out the credit/debit that gets
  // there. Its own form so the two modals cannot clobber each other's fields.
  const [balanceForm] = Form.useForm()
  const [balanceRow, setBalanceRow] = useState(null)
  const [savingBalance, setSavingBalance] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const list = await leaveService.getLeaveBalanceAllUsers(year)
      setData(list.map((item) => ({ ...item, key: item.id })))
    } catch (err) {
      // Surface the REAL cause instead of a generic message so issues are actionable.
      const status = err?.response?.status
      const serverMsg = err?.response?.data?.message
      const detail = serverMsg || err?.message || 'Unknown error'
      const full = status
        ? `Failed to load leave balance (HTTP ${status}): ${detail}`
        : `Failed to load leave balance: ${detail}. The API did not respond — check that the backend is running and reachable at /api/leaves/balance/all.`
      setErrorMsg(full)
      message.error(full)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  // Balances are derived, so an adjustment made elsewhere (another HR user, or
  // this user in another tab) leaves this table stale. The server pushes a
  // nudge; re-read rather than trying to patch the computed rows by hand.
  useEffect(() => {
    const onBalanceUpdated = () => load()
    socketService.on('leave_balance_updated', onBalanceUpdated)
    return () => socketService.off('leave_balance_updated', onBalanceUpdated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  const openAdd = useCallback(
    (row) => {
      setEditing(null)
      form.setFieldsValue({
        userId: row ? row.id : undefined,
        leaveType: 'compOff',
        days: 1,
        reason: '',
      })
      setModalOpen(true)
    },
    [form]
  )

  const openEdit = useCallback(
    (adj) => {
      setEditing(adj)
      form.setFieldsValue({
        userId: adj.userId,
        leaveType: adj.leaveType,
        days: adj.days,
        reason: adj.reason || '',
      })
      setModalOpen(true)
    },
    [form]
  )

  const handleSave = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return // antd already marks the offending fields
    }
    try {
      setSaving(true)
      const payload = { ...values, year }
      if (editing) {
        await leaveService.updateBalanceAdjustment(editing.id, payload)
        message.success('Adjustment updated')
      } else {
        await leaveService.createBalanceAdjustment(payload)
        message.success('Adjustment added')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      await load()
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Could not save the adjustment')
    } finally {
      setSaving(false)
    }
  }

  const openBalanceEdit = useCallback((row) => setBalanceRow(row), [])

  const handleSaveBalance = async () => {
    let values
    try {
      values = await balanceForm.validateFields()
    } catch {
      return
    }
    try {
      setSavingBalance(true)
      await leaveService.setLeaveBalance(balanceRow.id, { ...values, year })
      message.success(`Leave balance updated for ${balanceRow.employee}`)
      setBalanceRow(null)
      balanceForm.resetFields()
      await load()
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Could not update the balance')
    } finally {
      setSavingBalance(false)
    }
  }

  const handleDelete = async (adj) => {
    try {
      await leaveService.deleteBalanceAdjustment(adj.id)
      message.success('Adjustment deleted')
      await load()
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Could not delete the adjustment')
    }
  }

  const departments = useMemo(() => {
    const set = new Set()
    data.forEach((d) => d.department && set.add(d.department))
    return ['ALL', ...Array.from(set).sort()]
  }, [data])

  const filteredData = useMemo(() => {
    const s = search.trim().toLowerCase()
    return data.filter((row) => {
      if (department !== 'ALL' && row.department !== department) return false
      if (!s) return true
      return (
        (row.employee || '').toLowerCase().includes(s) ||
        (row.employeeCode || '').toLowerCase().includes(s) ||
        (row.department || '').toLowerCase().includes(s)
      )
    })
  }, [data, search, department])

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, r) => {
        acc.employees += 1
        acc.totalQuota += Number(r.totalQuota) || 0
        acc.totalUsed += Number(r.totalUsed) || 0
        acc.totalRemaining += Number(r.totalRemaining) || 0
        return acc
      },
      { employees: 0, totalQuota: 0, totalUsed: 0, totalRemaining: 0 }
    )
  }, [filteredData])

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee',
      fixed: 'left',
      width: 180,
      sorter: (a, b) => (a.employee || '').localeCompare(b.employee || ''),
    },
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 110 },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 140,
      render: (d) => (d ? <Tag color="blue">{d}</Tag> : <span style={{ color: '#bbb' }}>—</span>),
    },
    {
      title: 'Earned Leave',
      key: 'earned',
      width: 190,
      // The entitlement is accrual minus observed holidays, so show the working —
      // otherwise the total silently disagrees with 2.5 x months completed.
      render: (_, r) =>
        renderBreakdown(
          r.usedEarned,
          r.totalEarned,
          r.holidaysDeducted > 0
            ? `${r.accruedEarned} accrued − ${r.holidaysDeducted} holiday${r.holidaysDeducted === 1 ? '' : 's'}`
            : null
        ),
    },
    {
      title: 'Comp Off',
      key: 'compOff',
      width: 170,
      render: (_, r) => renderBreakdown(r.usedCompOff, r.totalCompOff),
    },
    {
      title: 'LWP',
      key: 'lwp',
      width: 130,
      sorter: (a, b) => (a.lwpDays || 0) - (b.lwpDays || 0),
      render: (_, r) => renderAgainstLimit(r.lwpDays, r.totalLwp),
    },
    {
      // Net of every HR credit/debit for the year. Shown as its own column so a
      // balance that disagrees with plain accrual is explainable at a glance
      // rather than looking like a bug in the accrual.
      title: 'Adjustment',
      key: 'adjustment',
      width: 120,
      align: 'center',
      sorter: (a, b) => (a.totalAdjusted || 0) - (b.totalAdjusted || 0),
      render: (_, r) => {
        const n = Number(r.totalAdjusted) || 0
        const count = (r.adjustments || []).length
        if (!count) return <span style={{ color: '#bbb' }}>—</span>
        return (
          <Tooltip title={`${count} adjustment${count === 1 ? '' : 's'} — expand the row to edit`}>
            <Tag color={n > 0 ? 'green' : n < 0 ? 'red' : 'default'}>{formatDays(n)} d</Tag>
          </Tooltip>
        )
      },
    },
    {
      // Earned + Comp Off left to take. LWP is excluded by design — it is
      // unpaid, which is exactly what this figure is meant to separate out.
      title: 'Total Paid Leave',
      key: 'totalRemaining',
      width: 150,
      align: 'center',
      fixed: 'right',
      sorter: (a, b) => (a.totalRemaining || 0) - (b.totalRemaining || 0),
      render: (_, r) => (
        <Tag color={(r.totalRemaining || 0) === 0 ? 'red' : 'green'} style={{ fontSize: 14, padding: '2px 10px' }}>
          {r.totalRemaining ?? 0}
        </Tag>
      ),
    },
  ]

  if (canEdit) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="Set the balance to an exact number of days">
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openBalanceEdit(r)}>
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Credit or debit days as a separate adjustment record">
            <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => openAdd(r)}>
              Adjust
            </Button>
          </Tooltip>
        </Space>
      ),
    })
  }

  // Each employee's adjustment rows live in the expanded panel: they are the
  // records that actually exist, so update and delete belong here rather than
  // on the computed summary row.
  const renderAdjustments = (row) => {
    const list = row.adjustments || []
    if (!list.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No adjustments for ${row.employee} in ${year}`}
          style={{ margin: '8px 0' }}
        >
          {canEdit && (
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => openAdd(row)}>
              Add adjustment
            </Button>
          )}
        </Empty>
      )
    }
    return (
      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={list}
        columns={[
          {
            title: 'Type',
            dataIndex: 'leaveType',
            width: 140,
            render: (t) => <Tag color={t === 'compOff' ? 'purple' : 'blue'}>{TYPE_LABELS[t] || t}</Tag>,
          },
          {
            title: 'Days',
            dataIndex: 'days',
            width: 90,
            render: (d) => (
              <b style={{ color: Number(d) < 0 ? '#cf1322' : '#16a34a' }}>{formatDays(d)}</b>
            ),
          },
          {
            title: 'Reason',
            dataIndex: 'reason',
            render: (v) => v || <span style={{ color: '#bbb' }}>—</span>,
          },
          {
            title: 'Added by',
            dataIndex: 'createdByName',
            width: 160,
            render: (v) => v || <span style={{ color: '#bbb' }}>—</span>,
          },
          ...(canEdit
            ? [
                {
                  title: 'Actions',
                  key: 'adjActions',
                  width: 120,
                  align: 'center',
                  render: (_, adj) => (
                    <Space size={0}>
                      <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(adj)} />
                      <Popconfirm
                        title="Delete this adjustment?"
                        description="The employee's balance recalculates immediately."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(adj)}
                      >
                        <Button size="small" type="link" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]
            : []),
        ]}
      />
    )
  }

  const years = []
  for (let y = new Date().getFullYear(); y >= new Date().getFullYear() - 5; y--) years.push(y)

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Leave Balance of All Users</h1>
          <p className="page-description">Year-wise leave usage breakdown for every employee</p>
        </div>

        {errorMsg && (
          <Alert
            type="error"
            showIcon
            message="Could not load leave balances"
            description={errorMsg}
            action={
              <Button size="small" danger onClick={load}>
                Retry
              </Button>
            }
            style={{ marginBottom: 16, borderRadius: 12 }}
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <StatsCard title="Employees" value={totals.employees} icon={<TeamOutlined />} color="#2563eb" loading={loading} />
          </Col>
          <Col xs={12} sm={6}>
            <StatsCard title="Total Quota" value={totals.totalQuota} suffix="days" icon={<CalendarOutlined />} color="#7c3aed" loading={loading} />
          </Col>
          <Col xs={12} sm={6}>
            <StatsCard title="Used" value={totals.totalUsed} suffix="days" icon={<ClockCircleOutlined />} color="#f59e0b" loading={loading} />
          </Col>
          <Col xs={12} sm={6}>
            <StatsCard title="Remaining" value={totals.totalRemaining} suffix="days" icon={<CheckCircleOutlined />} color="#16a34a" loading={loading} />
          </Col>
        </Row>

        <Card className="card-container">
          <Space wrap style={{ marginBottom: 16 }}>
            <Input
              placeholder="Search employee, code, department"
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
            <Select
              value={department}
              onChange={setDepartment}
              style={{ width: 180 }}
              options={departments.map((d) => ({
                label: d === 'ALL' ? 'All Departments' : d,
                value: d,
              }))}
            />
            <Select
              value={year}
              onChange={setYear}
              style={{ width: 120 }}
              options={years.map((y) => ({ label: String(y), value: y }))}
            />
            <Button icon={<ReloadOutlined />} onClick={load}>
              Refresh
            </Button>
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd(null)}>
                Add Adjustment
              </Button>
            )}
          </Space>

          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            loading={loading}
            scroll={{ x: TABLE_MIN_WIDTH }}
            locale={{ emptyText: 'No leave balance data found' }}
            expandable={{
              expandedRowRender: renderAdjustments,
              // Everyone can expand: an employee's own adjustments explain their
              // balance, and the edit controls inside are gated separately.
              rowExpandable: () => true,
            }}
          />
        </Card>

        <Modal
          open={modalOpen}
          title={
            <Space>
              <SlidersOutlined />
              {editing ? 'Edit Leave Adjustment' : 'Add Leave Adjustment'}
            </Space>
          }
          okText={editing ? 'Save changes' : 'Add adjustment'}
          confirmLoading={saving}
          onOk={handleSave}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
            form.resetFields()
          }}
          destroyOnClose
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Applies to ${year}`}
            description="Use a positive number to credit days (comp off earned, opening balance) and a negative number to debit them. Earned leave accrual and approved leaves are unaffected."
          />
          <Form form={form} layout="vertical" preserve={false}>
            <Form.Item
              name="userId"
              label="Employee"
              rules={[{ required: true, message: 'Select an employee' }]}
            >
              <Select
                showSearch
                placeholder="Select employee"
                optionFilterProp="label"
                options={data.map((d) => ({
                  value: d.id,
                  label: d.employeeCode ? `${d.employee} (${d.employeeCode})` : d.employee,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="leaveType"
              label="Leave type"
              rules={[{ required: true, message: 'Select a leave type' }]}
            >
              <Select
                options={[
                  { value: 'compOff', label: TYPE_LABELS.compOff },
                  { value: 'earned', label: TYPE_LABELS.earned },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="days"
              label="Days (negative to debit)"
              rules={[
                { required: true, message: 'Enter the number of days' },
                {
                  validator: (_, v) =>
                    Number(v) === 0
                      ? Promise.reject(new Error('Days cannot be zero'))
                      : Promise.resolve(),
                },
              ]}
            >
              <InputNumber style={{ width: '100%' }} step={0.5} min={-365} max={365} />
            </Form.Item>
            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ max: 500, message: 'Reason must be 500 characters or fewer' }]}
            >
              <Input.TextArea rows={3} placeholder="e.g. Comp off for Sunday work on 24 Aug" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          open={!!balanceRow}
          title={
            <Space>
              <EditOutlined />
              {balanceRow ? `Edit Leave Balance — ${balanceRow.employee}` : 'Edit Leave Balance'}
            </Space>
          }
          okText="Save"
          confirmLoading={savingBalance}
          onOk={handleSaveBalance}
          onCancel={() => {
            setBalanceRow(null)
            balanceForm.resetFields()
          }}
          destroyOnClose
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Applies to ${year}`}
            description="Enter the total each employee should have for the year. Days already used stay as they are, so the figure left to take moves with the total."
          />
          {/* destroyOnClose unmounts this form on close, so the row's current
              totals have to arrive as initialValues — a setFieldsValue in the
              open handler would run before the fields exist and leave the
              inputs blank. The key remounts it when a different employee is
              picked, so initialValues are re-read. */}
          <Form
            key={balanceRow?.id}
            form={balanceForm}
            layout="vertical"
            preserve={false}
            initialValues={{
              earned: Number(balanceRow?.totalEarned) || 0,
              compOff: Number(balanceRow?.totalCompOff) || 0,
              reason: '',
            }}
          >
            <Form.Item
              name="earned"
              label="Earned Leave total (days)"
              extra={
                balanceRow
                  ? `${balanceRow.usedEarned || 0} used${
                      balanceRow.holidaysDeducted > 0
                        ? ` · accrual gives ${balanceRow.accruedEarned} − ${balanceRow.holidaysDeducted} holiday${
                            balanceRow.holidaysDeducted === 1 ? '' : 's'
                          }`
                        : ` · accrual gives ${balanceRow.accruedEarned}`
                    }`
                  : null
              }
              rules={[{ required: true, message: 'Enter the earned leave total' }]}
            >
              <InputNumber style={{ width: '100%' }} step={0.5} min={0} max={365} />
            </Form.Item>
            <Form.Item
              name="compOff"
              label="Comp Off total (days)"
              extra={balanceRow ? `${balanceRow.usedCompOff || 0} used` : null}
              rules={[{ required: true, message: 'Enter the comp off total' }]}
            >
              <InputNumber style={{ width: '100%' }} step={0.5} min={0} max={365} />
            </Form.Item>
            <Form.Item
              name="reason"
              label="Note (optional)"
              rules={[{ max: 500, message: 'Note must be 500 characters or fewer' }]}
            >
              <Input.TextArea rows={2} placeholder="e.g. Opening balance carried over from 2025" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default LeaveBalanceAllUsers
