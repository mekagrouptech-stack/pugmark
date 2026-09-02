const express = require('express')
const router = express.Router()
const departmentController = require('../controllers/departmentController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

router.use(authenticate)
router.get('/', authorize(['ADMIN', 'HR', 'HEAD_HR']), departmentController.getAllDepartments)
router.get('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR']), departmentController.getDepartmentById)
router.post('/', authorize(['ADMIN']), departmentController.createDepartment)
router.put('/:id', authorize(['ADMIN']), departmentController.updateDepartment)
router.delete('/:id', authorize(['ADMIN']), departmentController.deleteDepartment)

module.exports = router
