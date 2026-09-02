// html2canvas + jsPDF are heavy and their bundled SVG/DOMPurify code trips
// ClamAV's SVGDynamicFunction false-positive. Load them lazily (only when a
// payslip is actually generated) so they split into a separate chunk and stay
// out of the main app bundle.

// The company logo is a ~155kB inline data URI, and it has to stay inline —
// html2canvas rasterises the off-screen node immediately, so a plain <img src>
// URL would race the network and land in the PDF blank.
//
// Imported statically it was pulled into every chunk that touches this module
// — Payroll, SalaryStructures and MySalary — making each of those pages
// download the logo just to render a table. Loading it on demand keeps the
// bytes with the action that needs them: the PDF download.
// The builders below stay synchronous (they are pure string templates), so the
// data URI is cached here and every generate*Pdf() awaits loadMekaLogo() before
// building its HTML.
let mekaLogoDataUri = ''

export async function loadMekaLogo() {
  if (!mekaLogoDataUri) {
    mekaLogoDataUri = (await import('./mekaLogo')).default
  }
  return mekaLogoDataUri
}

export const getMekaLogo = () => mekaLogoDataUri

/**
 * Payslip generator — produces a PDF that is a pixel-exact match of the
 * official MEKA INFRA payslip design (see the reference PDF).
 *
 * Approach: we render the real HTML/CSS design off-screen, rasterise it with
 * html2canvas, then place the image into an A4 jsPDF page. This is far more
 * faithful than hand-drawing coordinates in jsPDF (which cannot reproduce the
 * exact fonts, the embedded logo, or the table styling).
 */

const A4_WIDTH_PX = 794 // A4 @96dpi, matches the .page width in the template

// ---- helpers ---------------------------------------------------------------

export const formatCurrency = (amount) => {
  const n = Number(amount) || 0
  return `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Indian-style number-to-words for the "Amount (in words)" line.
// Handles the rupee (integer) part; paise are ignored to match the source.
export function numberToWordsINR(amount) {
  const num = Math.floor(Number(amount) || 0)
  if (num === 0) return 'Rupees Zero Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const twoDigits = (n) => {
    if (n < 20) return ones[n]
    const t = Math.floor(n / 10)
    const o = n % 10
    return tens[t] + (o ? '-' + ones[o].toLowerCase() : '')
  }

  const threeDigits = (n) => {
    const h = Math.floor(n / 100)
    const rest = n % 100
    let str = ''
    if (h) str += ones[h] + ' hundred'
    if (rest) str += (h ? ' ' : '') + twoDigits(rest)
    return str
  }

  // Indian grouping: crore, lakh, thousand, hundred
  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const hundred = num % 1000

  const parts = []
  if (crore) parts.push(threeDigits(crore) + ' crore')
  if (lakh) parts.push(threeDigits(lakh) + ' lakh')
  if (thousand) parts.push(threeDigits(thousand) + ' thousand')
  if (hundred) parts.push(threeDigits(hundred))

  // Lowercase everything, then capitalise only the very first letter — matches
  // the source payslip style: "Twenty-four thousand, eight hundred".
  let words = parts.join(', ').toLowerCase()
  words = words.charAt(0).toUpperCase() + words.slice(1)
  return `Rupees ${words} Only`
}

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// ---- data normalisation ----------------------------------------------------

/**
 * Map a payroll record (as used in the HR Payroll page) to the fields the
 * template needs. Falls back to sensible defaults so a partially-populated
 * record still renders the full layout.
 */
export function normalizePayslip(record = {}) {
  const earnings = record.earnings || [
    { label: 'Basic', amount: record.basic ?? 0 },
    { label: 'CCA', amount: record.cca ?? 0 },
    { label: 'Conveyance', amount: record.conveyance ?? 0 },
    { label: 'Education Allowance', amount: record.educationAllowance ?? 0 },
    { label: 'HRA', amount: record.hra ?? 0 },
    { label: 'Bonus', amount: record.bonus ?? 0 },
  ].filter((e) => e.amount != null)

  const deductions = record.deductions || [
    { label: 'Professional Tax', amount: record.profTax ?? 0 },
  ]

  const totalEarnings =
    record.totalEarnings != null
      ? Number(record.totalEarnings)
      : earnings.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const totalDeductions =
    record.totalDeductions != null
      ? Number(record.totalDeductions)
      : deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0)
  const netSalary =
    record.netSalary != null
      ? Number(record.netSalary)
      : record.finalSalary != null
      ? Number(record.finalSalary)
      : totalEarnings - totalDeductions

  const leaveBalances = record.leaveBalances || [
    { type: 'Compensatory Offs', balance: '0.00 day(s)' },
    { type: 'Leave without pay', balance: '0.00 day(s)' },
    { type: 'Earned Leave (30)', balance: '0.00 day(s)' },
  ]

  const companyName = record.companyName || record.company?.companyName || 'MEKA INFRA'
  const companyAddress =
    record.companyAddress ||
    record.company?.address ||
    '2nd, Madhuli Apartments, Dr, AB Nair Rd, Shiv Sagar Estate, Worli, Mumbai, Maharashtra 400018'

  return {
    companyName,
    companyAddress,
    // Line shown under the logo: the company's registered address.
    headerLine: companyAddress,
    month: record.month || record.payrollPeriod || '',
    employeeName: record.employeeName || record.user?.name || 'Employee',
    employeeCode: record.employeeCode || record.user?.employeeCode || '',
    pan: record.pan || record.user?.pan || '',
    department: record.department || record.user?.department || '',
    uan: record.uan || record.user?.uan || '',
    designation: record.designation || record.user?.designation || '',
    bankName: record.bankName || record.user?.bankName || '',
    location: record.location || record.user?.location || '',
    bankAccountNo: record.bankAccountNo || record.user?.bankAccountNo || '',
    dateOfJoining: record.dateOfJoining || record.user?.dateOfJoining || '',
    ifsc: record.ifsc || record.user?.ifsc || '',
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary,
    leaveBalances,
    amountInWords: record.amountInWords || numberToWordsINR(netSalary),
  }
}

// ---- HTML template ---------------------------------------------------------

export function buildPayslipHTML(record) {
  const d = normalizePayslip(record)

  const rowCount = Math.max(d.earnings.length, d.deductions.length)
  let edRows = ''
  for (let i = 0; i < rowCount; i++) {
    const e = d.earnings[i]
    const de = d.deductions[i]
    edRows += `<tr>
      <td>${e ? esc(e.label) : ''}</td>
      <td class="amt">${e ? formatCurrency(e.amount) : ''}</td>
      <td>${de ? esc(de.label) : ''}</td>
      <td class="amt">${de ? formatCurrency(de.amount) : ''}</td>
    </tr>`
  }

  const leaveRows = d.leaveBalances
    .map(
      (l) =>
        `<tr><td>${esc(l.type)}</td><td class="bal">${esc(l.balance)}</td></tr>`
    )
    .join('')

  const row = (label, val) =>
    `<td class="label">${esc(label)}</td><td class="value">: ${esc(val)}</td>`

  return `<div class="ps-page">
    <div class="ps-logo"><img src="${mekaLogoDataUri}" alt="${esc(d.companyName)}"></div>
    <div class="ps-address">${esc(d.headerLine)}</div>
    <div class="ps-title">Pay Slip for ${esc(d.month)} - ${esc(d.employeeName)}</div>

    <table class="ps-info">
      <tr>${row('Employee Number', d.employeeCode)}${row('Income Tax Number (PAN)', d.pan)}</tr>
      <tr>${row('Department', d.department)}${row('Universal Account Number (UAN)', d.uan)}</tr>
      <tr>${row('Designation', d.designation)}${row('Bank Name', d.bankName)}</tr>
      <tr>${row('Location', d.location)}${row('Bank Account No', d.bankAccountNo)}</tr>
      <tr>${row('Date of Joining', d.dateOfJoining)}${row('IFSC', d.ifsc)}</tr>
    </table>

    <table class="ps-leave">
      <tr><th>Leave Type</th><th>Leave Balance</th></tr>
      ${leaveRows}
    </table>

    <table class="ps-ed">
      <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
      ${edRows}
      <tr class="total">
        <td>Total Earnings</td><td class="amt">${formatCurrency(d.totalEarnings)}</td>
        <td>Total Deductions</td><td class="amt">${formatCurrency(d.totalDeductions)}</td>
      </tr>
      <tr class="total">
        <td>Total Salary</td><td class="amt"></td><td></td><td class="amt">${formatCurrency(d.netSalary)}</td>
      </tr>
    </table>

    <div class="ps-words">Amount (in words) :<br>${esc(d.amountInWords)}</div>
    <div class="ps-footer">This is a system-generated payslip and does not require a signature.</div>
  </div>`
}

const PAYSLIP_CSS = `
  .ps-page { width: ${A4_WIDTH_PX}px; background:#fff; padding:40px 42px; box-sizing:border-box;
    font-family: Arial, Helvetica, sans-serif; color:#000; }
  .ps-page * { box-sizing:border-box; }
  .ps-logo { text-align:center; margin-bottom:6px; }
  .ps-logo img { width:190px; height:auto; }
  .ps-address { text-align:center; font-family:"Times New Roman",Times,serif; font-size:16px;
    text-decoration:underline; margin:4px 0 22px; }
  .ps-title { text-align:center; font-weight:bold; font-size:15px; margin-bottom:22px; }
  .ps-page table { border-collapse:collapse; width:100%; }
  .ps-info { margin-bottom:26px; }
  .ps-info td { border:1px solid #000; padding:9px 10px; font-size:13px; vertical-align:top; }
  .ps-info td.label { background:#e8e8e8; font-weight:bold; width:20%; }
  .ps-info td.value { width:30%; }
  .ps-leave { margin-bottom:26px; font-family:"Times New Roman",Times,serif; }
  .ps-leave th { border:1px solid #000; background:#e8e8e8; font-weight:bold; font-size:18px;
    text-align:center; padding:12px; }
  .ps-leave td { border:1px solid #000; font-size:16px; padding:12px 14px; width:50%; }
  .ps-leave td.bal { text-align:center; }
  .ps-ed { font-family:"Times New Roman",Times,serif; }
  .ps-ed th { border:1px solid #000; background:#e8e8e8; font-weight:bold; font-size:15px;
    text-align:center; padding:9px; }
  .ps-ed td { border:1px solid #000; font-size:14px; padding:8px 10px; width:25%; }
  .ps-ed td.amt { text-align:right; }
  .ps-ed tr.total td { font-weight:bold; font-family:Arial,Helvetica,sans-serif; }
  .ps-words { font-size:13px; margin-top:12px; line-height:1.5; }
  .ps-footer { text-align:center; font-family:"Times New Roman",Times,serif; font-size:14px; margin-top:46px; }
`

// ---- PDF generation --------------------------------------------------------

/**
 * Render the payslip design off-screen and download it as an A4 PDF.
 * Returns the generated filename.
 */
export async function generatePayslipPdf(record) {
  const d = normalizePayslip(record)

  // Lazy-load the PDF libraries and the inline logo (see notes at top of file).
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
    loadMekaLogo(),
  ])

  // Off-screen host (kept in the DOM so fonts/images lay out, but not visible).
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.width = `${A4_WIDTH_PX}px`
  host.style.background = '#fff'

  const style = document.createElement('style')
  style.textContent = PAYSLIP_CSS
  host.appendChild(style)

  const wrap = document.createElement('div')
  wrap.innerHTML = buildPayslipHTML(record)
  host.appendChild(wrap)
  document.body.appendChild(host)

  try {
    const pageEl = wrap.querySelector('.ps-page')
    const canvas = await html2canvas(pageEl, {
      scale: 2, // crisp text
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW = pageW
    const imgH = (canvas.height / canvas.width) * imgW

    const imgData = canvas.toDataURL('image/png')
    // If content is taller than one A4 page, slice it across pages.
    if (imgH <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH)
    } else {
      let remaining = imgH
      let position = 0
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
        remaining -= pageH
        if (remaining > 0) {
          pdf.addPage()
          position -= pageH
        }
      }
    }

    const fileName = `Payslip_${d.employeeCode || d.employeeName}_${d.month}.pdf`
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()

    pdf.save(fileName)
    return fileName
  } finally {
    document.body.removeChild(host)
  }
}
