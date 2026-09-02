import React, { useState, useEffect } from 'react'
import { Card, Select, Button, Space, Spin, Alert, message } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import DashboardLayout from '../../layouts/DashboardLayout'
import salaryService from '../../features/salary/salaryService'
import hrService from '../../features/hr/hrService'
import SalaryStructureView from '../../components/salary/SalaryStructureView'
import SalaryStructureEditor from '../../components/salary/SalaryStructureEditor'
import { generateSalarySlipPdf } from '../../utils/salarySlipTemplate'

/**
 * Salary Structures (HR)
 * -----------------------------------------------------------------------------
 * The company runs ONE salary structure — the CTC breakup defined in
 * backend/utils/salaryStructure.js — and this page shows it for any employee
 * exactly as the salary slip renders it. Picking an employee loads the same
 * structure object the employee sees on My Salary and the same one the salary
 * slip PDF is generated from, so there is no way for the figures to diverge.
 *
 * The free-form formula builder this page used to host has been retired: a
 * structure per employee is derived from their Monthly CTC and PF flag, not
 * hand-authored.
 */
const SalaryStructures = () => {
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [structure, setStructure] = useState(null)
  const [loadingStructure, setLoadingStructure] = useState(false)
  const [downloading, setDownloading] = useState(false)
  // Locally calculated structure shown while the editor has unsaved changes.
  const [previewStructure, setPreviewStructure] = useState(null)

  const loadEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const data = await hrService.getEmployees({ role: undefined })
      setEmployees(Array.isArray(data) ? data : [])
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load employees')
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadStructure = async (userId) => {
    if (!userId) {
      setStructure(null)
      return
    }
    setLoadingStructure(true)
    try {
      const data = await salaryService.getUserSalaryStructure(userId)
      setStructure(data || null)
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load salary structure')
      setStructure(null)
    } finally {
      setLoadingStructure(false)
    }
  }

  const handleSelect = (userId) => {
    setSelectedUserId(userId)
    loadStructure(userId)
  }

  // Same generator the employee's My Salary page and HR Payroll use.
  const handleDownload = async () => {
    try {
      setDownloading(true)
      await generateSalarySlipPdf(structure)
      message.success('Salary slip downloaded')
    } catch (err) {
      message.error('Could not generate salary slip')
      // eslint-disable-next-line no-console
      console.error('Salary slip generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  const hasStructure = (structure?.monthlyCTC || 0) > 0

  return (
    <DashboardLayout>
      <div className="page-container">
        <div
          className="page-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}
        >
          <div>
            <h1 className="page-title">Salary Structures</h1>
            <p className="page-description">
              The company CTC structure, shown exactly as it appears on the salary slip.
            </p>
          </div>
          {hasStructure && (
            <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
              Download Salary Slip
            </Button>
          )}
        </div>

        <Card className="card-container" style={{ marginBottom: 20 }}>
          <Space wrap>
            <Select
              showSearch
              allowClear
              style={{ minWidth: 320 }}
              placeholder={loadingEmployees ? 'Loading employees...' : 'Select an employee'}
              loading={loadingEmployees}
              value={selectedUserId}
              onChange={handleSelect}
              optionFilterProp="label"
              options={(employees || []).map((e) => ({
                value: e.id,
                label: `${e.name || 'Unnamed'}${e.employeeCode ? ` (${e.employeeCode})` : ''}`,
              }))}
            />
            <Button icon={<ReloadOutlined />} onClick={loadEmployees} loading={loadingEmployees}>
              Refresh
            </Button>
          </Space>
        </Card>

        {!selectedUserId ? (
          <Alert
            type="info"
            showIcon
            message="Select an employee"
            description="Every employee follows the same CTC structure — Basic 50%, HRA 25%, Special Allowance 15% and Bonus 10% of Gross, plus Gratuity at 4.81% of Basic, with PF and Professional Tax applied per the employee's PF setting. Choose an employee to see their figures."
          />
        ) : loadingStructure ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <SalaryStructureEditor
              userId={selectedUserId}
              structure={structure}
              onSaved={() => loadStructure(selectedUserId)}
              onPreview={setPreviewStructure}
            />
            <SalaryStructureView
              structure={previewStructure || structure}
              emptyText="No Monthly CTC set yet. Enter one above and save to generate the structure."
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default SalaryStructures
