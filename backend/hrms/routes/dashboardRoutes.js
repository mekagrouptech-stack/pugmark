const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/dashboardController')
const { authenticate } = require('../middleware/auth')

/**
 * Dashboard Routes
 * All routes require authentication
 */

// Get dashboard stats (org or user)
router.get('/stats', authenticate, dashboardController.getStats)

// Get logged-in user's dashboard data (salary, attendance, working reports, daily calendar)
router.get('/me', authenticate, dashboardController.getMyDashboard)

// Get today's birthdays and work anniversaries
router.get('/celebrations', authenticate, dashboardController.getCelebrations)

module.exports = router
