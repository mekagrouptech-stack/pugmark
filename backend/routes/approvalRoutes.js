const express = require('express')
const router = express.Router()
const approvalController = require('../controllers/approvalController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

/**
 * Approval Routes - HR Head approvals
 * All routes require HR Head or Admin
 */

router.get(
  '/',
  authenticate,
  authorize(['ADMIN', 'HEAD_HR', 'HR']),
  approvalController.getPendingApprovals
)

module.exports = router
