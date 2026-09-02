import { numberToWordsINR, loadMekaLogo, getMekaLogo } from './payslipTemplate'

/**
 * Salary Slip (full CTC Structure) generator.
 *
 * Uses the classic MEKA INFRA payslip DESIGN — centred logo, underlined company
 * address, official title, a bordered employee-info block, black-bordered tables
 * with grey headers, and a footer — while presenting the FULL CTC structure
 * (Component / % / Monthly / Annual, Gross Salary, Gratuity, Employer PF,
 * Total CTC, and the Take-Home particulars) exactly like the company Excel.
 *
 * Data comes from the /api/salary/me structure object
 * (see backend/utils/salaryStructure.js). We render real HTML/CSS off-screen and
 * rasterise it with html2canvas into an A4 jsPDF page.
 */

const A4_WIDTH_PX = 794 // A4 @96dpi

const COMPANY_NAME = 'MEKA INFRA'
const COMPANY_ADDRESS =
  '2nd, Madhuli Apartments, Dr, AB Nair Rd, Shiv Sagar Estate, Worli, Mumbai, Maharashtra 400018'

// Plain integer with Indian grouping; zero renders as a dash (like the sheet).
const num = (n) => {
  const v = Math.round(Number(n) || 0)
  return v === 0 ? '-' : v.toLocaleString('en-IN')
}
const dec = (n) =>
  (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const fmtDate = (v) => {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ---- HTML template ---------------------------------------------------------

const daysVal = (n) => {
  const v = Number(n) || 0
  // show whole numbers plainly, keep .5 for half-days
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '')
}

export function buildSalarySlipHTML(s = {}) {
  const withPF = !!s.pfEnabled
  const emp = s.employee || {}
  // Only show components that actually have a value (drops CCA/Conveyance/Education at 0).
  const earnings = (s.earnings || []).filter((r) => Number(r.monthly) > 0)
  const ds = s.daysSummary || null

  const availed = (ds && ds.availed) || {}
  const accrued = (ds && ds.accrued) || {}
  // Three groups side-by-side: Attendance | Leaves Availed | Leave Accrued.
  const groupRows = (rows) =>
    rows
      .map((r) => `<tr><td class="lbl">${r[0]}</td><td class="v">${daysVal(r[1])}</td></tr>`)
      .join('')
  const daysTable = ds
    ? `<table class="ps-ct ps-days3">
        <tr class="head">
          <th>Attendance &amp; Leave${ds.period ? ` — ${esc(ds.period)}` : ''}</th>
          <th>Leaves Availed</th>
          <th>Leave Accrued</th>
        </tr>
        <tr>
          <td class="grp"><table class="inner">${groupRows([
            ['Paid Days', ds.paidDays],
            ['Unpaid Days (LWP)', ds.unpaidDaysLWP],
          ])}</table></td>
          <td class="grp"><table class="inner">${groupRows([
            ['EL — Earned Leave', availed.el],
            ['CO — Compensatory Off', availed.co],
            ['NH — National Holiday', availed.nh],
          ])}</table></td>
          <td class="grp"><table class="inner">${groupRows([
            ['CO — Compensatory Off', accrued.co],
            ['EL — Earned Leave', accrued.el],
          ])}</table></td>
        </tr>
      </table>`
    : ''

  const infoCell = (label, val) =>
    `<td class="label">${esc(label)}</td><td class="value">: ${esc(val || '')}</td>`

  const compRow = (r) => `<tr>
      <td>${esc(r.label)}</td>
      <td class="amt">${num(r.monthly)}</td>
      <td class="amt">${num(r.annual)}</td>
    </tr>`

  return `<div class="ps-page">
    <div class="ps-logo"><img src="${getMekaLogo()}" alt="${esc(COMPANY_NAME)}"></div>
    <div class="ps-address">${esc(COMPANY_ADDRESS)}</div>
    <div class="ps-title">Salary Structure - ${esc(emp.name || 'Employee')}</div>

    <table class="ps-info">
      <tr>${infoCell('Employee Number', emp.employeeCode)}${infoCell('Date of Joining', fmtDate(emp.dateOfJoining))}</tr>
      <tr>${infoCell('Department', emp.department)}${infoCell('Designation', emp.designation)}</tr>
      <tr>${infoCell('Location', emp.location)}${infoCell('Income Tax Number (PAN)', emp.pan)}</tr>
      <tr>${infoCell('Annual CTC', dec(s.annualCTC))}${infoCell('Monthly CTC', num(s.monthlyCTC))}</tr>
      <tr>${infoCell('CTC Type', withPF ? 'With PF' : 'Without PF (with Gratuity)')}${infoCell('Gross / Month', num(s.grossMonthly))}</tr>
    </table>

    ${daysTable}

    <table class="ps-ct">
      <tr class="head"><th>Component</th><th class="r">Monthly (Rs.)</th><th class="r">Annual (Rs.)</th></tr>
      ${earnings.map(compRow).join('')}
      <tr class="sub">
        <td>Gross Salary</td>
        <td class="amt">${num(s.grossSalary?.monthly)}</td>
        <td class="amt">${num(s.grossSalary?.annual)}</td>
      </tr>
      <tr><td>Gratuity</td><td class="amt">${num(s.gratuity?.monthly)}</td><td class="amt">${num(s.gratuity?.annual)}</td></tr>
      <tr><td>Employer PF</td><td class="amt">${num(s.employerPF?.monthly)}</td><td class="amt">${num(s.employerPF?.annual)}</td></tr>
      <tr class="total">
        <td>Total CTC</td>
        <td class="amt">${num(s.totalCTCRow?.monthly)}</td>
        <td class="amt">${num(s.totalCTCRow?.annual)}</td>
      </tr>
    </table>

    <table class="ps-ct ps-net">
      <tr class="head"><th>Particulars</th><th class="r">Monthly (Rs.)</th><th class="r">Annual (Rs.)</th></tr>
      <tr><td>Gross Salary</td><td class="amt">${num(s.net?.grossSalary?.monthly)}</td><td class="amt">${num(s.net?.grossSalary?.annual)}</td></tr>
      <tr><td>Less: Employee PF</td>
        <td class="amt">${num(s.net?.employeePF?.monthly)}</td>
        <td class="amt">${num(s.net?.employeePF?.annual)}</td></tr>
      <tr><td>Less: Professional Tax</td>
        <td class="amt">${num(s.net?.professionalTax?.monthly)}</td>
        <td class="amt">${num(s.net?.professionalTax?.annual)}</td></tr>
      <tr class="sub"><td>Net Salary (Before TDS)</td>
        <td class="amt">${num(s.net?.netSalary?.monthly)}</td>
        <td class="amt">${num(s.net?.netSalary?.annual)}</td></tr>
      ${Number(s.tdsPerMonth) > 0 ? `<tr><td>Less: TDS (Income Tax)</td>
        <td class="amt">${num(s.net?.tds?.monthly)}</td>
        <td class="amt">${num(s.net?.tds?.annual)}</td></tr>` : ''}
      <tr class="total"><td>Take Home${Number(s.tdsPerMonth) > 0 ? ' (After TDS)' : ' (Before TDS)'}</td>
        <td class="amt">${num(s.takeHomeMonthly)}</td>
        <td class="amt">${num(s.net?.takeHome?.annual ?? s.net?.netSalary?.annual)}</td></tr>
    </table>

    <div class="ps-words">Take Home (in words) :<br>${esc(numberToWordsINR(s.takeHomeMonthly))} per month</div>
    <div class="ps-footer">This is a system-generated salary structure and does not require a signature.</div>
  </div>`
}

const SLIP_CSS = `
  .ps-page { width:${A4_WIDTH_PX}px; background:#fff; padding:22px 32px; box-sizing:border-box;
    font-family: Arial, Helvetica, sans-serif; color:#000; }
  .ps-page * { box-sizing:border-box; }
  .ps-logo { text-align:center; margin-bottom:2px; }
  .ps-logo img { width:150px; height:auto; }
  .ps-address { text-align:center; font-family:"Times New Roman",Times,serif; font-size:12.5px;
    text-decoration:underline; margin:2px 0 8px; }
  .ps-title { text-align:center; font-weight:bold; font-size:14px; margin-bottom:10px; }
  .ps-page table { border-collapse:collapse; width:100%; }

  .ps-info { margin-bottom:10px; }
  .ps-info td { border:1px solid #000; padding:4px 9px; font-size:11px; vertical-align:top; }
  .ps-info td.label { background:#e8e8e8; font-weight:bold; width:22%; }
  .ps-info td.value { width:28%; }

  .ps-ct { font-family:"Times New Roman",Times,serif; margin-bottom:10px; }
  .ps-ct th { border:1px solid #000; background:#e8e8e8; font-weight:bold; font-size:12px;
    padding:5px 9px; text-align:left; }
  .ps-ct th.r { text-align:right; }
  .ps-ct td { border:1px solid #000; font-size:12px; padding:4px 9px; }
  .ps-ct td.pct { text-align:right; width:15%; }
  .ps-ct td.amt { text-align:right; font-variant-numeric:tabular-nums; }
  .ps-ct td:first-child { width:42%; }
  .ps-ct tr.sub td { font-weight:bold; font-family:Arial,Helvetica,sans-serif; background:#f4f4f4; }
  .ps-ct tr.total td { font-weight:bold; font-family:Arial,Helvetica,sans-serif; background:#dfe6f0; }

  .ps-days3 { table-layout:fixed; }
  .ps-days3 > tbody > tr > th { width:33.33%; text-align:left; font-size:11.5px; padding:5px 8px; }
  .ps-days3 > tbody > tr > td.grp { padding:0; vertical-align:top; }
  .ps-days3 .inner { width:100%; border-collapse:collapse; }
  .ps-days3 .inner td { border:none; border-bottom:1px solid #d9d9d9; font-size:11px; padding:4px 8px;
    vertical-align:top; white-space:nowrap; }
  .ps-days3 .inner tr:last-child td { border-bottom:none; }
  .ps-days3 .inner td.lbl { overflow:hidden; text-overflow:ellipsis; }
  .ps-days3 .inner td.v { text-align:right; width:18%; font-weight:bold; font-family:Arial,Helvetica,sans-serif; font-variant-numeric:tabular-nums; }

  .ps-words { font-size:11.5px; margin-top:6px; line-height:1.4; font-weight:bold; }
  .ps-footer { text-align:center; font-family:"Times New Roman",Times,serif; font-size:11.5px;
    margin-top:16px; color:#333; }
`

// ---- PDF generation --------------------------------------------------------

/**
 * Render the salary slip off-screen and download it as an A4 PDF.
 * Returns the generated filename.
 */
export async function generateSalarySlipPdf(structure, opts = {}) {
  // The inline logo loads alongside the PDF libraries — see loadMekaLogo() in
  // payslipTemplate.js for why it is not a static import.
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
    loadMekaLogo(),
  ])

  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.width = `${A4_WIDTH_PX}px`
  host.style.background = '#fff'

  const style = document.createElement('style')
  style.textContent = SLIP_CSS
  host.appendChild(style)

  const wrap = document.createElement('div')
  wrap.innerHTML = buildSalarySlipHTML(structure)
  host.appendChild(wrap)
  document.body.appendChild(host)

  try {
    const pageEl = wrap.querySelector('.ps-page')
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    // Fit the ENTIRE slip on a single A4 page. Place at full width; if that
    // would exceed the page height, scale down uniformly (centred) so it still
    // fits one page. A small margin keeps it off the very edges.
    const margin = 6 // mm
    const maxH = pageH - margin * 2
    let drawW = pageW
    let drawH = (canvas.height / canvas.width) * drawW
    let scaled = false
    if (drawH > maxH) {
      drawH = maxH
      drawW = (canvas.width / canvas.height) * drawH
      scaled = true
    }
    const x = (pageW - drawW) / 2
    const y = scaled ? margin : 0

    if (opts.planOnly) {
      return {
        pageCount: 1,
        scaled,
        scalePct: Math.round((drawW / pageW) * 100),
        drawWmm: Math.round(drawW),
        drawHmm: Math.round(drawH),
      }
    }

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, drawW, drawH)

    const emp = structure?.employee || {}
    const base = `Salary_Slip_${emp.employeeCode || emp.name || 'employee'}`
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const fileName = `${base}.pdf`

    pdf.save(fileName)
    return fileName
  } finally {
    document.body.removeChild(host)
  }
}
