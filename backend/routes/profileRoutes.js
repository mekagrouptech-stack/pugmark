const express = require('express')
const router = express.Router()
const profileController = require('../controllers/profileController')
const { authenticate } = require('../middleware/auth')
const { uploadAvatar, uploadDocument } = require('../middleware/upload')

/**
 * Profile Routes
 * All routes require authentication
 */

// Get user profile
router.get('/', authenticate, profileController.getProfile)

// Update a single field
router.patch('/field', authenticate, profileController.updateField)

// Update an entire group
router.put('/group', authenticate, profileController.updateGroup)

// Upload avatar
router.post(
  '/upload/avatar',
  authenticate,
  uploadAvatar,
  profileController.uploadAvatar
)

// Upload document
router.post(
  '/upload/document',
  authenticate,
  uploadDocument,
  profileController.uploadDocument
)

module.exports = router
