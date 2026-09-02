const crypto = require('crypto')
const { sendEmail } = require('./emailSender')

/**
 * Login-credentials email.
 *
 * Used both when an employee is first created and when an admin re-sends the
 * credentials later from User Management. Stored passwords are hashed, so a
 * re-send always carries a NEWLY generated password — the original plaintext
 * cannot be recovered.
 */

// Password that satisfies the usual "upper + lower + digit + symbol" rules and
// is still easy to retype from an email.
function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '@#$%&*'
  const all = upper + lower + digits + symbols

  const pick = (set) => set[crypto.randomInt(0, set.length)]
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)]
  while (chars.length < 10) chars.push(pick(all))

  // Fisher-Yates so the guaranteed characters are not always in front
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/**
 * Send the login credentials to an employee.
 *
 * @param {Object} options
 * @param {Object} options.user            - User instance (name, email, employeeCode)
 * @param {string} options.password        - Plaintext password to include
 * @param {boolean} [options.isReissue]    - true when re-sent from User Management
 * @returns {Promise<{sent: boolean}>}
 */
async function sendCredentialsEmail({ user, password, isReissue = false }) {
  // Always point the credentials email at the public site, not the local dev
  // URL (FRONTEND_BASE_URL is localhost during development). Override with
  // PUBLIC_APP_URL if the public domain ever changes.
  const loginUrl = process.env.PUBLIC_APP_URL || 'https://pugmarkhr.com'

  const subject = isReissue
    ? 'Your Pugmark HRMS login credentials'
    : 'Your Pugmark HRMS account has been created'

  const heading = isReissue ? 'Your Pugmark HRMS login details' : 'Welcome to Pugmark HRMS'

  const intro = isReissue
    ? 'Here are your current HRMS login details. Your password has been reset to the one below:'
    : 'An HRMS account has been created for you. Use the credentials below to log in:'

  const introText = isReissue
    ? 'Here are your current HRMS login details. Your password has been reset to the one below:'
    : 'An HRMS account has been created for you. You can log in with the details below:'

  return sendEmail({
    to: user.email,
    subject,
    text:
      `Hi ${user.name},\n\n` +
      `${introText}\n\n` +
      `Login URL: ${loginUrl}\n` +
      `Email: ${user.email}\n` +
      `Password: ${password}\n` +
      `Employee Code: ${user.employeeCode}\n\n` +
      `For your security, please change your password after you log in.\n\n` +
      `— Pugmark HRMS`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
        <h2 style="color:#4338ca;margin:0 0 8px">${heading}</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>${intro}</p>
        <table style="border-collapse:collapse;margin:16px 0;width:100%">
          <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;width:150px">Login URL</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0"><a href="${loginUrl}" style="color:#4338ca">${loginUrl}</a></td></tr>
          <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600">Email</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0">${user.email}</td></tr>
          <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600">Password</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0"><code style="font-size:14px">${password}</code></td></tr>
          <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600">Employee Code</td>
              <td style="padding:8px 12px;border:1px solid #e2e8f0">${user.employeeCode}</td></tr>
        </table>
        <p style="color:#b45309;font-size:13px">For your security, please change your password after you log in.</p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">— Pugmark HRMS</p>
      </div>
    `,
  })
}

module.exports = {
  sendCredentialsEmail,
  generatePassword,
}
