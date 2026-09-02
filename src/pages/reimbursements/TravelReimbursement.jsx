import React, { useState } from 'react'
import { Card, Form, DatePicker, Input, InputNumber, Upload, Button, Table, Space, Row, Col, message } from 'antd'
import { PlusOutlined, DeleteOutlined, PaperClipOutlined, CalculatorOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { createTravelReimbursement } from '../../features/reimbursement/reimbursementSlice'
import DashboardLayout from '../../layouts/DashboardLayout'
import dayjs from 'dayjs'

const { TextArea } = Input

const TravelReimbursement = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [form] = Form.useForm()
  const [expenseRows, setExpenseRows] = useState([
    {
      id: 1,
      date: null,
      description: '',
      hotels: 0,
      transport: 0,
      fuel: 0,
      meals: 0,
      phone: 0,
      perDiem: 0,
      misc: 0,
    },
  ])

  const handleAddRow = () => {
    setExpenseRows([
      ...expenseRows,
      {
        id: Date.now(),
        date: null,
        description: '',
        hotels: 0,
        transport: 0,
        fuel: 0,
        meals: 0,
        phone: 0,
        perDiem: 0,
        misc: 0,
      },
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

  const calculateRowTotal = (row) => {
    const total =
      (parseFloat(row.hotels) || 0) +
      (parseFloat(row.transport) || 0) +
      (parseFloat(row.fuel) || 0) +
      (parseFloat(row.meals) || 0) +
      (parseFloat(row.phone) || 0) +
      (parseFloat(row.perDiem) || 0) +
      (parseFloat(row.misc) || 0)
    return total
  }

  const calculateCategoryTotal = (category) => {
    return expenseRows.reduce((sum, row) => sum + (parseFloat(row[category]) || 0), 0)
  }

  const calculateNetPayable = () => {
    const categoryTotal = expenseRows.reduce((sum, row) => sum + calculateRowTotal(row), 0)
    const categoryLess = form.getFieldValue('categoryLess') || 0
    return categoryTotal - categoryLess
  }

  const onFinish = (values) => {
    const totalAmount = Math.max(0, calculateNetPayable())
    const purposeText = [values.project, values.purpose].filter(Boolean).join(' – ') || 'Travel reimbursement'

    const reimbursementData = {
      requestType: 'Travel',
      periodFrom: values.periodFrom.format('YYYY-MM-DD'),
      periodTo: values.periodTo.format('YYYY-MM-DD'),
      totalAmount,
      expenseDetails: expenseRows.map((row) => ({
        type: 'Travel',
        date: row.date ? dayjs(row.date).format('YYYY-MM-DD') : null,
        amount: calculateRowTotal(row),
        purpose: row.description
          ? `${row.description}${purposeText ? ` | ${purposeText}` : ''}`
          : purposeText,
      })),
    }

    dispatch(createTravelReimbursement(reimbursementData))
      .unwrap()
      .then(() => {
        message.success('Travel reimbursement request submitted successfully!')
        form.resetFields()
        setExpenseRows([
          {
            id: 1,
            date: null,
            description: '',
            hotels: 0,
            transport: 0,
            fuel: 0,
            meals: 0,
            phone: 0,
            perDiem: 0,
            misc: 0,
          },
        ])
      })
      .catch((err) => {
        message.error(err || 'Failed to submit reimbursement')
      })
  }

  const expenseColumns = [
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_, record) => (
        <TextArea
          rows={2}
          placeholder="Enter description"
          value={record.description}
          onChange={(e) => handleRowChange(record.id, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Hotels',
      dataIndex: 'hotels',
      key: 'hotels',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.hotels}
          onChange={(value) => handleRowChange(record.id, 'hotels', value)}
        />
      ),
    },
    {
      title: 'Transport',
      dataIndex: 'transport',
      key: 'transport',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.transport}
          onChange={(value) => handleRowChange(record.id, 'transport', value)}
        />
      ),
    },
    {
      title: 'Fuel',
      dataIndex: 'fuel',
      key: 'fuel',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.fuel}
          onChange={(value) => handleRowChange(record.id, 'fuel', value)}
        />
      ),
    },
    {
      title: 'Meals',
      dataIndex: 'meals',
      key: 'meals',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.meals}
          onChange={(value) => handleRowChange(record.id, 'meals', value)}
        />
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.phone}
          onChange={(value) => handleRowChange(record.id, 'phone', value)}
        />
      ),
    },
    {
      title: 'Per Diem',
      dataIndex: 'perDiem',
      key: 'perDiem',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.perDiem}
          onChange={(value) => handleRowChange(record.id, 'perDiem', value)}
        />
      ),
    },
    {
      title: 'Misc',
      dataIndex: 'misc',
      key: 'misc',
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          prefix="₹"
          min={0}
          value={record.misc}
          onChange={(value) => handleRowChange(record.id, 'misc', value)}
        />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => (
        <strong>₹{calculateRowTotal(record).toLocaleString('en-IN')}</strong>
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
          <h1 className="page-title">Travel Reimbursement</h1>
          <p className="page-description">Submit your travel expense reimbursement request</p>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card className="card-container" title="Employee Information" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div>
                    <strong>Name:</strong> {user?.name || 'N/A'}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <strong>Employee ID:</strong> {user?.id ? `EMP${user.id.toString().padStart(3, '0')}` : 'N/A'}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <strong>Position:</strong> {user?.designation || 'N/A'}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <strong>Department:</strong> {user?.department || 'N/A'}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <strong>Manager:</strong> Manager Name
                  </div>
                </Col>
              </Row>
            </Card>

            <Card className="card-container">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="periodFrom"
                      label="Period From"
                      rules={[{ required: true, message: 'Please select date!' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="periodTo"
                      label="Period To"
                      rules={[{ required: true, message: 'Please select date!' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="project" label="Project">
                  <Input placeholder="Enter project name" />
                </Form.Item>

                <Form.Item name="purpose" label="Purpose">
                  <TextArea rows={3} placeholder="Enter purpose of travel" />
                </Form.Item>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Expense Details</h3>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRow}>
                      Add Row
                    </Button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <Table
                      columns={expenseColumns}
                      dataSource={expenseRows}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      size="small"
                    />
                  </div>
                </div>

                <Card title="Summary" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Hotels:</strong> ₹{calculateCategoryTotal('hotels').toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Transport:</strong> ₹{calculateCategoryTotal('transport').toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Fuel:</strong> ₹{calculateCategoryTotal('fuel').toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Meals:</strong> ₹{calculateCategoryTotal('meals').toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Phone:</strong> ₹{calculateCategoryTotal('phone').toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Per Diem:</strong> ₹{calculateCategoryTotal('perDiem').toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Misc:</strong> ₹{calculateCategoryTotal('misc').toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div>
                        <strong>Category Total:</strong> ₹
                        {expenseRows.reduce((sum, row) => sum + calculateRowTotal(row), 0).toLocaleString('en-IN')}
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="categoryLess" label="Category Less">
                        <InputNumber
                          style={{ width: '100%' }}
                          prefix="₹"
                          min={0}
                          placeholder="Enter amount"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4, textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                      Net Payable Amount: ₹{calculateNetPayable().toLocaleString('en-IN')}
                    </div>
                  </div>
                </Card>

                <Card title="Attachments" style={{ marginBottom: 16 }}>
                  <Form.Item name="attachments">
                    <Upload
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      beforeUpload={() => false}
                      listType="text"
                    >
                      <Button icon={<PaperClipOutlined />}>Upload Proof Documents</Button>
                    </Upload>
                  </Form.Item>
                </Card>

                <Card title="Bank Details (optional)">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="accountHolderName" label="Account Holder Name">
                        <Input placeholder="Enter account holder name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="bank" label="Bank">
                        <Input placeholder="Enter bank name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="accountNumber" label="Account Number">
                        <Input placeholder="Enter account number" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="ifsc" label="IFSC Code">
                        <Input placeholder="Enter IFSC code" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Form.Item style={{ marginTop: 24 }}>
                  <Button type="primary" htmlType="submit" size="large" block>
                    Submit Travel Reimbursement Request
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Employee Details" className="card-container">
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Name:</strong> {user?.name || 'N/A'}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Designation:</strong> {user?.designation || 'N/A'}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>DOJ:</strong> 2023-01-15
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Manager:</strong> Manager Name
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Email:</strong> {user?.email || 'N/A'}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Status:</strong> Active
                </div>
                <div>
                  <strong>City:</strong> City Name
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}

export default TravelReimbursement
