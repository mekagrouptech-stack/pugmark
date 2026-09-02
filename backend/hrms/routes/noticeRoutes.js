const express = require('express')
const router = express.Router()
const noticeController = require('../controllers/noticeController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { uploadNoticeAttachment } = require('../middleware/upload')

/**
 * Important Notice routes
 * - Any authenticated user can read the notices addressed to them.
 * - Only ADMIN / HEAD_HR / HR can send or view sent notices.
 */
router.use(authenticate)

// Recipient-facing
router.get('/my', noticeController.getMyNotices)
router.patch('/read-all', noticeController.markAllRead)
router.patch('/:id/read', noticeController.markRead)

// Sender-facing (Admin / HR roles)
router.get('/', authorize(['ADMIN', 'HEAD_HR', 'HR']), noticeController.getSentNotices)
router.post(
  '/',
  authorize(['ADMIN', 'HEAD_HR', 'HR']),
  uploadNoticeAttachment,
  noticeController.createNotice
)
router.delete('/:id', authorize(['ADMIN', 'HEAD_HR', 'HR']), noticeController.deleteNotice)

module.exports = router
