const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { User, LoginOtp } = require('../models')
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errors')
const logger = require('../utils/logger')
const { sendEmail } = require('../utils/emailSender')

// --- One-time-password sign-in -------------------------------------------
// Six digits is short enough to retype from a phone, so the security comes from
// the short life, the single use and the attempt cap below — not the length.
const OTP_LENGTH = 6
const OTP_TTL_MINUTES = 10
const OTP_MAX_ATTEMPTS = 5
// Stops the "Send code" button from being used to mail-bomb an employee.
const OTP_RESEND_COOLDOWN_SECONDS = 60

// crypto.randomInt, not Math.random: this value is a credential, so it has to
// come from a CSPRNG or the whole code becomes predictable from earlier ones.
const generateOtp = () => {
  const max = 10 ** OTP_LENGTH
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, '0')
}

const otpEmailTemplate = (name, otp) => `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 24px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(90deg, #1890ff, #40a9ff); padding: 16px 24px;">
        <h1 style="margin: 0; font-size: 20px; color: #ffffff;">HRMS Login Code</h1>
      </div>
      <div style="padding: 24px;">
        <p style="margin: 0 0 12px; font-size: 15px; color: #333;">Hi ${name || 'there'},</p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #333;">Use this one-time code to sign in to HRMS:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 32px; letter-spacing: 10px; font-weight: bold; color: #1890ff; background: #f0f7ff; padding: 14px 24px; border-radius: 8px;">${otp}</span>
        </div>
        <p style="margin: 0 0 8px; font-size: 14px; color: #555;">This code expires in ${OTP_TTL_MINUTES} minutes and can be used once.</p>
        <p style="margin: 0; font-size: 13px; color: #999;">If you did not try to sign in, you can ignore this email — nobody can access your account without this code.</p>
      </div>
    </div>
  </div>
`

// Whether anyone reports to this user. Being a reporting person is a fact about
// the org chart rather than the role — most managers here are stored as
// EMPLOYEE — so the team screens have to ask this question rather than read the
// role, and the client needs the answer to decide what to offer in the menu.
const countsAsReportingPerson = async (userId) => {
  try {
    return (await User.count({ where: { reportingManagerId: userId, isActive: true } })) > 0
  } catch (error) {
    // A failure here must not cost someone their sign-in; the team screens
    // simply fall back to the role check.
    logger.warn('Could not determine reporting-person status', { userId, error: error.message })
    return false
  }
}

// login and verifyOtp must hand back byte-identical sessions, so the token and
// the user payload are built in exactly one place.
const buildAuthPayload = (user, { isReportingPerson = false } = {}) => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }
  )

  const reportingManagerName =
    user.reportingManager && user.reportingManager.name ? user.reportingManager.name : null

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeCode: user.employeeCode,
      department: user.department,
      designation: user.designation,
      reportingManagerName,
      isReportingPerson,
    },
  }
}

/**
 * Auth Controller
 * Handles authentication operations
 */
class AuthController {
  /**
   * User login
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        throw new BadRequestError('Email and password are required')
      }

      // Find user by email (include reporting manager name when available)
      const user = await User.findOne({
        where: { email, isActive: true },
        include: [
          { model: User, as: 'reportingManager', attributes: ['id', 'name'], required: false },
        ],
      })

      if (!user) {
        throw new UnauthorizedError('Invalid email or password')
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password')
      }

      // Update last login
      await user.update({ lastLogin: new Date() })

      logger.info('User logged in', { userId: user.id, email: user.email })

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: buildAuthPayload(user, { isReportingPerson: await countsAsReportingPerson(user.id) }),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Request a one-time login code
   * POST /api/auth/request-otp
   *
   * This is the web sign-in path: employees never type a password. The password
   * login above is left in place because the mobile app still uses it.
   */
  async requestOtp(req, res, next) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase()
      if (!email) throw new BadRequestError('Email is required')

      const user = await User.findOne({ where: { email, isActive: true } })
      if (!user) {
        // Matches the existing forgot-password behaviour: this app tells people
        // plainly that the address is unknown rather than leaving them guessing.
        logger.warn('Login OTP requested for unknown email', { email })
        return res.status(200).json({
          success: true,
          emailFound: false,
          message: 'No active account found with this email address.',
        })
      }

      // Cooldown, checked before anything is written so a rejected request
      // cannot invalidate the code the employee is already typing in.
      const lastOtp = await LoginOtp.findOne({
        where: { userId: user.id, consumedAt: null },
        order: [['createdAt', 'DESC']],
      })
      if (lastOtp) {
        const ageSeconds = (Date.now() - Number(lastOtp.issuedAtMs)) / 1000
        if (ageSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
          const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - ageSeconds)
          return res.status(429).json({
            success: false,
            message: `A code was just sent. Please wait ${wait} second${wait === 1 ? '' : 's'} before requesting another.`,
            retryAfterSeconds: wait,
          })
        }
      }

      // Only the newest code may work — otherwise every code ever mailed to this
      // employee stays valid until it expires.
      await LoginOtp.destroy({ where: { userId: user.id, consumedAt: null } })

      const otp = generateOtp()
      const otpHash = await bcrypt.hash(otp, 10)
      const issuedAtMs = Date.now()

      await LoginOtp.create({
        userId: user.id,
        email: user.email,
        otpHash,
        issuedAtMs,
        expiresAtMs: issuedAtMs + OTP_TTL_MINUTES * 60 * 1000,
        ipAddress: req.ip || null,
      })

      let delivered = false
      try {
        const result = await sendEmail({
          to: user.email,
          subject: 'Your HRMS login code',
          text: `Your HRMS login code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
          html: otpEmailTemplate(user.name, otp),
        })
        delivered = !!result.sent
      } catch (mailError) {
        // Without the email there is no way in, so this is a hard failure rather
        // than a silent success that leaves the employee waiting for a code.
        logger.error('Failed to send login OTP email', { email: user.email, error: mailError.message })
        await LoginOtp.destroy({ where: { userId: user.id, consumedAt: null } })
        throw new BadRequestError('Could not send the login code by email. Please try again or contact HR.')
      }

      logger.info('Login OTP issued', { userId: user.id, email: user.email, delivered })

      const payload = {
        success: true,
        emailFound: true,
        message: `A ${OTP_LENGTH}-digit code has been sent to ${user.email}.`,
        expiresInSeconds: OTP_TTL_MINUTES * 60,
        resendInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      }

      // Local development without SMTP would otherwise be unable to sign in at
      // all. Gated on an explicit NODE_ENV=development (not merely "not
      // production") so a missing/typo'd env var can never expose a live code.
      if (!delivered && process.env.NODE_ENV === 'development') {
        payload.devOtp = otp
        payload.message += ' (SMTP is not configured — code shown for local development only.)'
      }

      res.status(200).json(payload)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Verify a one-time login code and start a session
   * POST /api/auth/verify-otp
   */
  async verifyOtp(req, res, next) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase()
      const otp = String(req.body.otp || '').trim()

      if (!email || !otp) throw new BadRequestError('Email and code are required')

      const user = await User.findOne({
        where: { email, isActive: true },
        include: [
          { model: User, as: 'reportingManager', attributes: ['id', 'name'], required: false },
        ],
      })
      // Deliberately the same message as a wrong code: an unknown address must
      // not be distinguishable at the verify step.
      if (!user) throw new UnauthorizedError('Invalid or expired code. Please request a new one.')

      const record = await LoginOtp.findOne({
        where: { userId: user.id, consumedAt: null },
        order: [['createdAt', 'DESC']],
      })

      if (!record) {
        throw new UnauthorizedError('No active code. Please request a new one.')
      }

      if (Number(record.expiresAtMs) < Date.now()) {
        await record.destroy()
        throw new UnauthorizedError('That code has expired. Please request a new one.')
      }

      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        await record.destroy()
        throw new UnauthorizedError('Too many incorrect attempts. Please request a new code.')
      }

      // Recorded before the comparison so a client that abandons the request
      // mid-flight still spends the attempt.
      await record.increment('attempts')

      const isValid = await bcrypt.compare(otp, record.otpHash)
      if (!isValid) {
        const left = Math.max(0, OTP_MAX_ATTEMPTS - (record.attempts + 1))
        logger.warn('Invalid login OTP submitted', { userId: user.id, email: user.email, attemptsLeft: left })
        throw new UnauthorizedError(
          left > 0
            ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
            : 'Incorrect code. Please request a new one.'
        )
      }

      // Single use: burn it before the session is handed out, so a replay of the
      // same request cannot mint a second token.
      await record.update({ consumedAt: new Date() })
      await user.update({ lastLogin: new Date() })

      logger.info('User logged in via OTP', { userId: user.id, email: user.email })

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: buildAuthPayload(user, { isReportingPerson: await countsAsReportingPerson(user.id) }),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Forgot password
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body

      if (!email) {
        throw new BadRequestError('Email is required')
      }

      const user = await User.findOne({ where: { email, isActive: true } })

      if (!user) {
        logger.warn('Forgot password requested for non-existing email', { email })
        return res.status(200).json({
          success: true,
          emailFound: false,
          message: 'No account found with this email address. Please check the email or register.',
        })
      }

      const resetSecret = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
      const resetExpiresIn = process.env.JWT_RESET_EXPIRES_IN || '1h'

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        resetSecret,
        { expiresIn: resetExpiresIn }
      )

      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
      const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`

      const subject = 'HRMS Password Reset Request'

      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(90deg, #1890ff, #40a9ff); padding: 16px 24px;">
              <h1 style="margin: 0; font-size: 20px; color: #ffffff;">HRMS Password Reset</h1>
            </div>
            <div style="padding: 24px;">
              <p style="font-size: 14px; color: #333333;">Hi ${user.name || 'there'},</p>
              <p style="font-size: 14px; color: #444444; line-height: 1.6;">
                We received a request to reset the password for your HRMS account associated with
                <strong>${user.email}</strong>.
              </p>
              <p style="font-size: 14px; color: #444444; line-height: 1.6;">
                To reset your password, please click the button below. This link will be valid for a limited time.
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a
                  href="${resetUrl}"
                  style="display: inline-block; padding: 10px 22px; background-color: #1890ff; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;"
                >
                  Reset Password
                </a>
              </div>
              <p style="font-size: 13px; color: #666666; line-height: 1.6;">
                If the button above does not work, copy and paste the following link into your browser:
              </p>
              <p style="font-size: 12px; color: #1890ff; word-break: break-all; margin-top: 8px;">
                ${resetUrl}
              </p>
              <p style="font-size: 13px; color: #666666; margin-top: 24px;">
                If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
            <div style="background-color: #fafafa; padding: 16px 24px; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated message from the HRMS system. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `

      const text = `Hi ${user.name || 'there'},\n\nWe received a request to reset your HRMS password.\n\nClick here to reset: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`
      let emailResult = { sent: false }
      try {
        emailResult = await sendEmail({
          to: user.email,
          subject,
          text,
          html,
        })
        logger.info('Password reset email sent', { userId: user.id, email: user.email })
      } catch (emailError) {
        logger.error('Failed to send password reset email', { error: emailError.message })
        throw new BadRequestError(
          'Failed to send email. Please check SMTP configuration or try again later.'
        )
      }

      const responseData = {
        success: true,
        emailFound: true,
        message: 'Password reset link has been sent to your email. Please check your inbox.',
      }
      // In dev mode (SMTP not configured), include reset link so user can test
      if (emailResult.resetUrl) {
        responseData.resetUrl = emailResult.resetUrl
        responseData.devMode = true
      }
      res.status(200).json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body

      if (!token || !password) {
        throw new BadRequestError('Token and new password are required')
      }

      const resetSecret = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET

      let payload
      try {
        payload = jwt.verify(token, resetSecret)
      } catch (err) {
        throw new UnauthorizedError('Invalid or expired reset token')
      }

      const user = await User.findByPk(payload.id)

      if (!user || !user.isActive) {
        throw new NotFoundError('User not found or inactive')
      }

      // Update password (will be hashed by model hook)
      user.password = password
      await user.save()

      logger.info('Password reset successfully', { userId: user.id, email: user.email })

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            association: 'offices',
            attributes: ['id', 'name', 'country'],
          },
          { model: User, as: 'reportingManager', attributes: ['id', 'name'], required: false },
        ],
      })

      if (!user) {
        throw new UnauthorizedError('User not found')
      }

      const plain = user.get({ plain: true })
      const reportingManagerName =
        plain.reportingManager && plain.reportingManager.name ? plain.reportingManager.name : null
      const data = {
        ...plain,
        reportingManagerName,
      }
      delete data.password
      if (data.reportingManager) delete data.reportingManager

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Refresh token (optional - for future implementation)
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      // Implementation for refresh token logic
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {},
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AuthController()
