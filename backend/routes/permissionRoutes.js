const express = require('express')
const router = express.Router()
const permissionController = require('../controllers/permissionController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

// All permission routes require authentication and admin role

router.get(
  '/',
  authenticate,
  authorize(['ADMIN']),
  permissionController.getPermissions
)

router.post(
  '/update',
  authenticate,
  authorize(['ADMIN']),
  permissionController.updateRolePermission
)

router.post(
  '/reset',
  authenticate,
  authorize(['ADMIN']),
  permissionController.resetRolePermissions
)

module.exports = router

