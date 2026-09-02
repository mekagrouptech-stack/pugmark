const express = require('express')
const router = express.Router()
const leaveController = require('../controllers/leaveController')
const leaveWorkflowService = require('../services/leaveWorkflowService')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

// Ensure leaves table has hr_head_id columns (fixes "Unknown column" error)
const ensureLeavesSchema = async (req, res, next) => {
  try {
    await leaveWorkflowService.ensureLeavesColumns()
  } catch (e) {
    /* ignore */
  }
  next()
}

/**
 * Leave Routes
 */

router.use(authenticate, ensureLeavesSchema)

router.get('/', leaveController.getLeaves)

router.get(
  '/balance/all',
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']),
  leaveController.getAllLeaveBalances
)

router.get('/balance', leaveController.getLeaveBalance)

// Leave balance adjustments (HR credits/debits). Declared before '/:id' so the
// param route cannot swallow them.
router.get(
  '/balance/adjustments',
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']),
  leaveController.listBalanceAdjustments
)
router.post(
  '/balance/adjustments',
  authorize(['ADMIN', 'HR', 'HEAD_HR']),
  leaveController.createBalanceAdjustment
)
router.put(
  '/balance/adjustments/:id',
  authorize(['ADMIN', 'HR', 'HEAD_HR']),
  leaveController.updateBalanceAdjustment
)
router.delete(
  '/balance/adjustments/:id',
  authorize(['ADMIN', 'HR', 'HEAD_HR']),
  leaveController.deleteBalanceAdjustment
)

// Set an employee's balance to an exact figure (the Edit action on the balance
// page). Declared after the '/balance/adjustments' routes so ':userId' cannot
// capture the literal 'adjustments' segment.
router.put(
  '/balance/:userId',
  authorize(['ADMIN', 'HR', 'HEAD_HR']),
  leaveController.setLeaveBalance
)

router.get('/:id', leaveController.getLeaveById)

router.post('/', leaveController.applyLeave)

// Two-step approval: 1) Reporting Person, 2) Head HR
router.patch('/:id/approve-manager', leaveController.approveManager)
router.patch('/:id/reject-manager', leaveController.rejectManager)
router.patch('/:id/approve-hr', leaveController.approveHr)
router.patch('/:id/reject-hr', leaveController.rejectHr)
// Legacy: auto-routes to manager or HR based on status (bind to preserve 'this')
router.patch('/:id/approve', leaveController.approveLeave.bind(leaveController))
router.patch('/:id/reject', leaveController.rejectLeave.bind(leaveController))

router.patch('/:id/cancel', leaveController.cancelLeave)

module.exports = router
