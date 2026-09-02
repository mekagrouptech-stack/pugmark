const express = require('express')
const router = express.Router()
const {
  runAutoPayroll,
  getPayrollStatus,
  getPayrolls,
  getPayrollById,
  getAttendanceSummary,
  calculatePayroll,
  calculateAllPayroll,
} = require('../controllers/payrollController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

// All routes require authentication
router.use(authenticate)

// Manual trigger for payroll calculation (Admin/HR only)
router.post('/run-auto', authorize(['ADMIN', 'HR', 'HEAD_HR']), runAutoPayroll)

// Get payroll status
router.get('/status', authorize(['ADMIN', 'HR', 'HEAD_HR']), getPayrollStatus)

// Get all payrolls (with filters)
router.get('/', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), getPayrolls)

// Get payroll by ID
router.get('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER', 'EMPLOYEE']), getPayrollById)

// Get attendance summary before payroll generation
router.get(
  '/attendance-summary/:userId/:year/:month',
  authorize(['ADMIN', 'HR', 'HEAD_HR']),
  getAttendanceSummary
)

// Calculate payroll for specific employee and month
router.post('/calculate', authorize(['ADMIN', 'HR', 'HEAD_HR']), calculatePayroll)

// Calculate payroll for ALL active employees for a given month
router.post('/calculate-all', authorize(['ADMIN', 'HR', 'HEAD_HR']), calculateAllPayroll)

module.exports = router
