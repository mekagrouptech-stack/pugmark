const nodemailer = require('nodemailer')
const logger = require('./logger')

/**
 * Simple email sender utility using Nodemailer.
 * If SMTP env variables are not configured, it logs the email to console instead.
 */

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM,
} = process.env

let transporter = null

if (SMTP_USER && SMTP_PASSWORD) {
  // Always build from the explicit SMTP_HOST/PORT so the values in .env are
  // actually used. (The old `service: 'gmail'` shortcut ignored SMTP_PORT and
  // forced port 465, which many cPanel/shared hosts block — even when the host
  // allows 587. Honoring the configured port lets 587/STARTTLS work.)
  const port = SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587
  const transportConfig = {
    host: SMTP_HOST || 'smtp.gmail.com',
    port,
    // 465 = implicit TLS; 587/25 = STARTTLS. Respect SMTP_SECURE if set.
    secure: SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465,
    requireTLS: port === 587, // enforce STARTTLS upgrade on 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD.replace(/\s/g, ''), // Remove spaces from app password
    },
  }

  transporter = nodemailer.createTransport(transportConfig)

  transporter.verify((error) => {
    if (error) {
      logger.error('Email transporter verification failed:', error.message)
    } else {
      logger.info('📧 Email transporter is ready to send emails')
    }
  })
} else {
  logger.warn('SMTP configuration not found. Emails will be logged to console instead of being sent.')
}

/**
 * Send email
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 * @returns {Promise<{sent: boolean, resetUrl?: string}>} - When SMTP not configured, returns resetUrl if present in html
 */
async function sendEmail({ to, subject, text, html, attachments }) {
  if (!to || !subject) {
    throw new Error('Email "to" and "subject" are required')
  }

  const from = SMTP_FROM || SMTP_USER || 'no-reply@hrms.local'

  // If transporter not configured, log and extract reset URL for dev mode
  if (!transporter) {
    logger.info('📧 [DEV MODE] Email not sent (SMTP not configured). Logging instead:', {
      to,
      subject,
    })
    console.log('---- EMAIL BEGIN ----')
    console.log('To:', to)
    console.log('Subject:', subject)
    if (text) console.log('Text:\n', text)
    if (html) console.log('HTML:\n', html)
    console.log('---- EMAIL END ----')
    // Extract reset URL from html for dev mode (pattern: href="...reset-password?token=...")
    const resetUrlMatch = html && html.match(/href="([^"]*reset-password\?token=[^"]+)"/)
    return { sent: false, resetUrl: resetUrlMatch ? resetUrlMatch[1] : null }
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    ...(attachments && attachments.length ? { attachments } : {}),
  })
  return { sent: true }
}

module.exports = {
  sendEmail,
}

