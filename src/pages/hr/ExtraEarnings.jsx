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
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import hrService from '../../features/hr/hrService'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TYPE_OPTIONS = [
  { label: 'Bonus', value: 'Bonus' },
  { label: 'Overtime', value: 'Overtime' },
  { label: 'Allowance', value: 'Allowance' },
  { label: 'Incentive', value: 'Incentive' },
  { label: 'Deduction', value: 'Deduction' },
  { label: 'Fine', value: 'Fine' },
  { label: 'Advance', value: 'Advance' },
  { label: 'Other', value: 'Other' },
]

const ExtraEarnings = () => {
  const [data, setData] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const currentYear = new Date().getFullYear()
  const monthOptions = MONTH_NAMES.map((name, i) => ({ label: name, value: i + 1 }))
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => ({
    label: String(y),
    value: y,
  }))

  const load = async () => {
    try {
      setLoading(true)
      const [list, empList] = await Promise.all([
        hrService.getExtraEarnings(),
        hrService.getAllActiveUsers(),
      ])
      setData(list.map((item) => ({ ...item, key: item.id })))
      setEmployees(empList || [])
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load data')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      month: new Date().getMonth() + 1,
      year: currentYear,
      status: 'PENDING',
    })
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      userId: record.userId,
      type: record.type,
      amount: record.amount,
      month: record.month,
      year: record.year,
      status: record.status,
      remarks: record.remarks,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        userId: values.userId,
        type: values.type,
        amount: values.amount,
        month: values.month,
        year: values.year,
        status: values.status,
        remarks: values.remarks || '',
      }
      if (editingId) {
        await hrService.updateExtraEarning(editingId, payload)
        message.success('Entry updated successfully')
      } else {
        await hrService.createExtraEarning(payload)
        message.success('Entry created successfully')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deleteExtraEarning(id)
      message.success('Entry deleted')
      load()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to delete')
    }
  }

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span style={{ color: Number(amount) < 0 ? '#ff4d4f' : undefined }}>
          ₹{Number(amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    { title: 'Month', dataIndex: 'monthYear', key: 'monthYear' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this entry?"
            onConfirm={() => handleDelete(record.id)}
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
        <div className="page-header">
          <h1 className="page-title">Extra Earnings / Deductions</h1>
          <p className="page-description">Manage extra earnings and deductions</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Entry
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 10 }}
            loading={loading}
            locale={{ emptyText: 'No entries. Click "Add Entry" to create one.' }}
          />
        </Card>

        <Modal
          title={editingId ? 'Edit Entry' : 'Add Entry'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSubmit}
          okText="Save"
          width={480}
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="userId"
              label="Employee"
              rules={[{ required: true, message: 'Select employee' }]}
            >
              <Select
                placeholder="Select employee"
                showSearch
                optionFilterProp="label"
                disabled={!!editingId}
                options={employees.map((e) => ({
                  label: `${e.name}${e.employeeCode ? ` (${e.employeeCode})` : ''}`,
                  value: e.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Select type' }]}
            >
              <Select placeholder="Select type" options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="amount"
              label="Amount (₹)"
              rules={[{ required: true, message: 'Enter amount' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Positive for earnings, negative for deductions"
                min={-999999}
                max={999999}
                step={100}
              />
            </Form.Item>
            <Space style={{ width: '100%' }} size="middle">
              <Form.Item
                name="month"
                label="Month"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Month" options={monthOptions} />
              </Form.Item>
              <Form.Item
                name="year"
                label="Year"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Year" options={yearOptions} />
              </Form.Item>
            </Space>
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Processed', value: 'PROCESSED' },
                ]}
              />
            </Form.Item>
            <Form.Item name="remarks" label="Remarks">
              <Input.TextArea rows={2} placeholder="Optional remarks" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ExtraEarnings
