/**
 * MEKA Infrastructure letterhead template for all letter types
 * Based on official company letterhead design
 */

const formatOrdinalDate = (d) => {
  const day = d.getDate()
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const getRefNumber = (letterType) => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const typeMap = {
    'Experience Letter': 'EL',
    'Relieving Letter': 'RL',
    'Salary Certificate': 'SC',
    'Joining Letter': 'JL',
    'Promotion Letter': 'PL',
    'Appointment Letter': 'AL',
  }
  const abbrev = typeMap[letterType] || 'CL'
  return `Ref-MIPL-${abbrev}-${dd}${mm}${yyyy}`
}

export const getLetterheadHeader = (letterType) => {
  const date = formatOrdinalDate(new Date())
  const ref = getRefNumber(letterType)
  return `
    <div class="letterhead-header">
      <div class="letterhead-ref">${ref}</div>
      <div class="letterhead-logo">
        <div class="logo-shape"></div>
        <div class="logo-text">
          <span class="logo-meka">MEKA</span>
          <span class="logo-infra">INFRA</span>
        </div>
      </div>
      <div class="letterhead-date">${date}</div>
    </div>
  `
}

export const getLetterheadFooter = () => `
  <div class="letterhead-footer">
    <div class="footer-company">MEKA INFRASTRUCTURE PRIVATE LIMITED</div>
    <div class="footer-address">
      <div>Corporate Office: 20, Dr. Annie Bessant Road, Mumbai - 400 018, India, CIN D45203MH2008PTC182029</div>
      <div>Registered Office: 304, Shiv Chambers, 3rd Floor, 49, Dr. Annie Besant Road, Mumbai - 400 018, India.</div>
    </div>
    <div class="footer-contact">TEL: +91 22 - 40890000 &nbsp;|&nbsp; Email: mail@mekainfra.com &nbsp;|&nbsp; Website: https://www.meka.com</div>
  </div>
`

export const a4PageStyles = `
  @page { size: A4; margin: 20mm; }
  html, body { margin: 0; padding: 0; }
  body { background: #e5e7eb; padding: 16px 0; }
  .a4-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 20mm;
    box-sizing: border-box;
    background: #fff;
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
  }
  .letter-page { flex: 1; }
  @media print {
    body { background: #fff; padding: 0; }
    .a4-page { width: 100%; min-height: auto; margin: 0; padding: 0 20mm; box-shadow: none; }
  }
`

export const letterheadStyles = `
  .letterhead-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    border-bottom: 2px solid #1a5f9e;
    margin-bottom: 32px;
  }
  .letterhead-ref {
    font-size: 12px;
    color: #333;
    font-family: Arial, sans-serif;
  }
  .letterhead-logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .logo-shape {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%);
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  }
  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }
  .logo-meka {
    font-size: 22px;
    font-weight: 700;
    color: #1a5f9e;
    font-family: Arial, sans-serif;
  }
  .logo-infra {
    font-size: 12px;
    font-weight: 500;
    color: #38bdf8;
    font-family: Arial, sans-serif;
  }
  .letterhead-date {
    font-size: 12px;
    color: #333;
    font-family: Arial, sans-serif;
  }
  .letterhead-footer {
    margin-top: auto;
    padding-top: 24px;
    padding-bottom: 0;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 11px;
    color: #1a5f9e;
    font-family: Arial, sans-serif;
  }
  .footer-company {
    font-weight: 600;
    margin-bottom: 8px;
  }
  .footer-address {
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .footer-contact {
    margin-top: 4px;
  }
`

export const wrapWithLetterhead = (bodyContent, letterType) => {
  const header = getLetterheadHeader(letterType)
  const footer = getLetterheadFooter()
  return `<div class="a4-page"><div class="letter-page">${header}<div class="letter-body">${bodyContent}</div></div>${footer}</div>`
}
