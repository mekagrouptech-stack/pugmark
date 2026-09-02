import React from 'react'
import { Card, Row, Col, Tag, Empty } from 'antd'
import {
  BankOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  PercentageOutlined,
} from '@ant-design/icons'

/**
 * Salary Structure view — the ONE presentation of the company CTC structure.
 *
 * Every screen that shows a salary breakup renders this component so the
 * figures and the layout are identical everywhere: the employee's My Salary
 * page, the HR Salary Structures page, and the HR Payroll generate/preview
 * modal. The data always comes from the backend structure object produced by
 * backend/utils/salaryStructure.js (served by /api/salary/me and
 * /api/salary/structure/:userId) — this component never does salary maths of
 * its own.
 */

// ₹ with Indian grouping. Zero renders as an em dash to mirror the sheet.
export const inr = (n) => {
  const v = Number(n) || 0
  if (v === 0) return '—'
  return '₹' + v.toLocaleString('en-IN')
}
export const inrZero = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN')

export const COLORS = {
  primary: '#2563eb',
  ink: '#0f172a',
  sub: '#64748b',
  border: '#e2e8f0',
  headerBg: '#f8fafc',
  totalBg: '#eff4ff',
  green: '#16a34a',
  greenBg: '#ecfdf5',
}

const StatTile = ({ icon, label, value, accent }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      background: '#fff',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      boxShadow: '0 2px 10px rgba(15,23,42,.05)',
      height: '100%',
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 18,
        background: accent || COLORS.primary,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ color: COLORS.sub, fontSize: 12, fontWeight: 500 }}>{label}</div>
      <div style={{ color: COLORS.ink, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
)

// Shared cell styles for the solid, Excel-like tables.
const th = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.ink,
  background: COLORS.headerBg,
  borderBottom: `1px solid ${COLORS.border}`,
}
const thRight = { ...th, textAlign: 'right' }
const td = {
  padding: '10px 14px',
  fontSize: 14,
  color: COLORS.ink,
  borderBottom: `1px solid #eef1f6`,
}
const tdRight = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
const tdSub = { ...td, color: COLORS.sub }

/**
 * @param {object}  structure    - the API structure object (/salary/me shape)
 * @param {boolean} showBanner   - render the blue employee/CTC banner
 * @param {boolean} showTiles    - render the headline stat tiles
 * @param {string}  emptyText    - message when no structure is configured
 */
const SalaryStructureView = ({
  structure,
  showBanner = true,
  showTiles = true,
  emptyText = 'Salary structure has not been configured yet.',
}) => {
  const s = structure || {}
  const withPF = !!s.pfEnabled
  const hasStructure = (s.monthlyCTC || 0) > 0
  // Manual monthly TDS. Zero means none is configured, in which case the
  // take-home shown is the pre-TDS figure and the labels say so.
  const tdsMonthly = Number(s.tdsPerMonth ?? s.net?.tds?.monthly ?? 0)
  const hasTds = tdsMonthly > 0

  if (!hasStructure) {
    return (
      <Card className="card-container">
        <Empty description={<span style={{ color: COLORS.sub }}>{emptyText}</span>} />
      </Card>
    )
  }

  return (
    <>
      {showBanner && (
        <Card
          className="card-container"
          style={{ marginBottom: 20, overflow: 'hidden' }}
          styles={{ body: { padding: 0 } }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              padding: '22px 24px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#fff',
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                {s.employee?.name || 'Employee'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {s.employee?.employeeCode && <span>Code: {s.employee.employeeCode}</span>}
                {s.employee?.department && <span>Dept: {s.employee.department}</span>}
                <Tag
                  color={withPF ? 'gold' : 'green'}
                  style={{ margin: 0, fontWeight: 600, borderRadius: 6 }}
                >
                  {withPF ? 'With PF' : 'Without PF'}
                </Tag>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.85, letterSpacing: 0.4 }}>ANNUAL CTC</div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>{inrZero(s.annualCTC)}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{inrZero(s.monthlyCTC)} / month</div>
            </div>
          </div>
        </Card>
      )}

      {showTiles && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} md={8} lg={6}>
            <StatTile icon={<WalletOutlined />} label="Gross / Month" value={inrZero(s.grossMonthly)} accent="#2563eb" />
          </Col>
          <Col xs={12} md={8} lg={6}>
            <StatTile icon={<WalletOutlined />} label="Take Home / Month" value={inrZero(s.takeHomeMonthly)} accent={COLORS.green} />
          </Col>
          <Col xs={12} md={8} lg={6}>
            <StatTile icon={<SafetyCertificateOutlined />} label="Gratuity / Month" value={inrZero(s.gratuityPerMonth)} accent="#f59e0b" />
          </Col>
          <Col xs={12} md={8} lg={6}>
            <StatTile icon={<PercentageOutlined />} label="Prof. Tax / Month" value={inrZero(s.ptPerMonth)} accent="#64748b" />
          </Col>
          {hasTds && (
            <Col xs={12} md={8} lg={6}>
              <StatTile icon={<PercentageOutlined />} label="TDS / Month" value={inrZero(tdsMonthly)} accent="#ef4444" />
            </Col>
          )}
          <Col xs={12} md={8} lg={6}>
            <StatTile icon={<BankOutlined />} label="Employer PF / Month" value={inrZero(s.employerPFPerMonth)} accent="#0ea5e9" />
          </Col>
          <Col xs={12} md={8} lg={6}>
            <StatTile icon={<BankOutlined />} label="Employee PF / Month" value={inrZero(s.employeePFPerMonth)} accent="#0ea5e9" />
          </Col>
        </Row>
      )}

      <Row gutter={[20, 20]}>
        {/* ── Earnings / Salary Structure table ────────────── */}
        <Col xs={24} lg={14}>
          <Card
            className="card-container"
            title={<span style={{ fontWeight: 700 }}>Salary Structure</span>}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Component</th>
                    <th style={thRight}>Monthly</th>
                    <th style={thRight}>Annual</th>
                  </tr>
                </thead>
                <tbody>
                  {(s.earnings || [])
                    .filter((row) => Number(row.monthly) > 0)
                    .map((row) => (
                      <tr key={row.key}>
                        <td style={td}>{row.label}</td>
                        <td style={tdRight}>{inr(row.monthly)}</td>
                        <td style={tdRight}>{inr(row.annual)}</td>
                      </tr>
                    ))}
                  {/* Gross Salary (bold subtotal) */}
                  <tr style={{ background: COLORS.headerBg }}>
                    <td style={{ ...td, fontWeight: 700 }}>Gross Salary</td>
                    <td style={{ ...tdRight, fontWeight: 700 }}>{inrZero(s.grossSalary?.monthly)}</td>
                    <td style={{ ...tdRight, fontWeight: 700 }}>{inrZero(s.grossSalary?.annual)}</td>
                  </tr>
                  <tr>
                    <td style={td}>Gratuity</td>
                    <td style={tdRight}>{inr(s.gratuity?.monthly)}</td>
                    <td style={tdRight}>{inr(s.gratuity?.annual)}</td>
                  </tr>
                  <tr>
                    <td style={td}>Employer PF</td>
                    <td style={tdRight}>{inr(s.employerPF?.monthly)}</td>
                    <td style={tdRight}>{inr(s.employerPF?.annual)}</td>
                  </tr>
                  {/* Total CTC (highlighted) */}
                  <tr style={{ background: COLORS.totalBg }}>
                    <td style={{ ...td, fontWeight: 800, color: COLORS.primary, borderBottom: 'none' }}>Total CTC</td>
                    <td style={{ ...tdRight, fontWeight: 800, color: COLORS.primary, borderBottom: 'none' }}>
                      {inrZero(s.totalCTCRow?.monthly)}
                    </td>
                    <td style={{ ...tdRight, fontWeight: 800, color: COLORS.primary, borderBottom: 'none' }}>
                      {inrZero(s.totalCTCRow?.annual)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </Col>

        {/* ── Net / Take Home table ────────────────────────── */}
        <Col xs={24} lg={10}>
          <Card
            className="card-container"
            title={
              <span style={{ fontWeight: 700 }}>
                {hasTds ? 'Take Home (After TDS)' : 'Take Home (Before TDS)'}
              </span>
            }
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Particulars</th>
                    <th style={thRight}>Monthly</th>
                    <th style={thRight}>Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={td}>Gross Salary</td>
                    <td style={tdRight}>{inrZero(s.net?.grossSalary?.monthly)}</td>
                    <td style={tdRight}>{inrZero(s.net?.grossSalary?.annual)}</td>
                  </tr>
                  <tr>
                    <td style={tdSub}>Less: Employee PF</td>
                    <td style={{ ...tdRight, color: '#ef4444' }}>
                      {s.net?.employeePF?.monthly ? `- ${inrZero(s.net.employeePF.monthly)}` : '—'}
                    </td>
                    <td style={{ ...tdRight, color: '#ef4444' }}>
                      {s.net?.employeePF?.annual ? `- ${inrZero(s.net.employeePF.annual)}` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style={tdSub}>Less: Professional Tax</td>
                    <td style={{ ...tdRight, color: '#ef4444' }}>- {inrZero(s.net?.professionalTax?.monthly)}</td>
                    <td style={{ ...tdRight, color: '#ef4444' }}>- {inrZero(s.net?.professionalTax?.annual)}</td>
                  </tr>
                  <tr style={{ background: COLORS.headerBg }}>
                    <td style={{ ...td, fontWeight: 700 }}>Net Salary (Before TDS)</td>
                    <td style={{ ...tdRight, fontWeight: 700 }}>{inrZero(s.net?.netSalary?.monthly)}</td>
                    <td style={{ ...tdRight, fontWeight: 700 }}>{inrZero(s.net?.netSalary?.annual)}</td>
                  </tr>
                  {/* Manual TDS — only for employees above the annual-CTC threshold. */}
                  {hasTds && (
                    <tr>
                      <td style={tdSub}>Less: TDS (Income Tax)</td>
                      <td style={{ ...tdRight, color: '#ef4444' }}>- {inrZero(tdsMonthly)}</td>
                      <td style={{ ...tdRight, color: '#ef4444' }}>
                        - {inrZero(s.net?.tds?.annual ?? tdsMonthly * 12)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ background: COLORS.greenBg }}>
                    <td style={{ ...td, fontWeight: 800, color: COLORS.green, borderBottom: 'none' }}>
                      Take Home{hasTds ? ' (After TDS)' : ''}
                    </td>
                    <td style={{ ...tdRight, fontWeight: 800, color: COLORS.green, borderBottom: 'none' }}>
                      {inrZero(s.takeHomeMonthly)}
                    </td>
                    <td style={{ ...tdRight, fontWeight: 800, color: COLORS.green, borderBottom: 'none' }}>
                      {inrZero(s.net?.takeHome?.annual ?? s.net?.netSalary?.annual)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 14px', color: COLORS.sub, fontSize: 12 }}>
              {hasTds
                ? '* TDS is the manual monthly figure set on the salary structure. Gratuity & Employer PF are CTC components, not part of monthly take-home.'
                : '* TDS applies only above ₹12,00,000 annual CTC. Gratuity & Employer PF are CTC components, not part of monthly take-home.'}
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default SalaryStructureView
