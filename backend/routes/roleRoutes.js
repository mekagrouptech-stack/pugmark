const express = require('express')
const router = express.Router()
const roleController = require('../controllers/roleController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

router.use(authenticate)
router.get('/', authorize(['ADMIN', 'HR', 'HEAD_HR']), roleController.getAllRoles)
router.get('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR']), roleController.getRoleById)
router.post('/', authorize(['ADMIN']), roleController.createRole)
router.put('/:id', authorize(['ADMIN']), roleController.updateRole)
router.delete('/:id', authorize(['ADMIN']), roleController.deleteRole)

module.exports = router
