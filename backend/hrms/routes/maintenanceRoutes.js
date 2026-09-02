const express = require('express')
const router = express.Router()
const maintenanceController = require('../controllers/maintenanceController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

router.use(authenticate)
router.get('/', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), maintenanceController.getAll)
router.get('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), maintenanceController.getById)
router.post('/', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), maintenanceController.create)
router.put('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), maintenanceController.update)
router.delete('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), maintenanceController.remove)

module.exports = router
