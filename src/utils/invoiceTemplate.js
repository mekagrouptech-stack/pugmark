/**
 * Invoice Employee — invoice document generator.
 *
 * Reproduces the paper invoice these workers submit: their name and address as
 * the letterhead, the company as the bill-to party, a bordered table with the
 * base-charges line and the overtime line, the total in words, and their bank
 * details beside a signature block.
 *
 * Like the salary slip (see salarySlipTemplate.js) the page is rendered as real
 * HTML off-screen and rasterised with html2canvas onto a single A4 jsPDF page.
 */

const A4_WIDTH_PX = 794 // A4 @96dpi

// Fallback bill-to party, used for invoices raised before a company could be
// chosen on the form. Those rows carry no company_id, and reprinting one must
// still produce the document that was originally issued.
const DEFAULT_BILL_TO = {
  name: 'MEKA INFRA LLC',
  addressLines: [
    'Office No -209, Floor No -2, Regus Business Centre No-67,',
    'D Ring Road, Doha ,Qatar',
  ],
  registration: 'Commercial Registration No : QFC No 0209',
}

/**
 * The bill-to block: the company picked on the invoice form, falling back to
 * the historical hardcoded block when the invoice has no company.
 *
 * The address is assembled from the parts the companies table stores
 * separately, and blank parts are dropped rather than printed as stray commas.
 */
const resolveBillTo = (inv) => {
  if (!inv.companyName) return DEFAULT_BILL_TO

  const cityLine = [inv.companyCity, inv.companyState, inv.companyPostalCode]
    .filter(Boolean)
    .join(', ')

  return {
    name: inv.companyName.toUpperCase(),
    addressLines: [inv.companyAddress, cityLine, inv.companyCountry].filter(Boolean),
    registration: inv.companyRegistrationNumber
      ? `Commercial Registration No : ${inv.companyRegistrationNumber}`
      : '',
  }
}

const CURRENCY_WORDS = {
  QAR: 'Qatar Riyal',
  INR: 'Indian Rupees',
  USD: 'US Dollars',
  AED: 'UAE Dirham',
}

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// Two decimals, thousands-separated — the format used on the paper invoice.
const dec = (n) =>
  (Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

// Plain number: whole values print without decimals (work days "31",
// overtime rate "8.33").
const plain = (n) => {
  const v = Number(n) || 0
  if (!v) return ''
  return Number.isInteger(v) ? String(v) : String(v)
}

const fmtDate = (v) => {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

/**
 * Amount in words on the international scale (thousand / million), which is
 * what these invoices use — "Three Thousand Five Hundred Qatar Riyal".
 * Deliberately NOT the Indian lakh/crore grouping of numberToWordsINR.
 */
export function numberToWordsIntl(amount, currency = 'QAR') {
  const num = Math.floor(Number(amount) || 0)
  const unit = CURRENCY_WORDS[currency] || currency

  if (num === 0) return `Zero ${unit}`

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
    return tens[t] + (o ? ' ' + ones[o] : '')
  }

  const threeDigits = (n) => {
    const h = Math.floor(n / 100)
    const rest = n % 100
    let str = ''
    if (h) str += ones[h] + ' Hundred'
    if (rest) str += (h ? ' ' : '') + twoDigits(rest)
    return str
  }

  const scales = [
    { value: 1000000000, label: 'Billion' },
    { value: 1000000, label: 'Million' },
    { value: 1000, label: 'Thousand' },
  ]

  let remaining = num
  const parts = []
  scales.forEach(({ value, label }) => {
    const count = Math.floor(remaining / value)
    if (count) {
      parts.push(`${threeDigits(count)} ${label}`)
      remaining %= value
    }
  })
  if (remaining) parts.push(threeDigits(remaining))

  return `${parts.join(' ')}  ${unit}`
}

const INVOICE_CSS = `
.inv-page {
  width: ${A4_WIDTH_PX}px;
  box-sizing: border-box;
  padding: 38px 46px;
  background: #fff;
  color: #000;
  font-family: "Times New Roman", Times, serif;
  font-size: 13px;
  line-height: 1.45;
}
.inv-letterhead { text-align: center; margin-bottom: 18px; }
.inv-name { font-size: 17px; font-weight: bold; letter-spacing: .4px; text-transform: uppercase; }
.inv-addr { font-size: 11px; margin-top: 2px; }
.inv-billto { margin-bottom: 4px; }
.inv-billto .co { font-weight: bold; }
.inv-title { text-align: center; font-weight: bold; font-size: 15px; letter-spacing: .5px; margin: 14px 0 10px; }
.inv-meta { display: flex; justify-content: flex-end; gap: 40px; font-size: 12px; margin-bottom: 8px; }
.inv-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
.inv-table th, .inv-table td { border: 1px solid #000; padding: 7px 8px; vertical-align: top; }
.inv-table th { font-weight: bold; text-align: center; font-size: 12px; }
.inv-table td.num { text-align: right; white-space: nowrap; }
.inv-table td.mid { text-align: center; white-space: nowrap; }
.inv-table td.sr { text-align: center; width: 42px; }
.inv-particulars { font-size: 12px; }
.inv-total td { font-weight: bold; }
.inv-words { margin-top: 12px; font-size: 12.5px; }
.inv-foot { display: flex; justify-content: space-between; margin-top: 26px; gap: 24px; }
.inv-bank { font-size: 12px; }
.inv-bank div { margin-bottom: 2px; }
.inv-bank .lbl { display: inline-block; min-width: 108px; }
.inv-sign { text-align: left; font-size: 12px; min-width: 210px; }
.inv-sign .line { margin-top: 54px; }
`

export function buildInvoiceHTML(inv = {}) {
  const currency = inv.currency || 'QAR'
  const monthLabel = MONTH_NAMES[(Number(inv.month) || 1) - 1] || ''
  const title = `INVOICE - ${monthLabel} ${inv.year || ''}`.trim()

  const addressLines = String(inv.address || '')
    .split(/\r?\n|,\s*/)
    .map((l) => l.trim())
    .filter(Boolean)

  const billTo = resolveBillTo(inv)

  // Line 1 falls back to a sentence built from the work type and period when no
  // particulars text was entered, so the invoice is never blank there.
  const particulars =
    inv.particulars ||
    [
      inv.workType,
      inv.periodFrom && inv.periodTo
        ? `for the period from ${fmtDate(inv.periodFrom)} to ${fmtDate(inv.periodTo)} as per Attendance Sheet is Attached`
        : '',
      inv.vehicleNo ? `Vehicle No- ${inv.vehicleNo}` : '',
    ]
      .filter(Boolean)
      .join(' ')

  const hasOvertime = Number(inv.overtimeAmount) > 0 || Number(inv.overtimeHours) > 0

  const rows = [
    `<tr>
      <td class="sr">1</td>
      <td class="inv-particulars">${esc(particulars)}</td>
      <td class="mid">${esc(plain(inv.monthlyGross))}</td>
      <td class="mid">${esc(plain(inv.workDays))}</td>
      <td class="num">${dec(inv.baseAmount)}</td>
    </tr>`,
  ]
  if (hasOvertime) {
    rows.push(`<tr>
      <td class="sr">2</td>
      <td class="inv-particulars">Overtime</td>
      <td class="mid">${esc(plain(inv.overtimeRate))}</td>
      <td class="mid">${esc(plain(inv.overtimeHours))}</td>
      <td class="num">${dec(inv.overtimeAmount)}</td>
    </tr>`)
  }

  return `
<div class="inv-page">
  <div class="inv-letterhead">
    <div class="inv-name">${esc(inv.employee || '')}</div>
    ${addressLines.length ? `<div class="inv-addr">${esc(addressLines.join(', '))}</div>` : ''}
  </div>

  <div class="inv-billto">
    <div class="co">${esc(billTo.name)}</div>
    ${billTo.addressLines.map((l) => `<div>${esc(l)}</div>`).join('')}
    ${billTo.registration ? `<div>${esc(billTo.registration)}</div>` : ''}
  </div>

  <div class="inv-title">${esc(title)}</div>

  <div class="inv-meta">
    <div>Invoice No.: ${esc(inv.invoiceNumber || '')}</div>
    <div>Date : ${esc(fmtDate(inv.invoiceDate))}</div>
  </div>

  <table class="inv-table">
    <thead>
      <tr>
        <th>Sr. No.</th>
        <th>Particulars</th>
        <th>MONTHLY<br/>GROSS</th>
        <th>WORK DAY</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('')}
      <tr class="inv-total">
        <td class="sr"></td>
        <td style="text-align:center">Total</td>
        <td class="mid"></td>
        <td class="mid"></td>
        <td class="num">${dec(inv.totalAmount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="inv-words">${esc(numberToWordsIntl(inv.totalAmount, currency))}</div>

  <div class="inv-foot">
    <div class="inv-bank">
      <div><span class="lbl">Bank Shift Code</span>: ${esc(inv.bankSwift || '')}</div>
      <div><span class="lbl">Bank Name</span>: ${esc(inv.bankName || '')}</div>
      <div><span class="lbl">Bank A/C No</span>: ${esc(inv.accountNo || '')}</div>
      <div><span class="lbl">IBAN No</span>: ${esc(inv.iban || '')}</div>
    </div>
    <div class="inv-sign">
      <div>Signature :</div>
      <div class="line">Name : ${esc(inv.employee || '')}</div>
    </div>
  </div>
</div>`
}

export async function generateInvoicePdf(invoice, opts = {}) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.width = `${A4_WIDTH_PX}px`
  host.style.background = '#fff'

  const style = document.createElement('style')
  style.textContent = INVOICE_CSS
  host.appendChild(style)

  const wrap = document.createElement('div')
  wrap.innerHTML = buildInvoiceHTML(invoice)
  host.appendChild(wrap)
  document.body.appendChild(host)

  try {
    const pageEl = wrap.querySelector('.inv-page')
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    // Fit the whole invoice on one A4 page, scaling down uniformly if the
    // particulars text has made it taller than the page.
    const margin = 6
    const maxH = pageH - margin * 2
    let drawW = pageW
    let drawH = (canvas.height / canvas.width) * drawW
    let x = 0
    let y = 0
    if (drawH > maxH) {
      drawH = maxH
      drawW = (canvas.width / canvas.height) * drawH
      x = (pageW - drawW) / 2
      y = margin
    }

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, drawW, drawH)

    const safeNumber = String(invoice?.invoiceNumber || 'invoice').replace(/[^\w.-]+/g, '-')
    const safeName = String(invoice?.employee || '').replace(/[^\w.-]+/g, '-')
    const fileName = opts.fileName || `Invoice-${safeName}-${safeNumber}.pdf`
    pdf.save(fileName)
  } finally {
    document.body.removeChild(host)
  }
}
