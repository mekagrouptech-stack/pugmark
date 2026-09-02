const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { validate, schemas } = require('../utils/validators')

/**
 * Auth Routes
 */

// Login
router.post(
  '/login',
  validate(
    require('joi').object({
      email: require('joi').string().email().required(),
      password: require('joi').string().min(6).required(),
    })
  ),
  authController.login
)

// Passwordless sign-in: request a one-time code, then exchange it for a session
router.post(
  '/request-otp',
  validate(
    require('joi').object({
      email: require('joi').string().email().required(),
    })
  ),
  authController.requestOtp
)

router.post(
  '/verify-otp',
  validate(
    require('joi').object({
      email: require('joi').string().email().required(),
      // Digits only and exactly the issued length, so malformed input is
      // rejected before it can burn one of the user's five attempts.
      otp: require('joi').string().pattern(/^[0-9]{6}$/).required().messages({
        'string.pattern.base': 'Enter the 6-digit code from your email',
      }),
    })
  ),
  authController.verifyOtp
)

// Forgot password
router.post(
  '/forgot-password',
  validate(
    require('joi').object({
      email: require('joi').string().email().required(),
    })
  ),
  authController.forgotPassword
)

// Reset password
router.post(
  '/reset-password',
  validate(
    require('joi').object({
      token: require('joi').string().required(),
      password: require('joi').string().min(6).required(),
    })
  ),
  authController.resetPassword
)

// Get current user
router.get('/me', authenticate, authController.getCurrentUser)

// Refresh token
router.post('/refresh', authController.refreshToken)

module.exports = router
