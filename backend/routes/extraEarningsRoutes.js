const express = require('express')
const router = express.Router()
const extraEarningsController = require('../controllers/extraEarningsController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

router.get('/', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), extraEarningsController.getAll)
router.post('/', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), extraEarningsController.create)
router.put('/:id', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), extraEarningsController.update)
router.delete('/:id', authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR', 'HOD']), extraEarningsController.remove)

module.exports = router
