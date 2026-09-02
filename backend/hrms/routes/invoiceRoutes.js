const express = require('express')
const router = express.Router()
const invoiceController = require('../controllers/invoiceController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

const HR_ROLES = ['ADMIN', 'HR', 'HEAD_HR', 'HOD']

// Invoice employees (the people). Declared before '/:id' so these static
// paths are not swallowed by the invoice-by-id route.
router.get('/employees', authenticate, authorize(HR_ROLES), invoiceController.getInvoiceEmployees)
router.post('/employees', authenticate, authorize(HR_ROLES), invoiceController.createInvoiceEmployee)
router.put(
  '/employees/:id',
  authenticate,
  authorize(HR_ROLES),
  invoiceController.updateInvoiceEmployee
)
router.delete(
  '/employees/:id',
  authenticate,
  authorize(HR_ROLES),
  invoiceController.removeInvoiceEmployee
)

router.get('/summary', authenticate, authorize(HR_ROLES), invoiceController.getSummary)

// Invoices
router.get('/', authenticate, authorize(HR_ROLES), invoiceController.getAll)
router.post('/', authenticate, authorize(HR_ROLES), invoiceController.create)
router.get('/:id', authenticate, authorize(HR_ROLES), invoiceController.getById)
router.put('/:id', authenticate, authorize(HR_ROLES), invoiceController.update)
router.delete('/:id', authenticate, authorize(HR_ROLES), invoiceController.remove)

module.exports = router
