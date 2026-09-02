import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Input,
  message,
} from 'antd'
import { PlusOutlined, DownloadOutlined, MailOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import { formatDate } from '../../utils/attendanceTimeUtils'
import hrService from '../../features/hr/hrService'
import { wrapWithLetterhead, letterheadStyles, a4PageStyles } from '../../utils/letterhead'

const LETTER_TYPES = [
  { label: 'Experience Letter', value: 'Experience Letter' },
  { label: 'Relieving Letter', value: 'Relieving Letter' },
  { label: 'Salary Certificate', value: 'Salary Certificate' },
  { label: 'Joining Letter', value: 'Joining Letter' },
  { label: 'Promotion Letter', value: 'Promotion Letter' },
  { label: 'Appointment Letter', value: 'Appointment Letter' },
]

const STORAGE_KEY = 'hrms_generated_letters'

const getStoredLetters = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveLetters = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const generateLetterContent = (letter) => {
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const companyName = 'MEKA INFRASTRUCTURE PRIVATE LIMITED'
  const templates = {
    'Experience Letter': `
      <h2>EXPERIENCE LETTER</h2>
      <p>Date: ${date}</p>
      <p>To Whom It May Concern,</p>
      <p>This is to certify that <strong>${letter.employee}</strong> was employed with ${companyName} from [Date of Joining] to [Date of Relieving].</p>
      <p>During the tenure, ${letter.employee} worked as [Designation] in the [Department] department and performed duties with dedication and professionalism.</p>
      <p>We wish ${letter.employee} success in all future endeavors.</p>
      <p>Yours sincerely,<br/>HR Department<br/>${companyName}</p>
    `,
    'Relieving Letter': `
      <h2>RELIEVING LETTER</h2>
      <p>Date: ${date}</p>
      <p>To Whom It May Concern,</p>
      <p>This is to certify that <strong>${letter.employee}</strong> has been relieved from the services of ${companyName} with effect from [Date].</p>
      <p>All dues have been cleared and no claims are pending against the company.</p>
      <p>We wish ${letter.employee} success in future endeavors.</p>
      <p>Yours sincerely,<br/>HR Department<br/>${companyName}</p>
    `,
    'Salary Certificate': `
      <h2>SALARY CERTIFICATE</h2>
      <p>Date: ${date}</p>
      <p>To Whom It May Concern,</p>
      <p>This is to certify that <strong>${letter.employee}</strong> is employed with ${companyName} as [Designation].</p>
      <p>The gross monthly salary is Rs. [Amount] and the annual CTC is Rs. [Amount].</p>
      <p>This certificate is issued for [Purpose].</p>
      <p>Yours sincerely,<br/>HR Department<br/>${companyName}</p>
    `,
    'Joining Letter': `
      <h2>JOINING LETTER</h2>
      <p>Date: ${date}</p>
      <p>Dear ${letter.employee},</p>
      <p>We are pleased to confirm your appointment with ${companyName} as [Designation] in the [Department] department with effect from [Date of Joining].</p>
      <p>Please report to [Location] on the joining date.</p>
      <p>Yours sincerely,<br/>HR Department<br/>${companyName}</p>
    `,
    'Promotion Letter': `
      <h2>PROMOTION LETTER</h2>
      <p>Date: ${date}</p>
      <p>Dear ${letter.employee},</p>
      <p>We are pleased to inform you of your promotion to [New Designation] in the [Department] department with effect from [Date].</p>
      <p>Congratulations on this achievement. We look forward to your continued contribution.</p>
      <p>Yours sincerely,<br/>HR Department<br/>${companyName}</p>
    `,
    'Appointment Letter': `
      <h2>APPOINTMENT LETTER</h2>
      <p>Date: ${date}</p>
      <p>Dear ${letter.employee},</p>
      <p>We are pleased to offer you the position of [Designation] at ${companyName} in the [Department] department.</p>
      <p>Your date of joining will be [Date]. Please refer to the attached terms and conditions.</p>
      <p>Yours sincerely,<br/>HR Department<br/>${companyName}</p>
    `,
  }
  const body = templates[letter.letterType] || templates['Experience Letter']
  const fullBody = wrapWithLetterhead(body, letter.letterType)
  const styles = `${a4PageStyles}.letter-body h2{text-align:center;color:#1a5f9e;margin-bottom:20px;}${letterheadStyles}`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${letter.letterType} - ${letter.employee}</title><style>${styles}</style></head><body>${fullBody}</body></html>`
}

const GenerateLetters = () => {
  const [letters, setLetters] = useState(getStoredLetters)
  const [modalOpen, setModalOpen] = useState(false)
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
  const [sendingLetter, setSendingLetter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [employees, setEmployees] = useState([])
  const [form] = Form.useForm()
  const [emailForm] = Form.useForm()

  useEffect(() => {
    const load = async () => {
      try {
        const list = await hrService.getAllActiveUsers()
        setEmployees(list.map((u) => ({
          label: u.name || u.email || `User ${u.id}`,
          value: u.id,
          name: u.name || u.email,
          email: u.email || '',
        })))
      } catch {
        // Leave the picker empty rather than offering a placeholder employee.
        setEmployees([])
      }
    }
    load()
  }, [])

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      const emp = employees.find((e) => String(e.value) === String(values.employeeId))
      const employeeName = emp?.name || values.employeeId
      const newLetter = {
        id: `L${Date.now()}`,
        employeeId: values.employeeId,
        employee: employeeName,
        employeeEmail: emp?.email || '',
        letterType: values.letterType,
        generatedDate: new Date().toISOString().split('T')[0],
        status: 'Generated',
      }
      const next = [newLetter, ...letters]
      setLetters(next)
      saveLetters(next)
      setModalOpen(false)
      form.resetFields()
      message.success('Letter generated successfully')
    } catch (err) {
      if (err?.errorFields) return
      message.error('Please select employee and letter type')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (record) => {
    const content = generateLetterContent(record)
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${record.letterType.replace(/\s+/g, '_')}_${record.employee.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
    message.success('Letter downloaded')
  }

  const handleSendEmailClick = (record) => {
    setSendingLetter(record)
    emailForm.setFieldsValue({ to: record.employeeEmail || '' })
    setSendEmailModalOpen(true)
  }

  const handleSendEmail = async () => {
    if (!sendingLetter) return
    try {
      const { to } = await emailForm.validateFields()
      setSending(true)
      await hrService.sendLetterEmail({
        to,
        employee: sendingLetter.employee,
        letterType: sendingLetter.letterType,
      })
      message.success('Letter sent via email successfully')
      setSendEmailModalOpen(false)
      setSendingLetter(null)
      emailForm.resetFields()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Letter Type', dataIndex: 'letterType', key: 'letterType' },
    { title: 'Generated Date', dataIndex: 'generatedDate', key: 'generatedDate', render: (text) => formatDate(text) },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
            Download
          </Button>
          <Button type="link" icon={<MailOutlined />} onClick={() => handleSendEmailClick(record)}>
            Send Email
          </Button>
        </Space>
      ),
    },
  ]

  const dataSource = letters.map((l, i) => ({ ...l, key: l.id || `letter-${i}` }))

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Generate Letters</h1>
          <p className="page-description">Generate official letters for employees</p>
        </div>

        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Generate Letter
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: 'No letters generated yet. Click "Generate Letter" to create one.' }}
          />
        </Card>

        <Modal
          title="Send Letter via Email"
          open={sendEmailModalOpen}
          onOk={handleSendEmail}
          onCancel={() => { setSendEmailModalOpen(false); setSendingLetter(null); emailForm.resetFields() }}
          confirmLoading={sending}
          okText="Send Email"
        >
          {sendingLetter && (
            <Form form={emailForm} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item label="Letter" style={{ marginBottom: 8 }}>
                <span>{sendingLetter.letterType} - {sendingLetter.employee}</span>
              </Form.Item>
              <Form.Item
                name="to"
                label="Recipient Email"
                rules={[
                  { required: true, message: 'Enter email address' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input placeholder="employee@company.com" type="email" />
              </Form.Item>
            </Form>
          )}
        </Modal>

        <Modal
          title="Generate Letter"
          open={modalOpen}
          onOk={handleGenerate}
          onCancel={() => { setModalOpen(false); form.resetFields() }}
          confirmLoading={loading}
          okText="Generate"
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="employeeId"
              label="Employee"
              rules={[{ required: true, message: 'Select an employee' }]}
            >
              <Select
                placeholder="Select employee"
                options={employees}
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="letterType"
              label="Letter Type"
              rules={[{ required: true, message: 'Select letter type' }]}
            >
              <Select placeholder="Select letter type" options={LETTER_TYPES} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default GenerateLetters
