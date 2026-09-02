import React, { useState } from 'react'
import { Card, Form, DatePicker, Select, InputNumber, Input, Button, Table, Space, Upload, message } from 'antd'
import { PlusOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { createReimbursement } from '../../features/reimbursement/reimbursementSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import dayjs from 'dayjs'

const { TextArea } = Input
const { RangePicker } = DatePicker

const NonCTCReimbursement = () => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [expenseRows, setExpenseRows] = useState([
    { id: 1, type: '', date: null, amount: 0, purpose: '', proof: null },
  ])

  const expenseTypes = [
    'Office Supplies',
    'Internet',
    'Phone Bill',
    'Training',
    'Conveyance',
    'Medical',
    'Other',
  ]

  const handleAddRow = () => {
    setExpenseRows([
      ...expenseRows,
      { id: Date.now(), type: '', date: null, amount: 0, purpose: '', proof: null },
    ])
  }

  const handleRemoveRow = (id) => {
    if (expenseRows.length > 1) {
      setExpenseRows(expenseRows.filter((row) => row.id !== id))
    } else {
      message.warning('At least one expense row is required')
    }
  }

  const handleRowChange = (id, field, value) => {
    setExpenseRows(
      expenseRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const calculateTotal = () => {
    return expenseRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0)
  }

  const onFinish = (values) => {
    const reimbursementData = {
      requestType: 'Non-CTC',
      periodFrom: values.period[0].format('YYYY-MM-DD'),
      periodTo: values.period[1].format('YYYY-MM-DD'),
      totalAmount: calculateTotal(),
      expenseDetails: expenseRows.map((row) => ({
        type: row.type,
        date: row.date ? row.date.format('YYYY-MM-DD') : null,
        amount: parseFloat(row.amount) || 0,
        purpose: row.purpose,
      })),
    }

    dispatch(createReimbursement(reimbursementData))
      .unwrap()
      .then(() => {
        message.success('Reimbursement request submitted successfully!')
        form.resetFields()
        setExpenseRows([{ id: 1, type: '', date: null, amount: 0, purpose: '', proof: null }])
      })
      .catch((err) => {
        message.error(err || 'Failed to submit reimbursement')
      })
  }

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (_, record) => (
        <Select
          placeholder="Select type"
          style={{ width: '100%' }}
          value={record.type}
          onChange={(value) => handleRowChange(record.id, 'type', value)}
        >
          {expenseTypes.map((type) => (
            <Select.Option key={type} value={type}>
              {type}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => (
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          value={record.date}
          onChange={(date) => handleRowChange(record.id, 'date', date)}
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.amount}
          onChange={(value) => handleRowChange(record.id, 'amount', value)}
        />
      ),
    },
    {
      title: 'Purpose / Remark',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (_, record) => (
        <TextArea
          rows={2}
          placeholder="Enter purpose"
          value={record.purpose}
          onChange={(e) => handleRowChange(record.id, 'purpose', e.target.value)}
        />
      ),
    },
    {
      title: 'Proof',
      key: 'proof',
      render: (_, record) => (
        <Upload
          accept=".pdf,.jpg,.jpeg,.png"
          beforeUpload={(file) => {
            const isPDF = file.type === 'application/pdf'
            const isImage = file.type.startsWith('image/')
            const isLt5M = file.size / 1024 / 1024 < 5

            if (!isPDF && !isImage) {
              message.error('You can only upload PDF or Image files!')
              return Upload.LIST_IGNORE
            }
            if (!isLt5M) {
              message.error('File must be smaller than 5MB!')
              return Upload.LIST_IGNORE
            }

            handleRowChange(record.id, 'proof', file)
            return false
          }}
          maxCount={1}
        >
          <Button icon={<PaperClipOutlined />} size="small">
            Upload
          </Button>
        </Upload>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveRow(record.id)}
          size="small"
        />
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Expense Report - Non-CTC Reimbursement</h1>
          <p className="page-description">Submit your non-CTC reimbursement request</p>
        </div>

        <Card className="card-container">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="period"
              label="Period"
              rules={[{ required: true, message: 'Please select period!' }]}
            >
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Expense Details</h3>
                <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRow}>
                  Add Expense
                </Button>
              </div>

              <Table
                columns={columns}
                dataSource={expenseRows}
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </div>

            <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 4, textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Total Amount: ₹{calculateTotal().toLocaleString('en-IN')}
              </div>
            </div>

            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" htmlType="submit" size="large" block>
                Submit Reimbursement Request
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default NonCTCReimbursement
