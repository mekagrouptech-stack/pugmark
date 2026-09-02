const express = require('express')
const router = express.Router()
const salaryController = require('../controllers/salaryController')
const salaryHeadsController = require('../controllers/salaryHeadsController')
const salaryStructureController = require('../controllers/salaryStructureController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

router.get('/me', authenticate, salaryController.getMySalary)

// Salary-slip structure for a specific employee (HR Payroll download uses this)
router.get(
  '/structure/:userId',
  authenticate,
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD', 'MANAGER']),
  salaryController.getUserSalaryStructure
)

// Salary structures (HR/Admin)
router.get('/structures', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryStructureController.getAll)
router.get('/structures/:id', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryStructureController.getById)
router.post('/structures', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryStructureController.create)
router.put('/structures/:id', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryStructureController.update)
router.delete('/structures/:id', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryStructureController.remove)
router.post('/structures/:id/duplicate', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryStructureController.duplicate)
router.post('/structures/bulk-delete', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryStructureController.bulkDelete)

// Salary heads (HR/Admin)
router.get('/heads', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryHeadsController.getAll)
router.post('/heads', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryHeadsController.create)
router.put('/heads/:id', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryHeadsController.update)
router.delete('/heads/:id', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), salaryHeadsController.remove)

module.exports = router
