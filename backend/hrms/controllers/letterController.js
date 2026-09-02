const { sendEmail } = require('../utils/emailSender')
const logger = require('../utils/logger')

const COMPANY_NAME = 'MEKA INFRASTRUCTURE PRIVATE LIMITED'

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

const getLetterhead = (letterType) => {
  const date = formatOrdinalDate(new Date())
  const ref = getRefNumber(letterType)
  return {
    header: `
      <div class="letterhead-header">
        <div class="letterhead-ref">${ref}</div>
        <div class="letterhead-logo">
          <div class="logo-shape"></div>
          <div class="logo-text"><span class="logo-meka">MEKA</span><span class="logo-infra">INFRA</span></div>
        </div>
        <div class="letterhead-date">${date}</div>
      </div>
    `,
    footer: `
      <div class="letterhead-footer">
        <div class="footer-company">MEKA INFRASTRUCTURE PRIVATE LIMITED</div>
        <div class="footer-address">
          <div>Corporate Office: 20, Dr. Annie Bessant Road, Mumbai - 400 018, India, CIN D45203MH2008PTC182029</div>
          <div>Registered Office: 304, Shiv Chambers, 3rd Floor, 49, Dr. Annie Besant Road, Mumbai - 400 018, India.</div>
        </div>
        <div class="footer-contact">TEL: +91 22 - 40890000 | Email: mail@mekainfra.com | Website: https://www.meka.com</div>
      </div>
    `,
    styles: `
      @page{size:A4;margin:20mm;}
      html,body{margin:0;padding:0;}
      .a4-page{width:210mm;min-height:297mm;margin:0 auto;padding:20mm;box-sizing:border-box;background:#fff;font-family:Arial,sans-serif;line-height:1.6;color:#333;display:flex;flex-direction:column;}
      .letter-page{flex:1;}
      @media print{.a4-page{width:100%;min-height:auto;margin:0;padding:0;box-shadow:none;}body{background:#fff;}}
      .letterhead-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1a5f9e;margin-bottom:32px;}
      .letterhead-ref{font-size:12px;color:#333;}
      .letterhead-logo{display:flex;align-items:center;gap:8px;}
      .logo-shape{width:24px;height:24px;background:linear-gradient(135deg,#7dd3fc 0%,#0ea5e9 100%);clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);}
      .logo-text{display:flex;flex-direction:column;line-height:1.1;}
      .logo-meka{font-size:22px;font-weight:700;color:#1a5f9e;}
      .logo-infra{font-size:12px;font-weight:500;color:#38bdf8;}
      .letterhead-date{font-size:12px;color:#333;}
      .letterhead-footer{margin-top:auto;padding-top:24px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#1a5f9e;}
      .footer-company{font-weight:600;margin-bottom:8px;}
      .footer-address{margin-bottom:6px;line-height:1.4;}
      .footer-contact{margin-top:4px;}
      .letter-body h2{text-align:center;color:#1a5f9e;margin-bottom:20px;}
    `,
  }
}

const getLetterTemplates = (employee) => {
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  return {
    'Experience Letter': {
      subject: `Experience Letter - ${employee}`,
      html: `
        <h2>EXPERIENCE LETTER</h2>
        <p>Date: ${date}</p>
        <p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${employee}</strong> was employed with ${COMPANY_NAME} from [Date of Joining] to [Date of Relieving].</p>
        <p>During the tenure, ${employee} worked as [Designation] in the [Department] department and performed duties with dedication and professionalism.</p>
        <p>We wish ${employee} success in all future endeavors.</p>
        <p>Yours sincerely,<br/>HR Department<br/>${COMPANY_NAME}</p>
      `,
      text: `EXPERIENCE LETTER\nDate: ${date}\n\nTo Whom It May Concern,\n\nThis is to certify that ${employee} was employed with ${COMPANY_NAME} from [Date of Joining] to [Date of Relieving]. During the tenure, ${employee} worked as [Designation] in the [Department] department and performed duties with dedication and professionalism. We wish ${employee} success in all future endeavors.\n\nYours sincerely,\nHR Department\n${COMPANY_NAME}`,
    },
    'Relieving Letter': {
      subject: `Relieving Letter - ${employee}`,
      html: `
        <h2>RELIEVING LETTER</h2>
        <p>Date: ${date}</p>
        <p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${employee}</strong> has been relieved from the services of ${COMPANY_NAME} with effect from [Date].</p>
        <p>All dues have been cleared and no claims are pending against the company.</p>
        <p>We wish ${employee} success in future endeavors.</p>
        <p>Yours sincerely,<br/>HR Department<br/>${COMPANY_NAME}</p>
      `,
      text: `RELIEVING LETTER\nDate: ${date}\n\nTo Whom It May Concern,\n\nThis is to certify that ${employee} has been relieved from the services of ${COMPANY_NAME} with effect from [Date]. All dues have been cleared and no claims are pending against the company. We wish ${employee} success in future endeavors.\n\nYours sincerely,\nHR Department\n${COMPANY_NAME}`,
    },
    'Salary Certificate': {
      subject: `Salary Certificate - ${employee}`,
      html: `
        <h2>SALARY CERTIFICATE</h2>
        <p>Date: ${date}</p>
        <p>To Whom It May Concern,</p>
        <p>This is to certify that <strong>${employee}</strong> is employed with ${COMPANY_NAME} as [Designation].</p>
        <p>The gross monthly salary is Rs. [Amount] and the annual CTC is Rs. [Amount].</p>
        <p>This certificate is issued for [Purpose].</p>
        <p>Yours sincerely,<br/>HR Department<br/>${COMPANY_NAME}</p>
      `,
      text: `SALARY CERTIFICATE\nDate: ${date}\n\nTo Whom It May Concern,\n\nThis is to certify that ${employee} is employed with ${COMPANY_NAME} as [Designation]. The gross monthly salary is Rs. [Amount] and the annual CTC is Rs. [Amount]. This certificate is issued for [Purpose].\n\nYours sincerely,\nHR Department\n${COMPANY_NAME}`,
    },
    'Joining Letter': {
      subject: `Joining Letter - ${employee}`,
      html: `
        <h2>JOINING LETTER</h2>
        <p>Date: ${date}</p>
        <p>Dear ${employee},</p>
        <p>We are pleased to confirm your appointment with ${COMPANY_NAME} as [Designation] in the [Department] department with effect from [Date of Joining].</p>
        <p>Please report to [Location] on the joining date.</p>
        <p>Yours sincerely,<br/>HR Department<br/>${COMPANY_NAME}</p>
      `,
      text: `JOINING LETTER\nDate: ${date}\n\nDear ${employee},\n\nWe are pleased to confirm your appointment with ${COMPANY_NAME} as [Designation] in the [Department] department with effect from [Date of Joining]. Please report to [Location] on the joining date.\n\nYours sincerely,\nHR Department\n${COMPANY_NAME}`,
    },
    'Promotion Letter': {
      subject: `Promotion Letter - ${employee}`,
      html: `
        <h2>PROMOTION LETTER</h2>
        <p>Date: ${date}</p>
        <p>Dear ${employee},</p>
        <p>We are pleased to inform you of your promotion to [New Designation] in the [Department] department with effect from [Date].</p>
        <p>Congratulations on this achievement. We look forward to your continued contribution.</p>
        <p>Yours sincerely,<br/>HR Department<br/>${COMPANY_NAME}</p>
      `,
      text: `PROMOTION LETTER\nDate: ${date}\n\nDear ${employee},\n\nWe are pleased to inform you of your promotion to [New Designation] in the [Department] department with effect from [Date]. Congratulations on this achievement. We look forward to your continued contribution.\n\nYours sincerely,\nHR Department\n${COMPANY_NAME}`,
    },
    'Appointment Letter': {
      subject: `Appointment Letter - ${employee}`,
      html: `
        <h2>APPOINTMENT LETTER</h2>
        <p>Date: ${date}</p>
        <p>Dear ${employee},</p>
        <p>We are pleased to offer you the position of [Designation] at ${COMPANY_NAME} in the [Department] department.</p>
        <p>Your date of joining will be [Date]. Please refer to the attached terms and conditions.</p>
        <p>Yours sincerely,<br/>HR Department<br/>${COMPANY_NAME}</p>
      `,
      text: `APPOINTMENT LETTER\nDate: ${date}\n\nDear ${employee},\n\nWe are pleased to offer you the position of [Designation] at ${COMPANY_NAME} in the [Department] department. Your date of joining will be [Date]. Please refer to the attached terms and conditions.\n\nYours sincerely,\nHR Department\n${COMPANY_NAME}`,
    },
  }
}

/**
 * Send letter via email
 * POST /api/letters/send-email
 */
async function sendLetterEmail(req, res, next) {
  try {
    const { to, employee, letterType } = req.body

    if (!to || !employee || !letterType) {
      return res.status(400).json({
        success: false,
        message: 'Email (to), employee name, and letter type are required',
      })
    }

    const templates = getLetterTemplates(employee)
    const template = templates[letterType]

    if (!template) {
      return res.status(400).json({
        success: false,
        message: `Unknown letter type: ${letterType}`,
      })
    }

    const letterhead = getLetterhead(letterType)
    const bodyWithLetterhead = `<div class="a4-page"><div class="letter-page">${letterhead.header}<div class="letter-body">${template.html}</div></div>${letterhead.footer}</div>`
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${letterhead.styles}</style></head><body>${bodyWithLetterhead}</body></html>`

    await sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html,
    })

    logger.info('Letter email sent', { to, letterType, employee })

    res.status(200).json({
      success: true,
      message: 'Letter sent successfully via email',
    })
  } catch (error) {
    logger.error('Error sending letter email:', error)
    next(error)
  }
}

module.exports = {
  sendLetterEmail,
}
