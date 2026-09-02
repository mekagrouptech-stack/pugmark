import React, { useEffect, useState } from 'react'
import { Card, Row, Col, InputNumber, Switch, Button, Tooltip, Typography, App } from 'antd'
import { SaveOutlined, InfoCircleOutlined } from '@ant-design/icons'
import hrService from '../../features/hr/hrService'
import { buildPreviewStructure, TDS_ANNUAL_THRESHOLD } from '../../utils/salaryStructureCalc'

const { Text } = Typography

/**
 * Salary Structure editor — the ONE place the structure is set.
 *
 * The company runs a single CTC structure (backend/utils/salaryStructure.js),
 * so the individual components are never edited by hand: Basic, HRA, Special
 * Allowance and Bonus are fixed percentages of Gross. Only three inputs exist,
 * and all live here:
 *
 *   Monthly CTC  (users.monthly_salary) — drives every figure
 *   PF applicable (users.pf_enabled)    — picks the with-PF / without-PF variant
 *   Monthly TDS  (users.monthly_tds)    — manual income tax, deducted from
 *                                         take-home and on every payroll run.
 *                                         Only shown when annual CTC is above
 *                                         ₹12,00,000; below that no TDS applies
 *                                         and the field is hidden.
 *
 * Rendered above SalaryStructureView on the HR Salary Structures page and
 * inside the Generate Payroll modal, so HR can set the structure on the same
 * screen where they read it.
 *
 * While either input differs from what is saved, `onPreview` emits a locally
 * calculated structure so the tables below update as you type. Saving reloads
 * the real structure from the server and the preview is dropped.
 *
 * @param {function} onPreview - receives the unsaved structure, or null
 *
 * @param {number}   userId       - employee whose structure is being set
 * @param {object}   structure    - current structure (from /api/salary/structure/:id)
 * @param {function} onSaved      - called after a successful save, to reload
 * @param {string}   title        - card title
 */
const SalaryStructureEditor = ({
  userId,
  structure,
  onSaved,
  onPreview,
  title = 'Set Salary Structure',
}) => {
  const { message } = App.useApp()
  const [ctc, setCtc] = useState(null)
  const [pf, setPf] = useState(false)
  const [tds, setTds] = useState(0)
  const [saving, setSaving] = useState(false)

  // Re-seed the fields whenever a different employee (or a fresh structure)
  // is loaded, so the inputs always show what is actually stored.
  useEffect(() => {
    setCtc(structure?.monthlyCTC ? Number(structure.monthlyCTC) : null)
    setPf(!!structure?.pfEnabled)
    setTds(structure?.tdsPerMonth ? Number(structure.tdsPerMonth) : 0)
  }, [userId, structure?.monthlyCTC, structure?.pfEnabled, structure?.tdsPerMonth])

  // TDS only applies above ₹12,00,000 annual CTC. Below that the field is hidden
  // and nothing is deducted, so the entered value is forced to zero — otherwise
  // lowering someone's CTC would leave a stale deduction waiting to reappear.
  const annualCTC = Number(ctc || 0) * 12
  const tdsApplicable = annualCTC > TDS_ANNUAL_THRESHOLD
  const effectiveTds = tdsApplicable ? Number(tds || 0) : 0

  const dirty =
    Number(ctc || 0) !== Number(structure?.monthlyCTC || 0) ||
    pf !== !!structure?.pfEnabled ||
    effectiveTds !== Number(structure?.tdsPerMonth || 0)

  // Feed the tables below a locally calculated structure while unsaved, so the
  // figures move as the CTC is typed.
  useEffect(() => {
    if (!onPreview) return
    onPreview(buildPreviewStructure(structure, ctc, pf, effectiveTds))
    // onPreview is a parent setState; listing it would loop on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctc, pf, effectiveTds, structure])

  const handleSave = async () => {
    if (!userId) return
    if (ctc == null || Number(ctc) < 0) {
      message.error('Enter a valid Monthly CTC')
      return
    }
    try {
      setSaving(true)
      await hrService.updateSalaryStructure(userId, {
        monthlySalary: Number(ctc),
        pfEnabled: pf,
        monthlyTds: effectiveTds,
      })
      message.success('Salary structure saved')
      if (onSaved) await onSaved()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save the salary structure')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      className="card-container"
      size="small"
      title={<span style={{ fontWeight: 700 }}>{title}</span>}
      style={{ marginBottom: 20 }}
    >
      <Row gutter={[16, 16]} align="bottom">
        <Col xs={24} sm={10} md={8}>
          <div style={{ marginBottom: 6 }}>
            <Text strong>Monthly CTC (₹)</Text>{' '}
            <Tooltip title="Total Cost to Company per month. Every row of the structure is calculated from this one figure.">
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          </div>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={99999999}
            step={1000}
            value={ctc}
            onChange={setCtc}
            disabled={!userId}
            placeholder="e.g. 59600"
            formatter={(v) => (v == null || v === '' ? '' : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
            parser={(v) => (v || '').replace(/,/g, '')}
          />
        </Col>

        <Col xs={24} sm={8} md={6}>
          <div style={{ marginBottom: 6 }}>
            <Text strong>PF Applicable</Text>{' '}
            <Tooltip title="On = with-PF structure (Employer and Employee PF of ₹1,800 each). Off = without-PF structure.">
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          </div>
          <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
            <Switch
              checked={pf}
              onChange={setPf}
              disabled={!userId}
              checkedChildren="With PF"
              unCheckedChildren="Without PF"
            />
          </div>
        </Col>

        {tdsApplicable && (
        <Col xs={24} sm={10} md={6}>
          <div style={{ marginBottom: 6 }}>
            <Text strong>Monthly TDS (₹)</Text>{' '}
            <Tooltip title="Income tax deducted at source each month. Entered by hand because it depends on the employee's declarations and tax regime — it is not derived from CTC. Deducted from take-home and applied on every payroll run.">
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          </div>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={99999999}
            step={500}
            value={tds}
            onChange={(v) => setTds(v ?? 0)}
            disabled={!userId}
            placeholder="0"
            formatter={(v) => (v == null || v === '' ? '' : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
            parser={(v) => (v || '').replace(/,/g, '')}
          />
        </Col>
        )}

        <Col xs={24} sm={6} md={4}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!userId || !dirty}
            block
          >
            Save
          </Button>
          {dirty && (
            <Text type="warning" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
              Preview — not saved yet
            </Text>
          )}
        </Col>

        <Col xs={24} md={6}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Basic 50%, HRA 25%, Special Allowance 15% and Bonus 10% of Gross are fixed by company
            policy and cannot be edited per employee.
            {!tdsApplicable && annualCTC > 0 && (
              <>
                {' '}
                TDS applies only above ₹12,00,000 annual CTC — this employee is at{' '}
                {'₹' + annualCTC.toLocaleString('en-IN')}, so no TDS is deducted.
              </>
            )}
          </Text>
        </Col>
      </Row>
    </Card>
  )
}

export default SalaryStructureEditor
