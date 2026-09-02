const express = require('express')
const router = express.Router()
const reimbursementController = require('../controllers/reimbursementController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

// All routes require authentication
router.post('/', authenticate, reimbursementController.create)
router.get('/', authenticate, reimbursementController.getMyRequests)

// Team list and approve/reject: Admin, HR, Head HR, Manager
router.get(
  '/team',
  authenticate,
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']),
  reimbursementController.getTeamRequests
)
router.patch(
  '/:id/approve',
  authenticate,
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']),
  reimbursementController.approve
)
router.patch(
  '/:id/reject',
  authenticate,
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']),
  reimbursementController.reject
)

module.exports = router
