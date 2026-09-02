const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticate } = require('../middleware/auth')
const { authorize, authorizeOrReportingPerson } = require('../middleware/authorize')

/**
 * User Management Routes
 * Admin only
 */

// All routes require authentication
router.use(authenticate)

// Get all users (Admin, HR, HEAD_HR, MANAGER can access). A reporting person
// is also let in, but the controller pins their result to their own reports.
router.get(
  '/',
  authorizeOrReportingPerson(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']),
  userController.getAllUsers
)

// Update user (Admin, HR, HEAD_HR, MANAGER can access)
router.put('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), userController.updateUser)

// All other routes require admin role only
router.use(authorize(['ADMIN']))

// Get user by ID
router.get('/:id', userController.getUserById)

// Create new user
router.post('/', userController.createUser)

// Re-send login credentials (generates a new password and emails it)
router.post('/:id/send-credentials', userController.sendCredentials)

// Delete user (soft delete / deactivate)
router.delete('/:id', userController.deleteUser)

// Permanently delete an employee (hard delete + cascade) — System Admin only.
// This is irreversible, so it is restricted to ADMIN even among the admin-only
// routes above.
router.delete('/:id/permanent', authorize(['ADMIN']), userController.permanentlyDeleteUser)

module.exports = router
