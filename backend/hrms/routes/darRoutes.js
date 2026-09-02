const express = require('express')
const router = express.Router()
const darController = require('../controllers/darController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

/**
 * DAR Routes
 * All routes require authentication
 */

// Get my DARs (employee)
router.get('/my', authenticate, darController.getMyDARs)

// Create my DAR (primary endpoint)
router.post('/my', authenticate, darController.createMyDAR)

// Create DAR - alternate endpoint (same as POST /my)
router.post('/', authenticate, darController.createMyDAR)

// My DAR stats (dashboard)
router.get('/my/stats', authenticate, darController.getMyStats)
// My project summary
router.get('/my/projects-summary', authenticate, darController.getMyProjectSummary)

// DAR projects master
router.get('/projects', authenticate, darController.getProjects)
router.post(
  '/projects',
  authenticate,
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER', 'HOD']),
  darController.createProject
)

// DAR clients master
router.get('/clients', authenticate, darController.getClients)
router.post(
  '/clients',
  authenticate,
  authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER', 'HOD']),
  darController.createClient
)

// Get team DARs (manager) - must be before /:id
router.get(
  '/team',
  authenticate,
  authorize(['MANAGER', 'HR', 'HEAD_HR', 'ADMIN', 'HOD']),
  darController.getTeamDARs
)

// Single user DAR stats (manager/HR/admin) - must be before /:id
router.get(
  '/user/:userId/stats',
  authenticate,
  darController.getUserStats
)
router.get(
  '/user/:userId/projects-summary',
  authenticate,
  darController.getUserProjectSummary
)
// Users viewable for single user dashboard
router.get(
  '/viewable-users',
  authenticate,
  darController.getViewableUsers
)

// Get all DARs (HR/Admin) - must be before /:id
router.get(
  '/all',
  authenticate,
  authorize(['HR', 'HEAD_HR', 'ADMIN', 'HOD']),
  darController.getAllDARs
)

// Get a single DAR by ID
router.get('/:id', authenticate, darController.getDarById)

// Update my DAR
router.put('/:id', authenticate, darController.updateMyDAR)

// Submit my DAR
router.post('/:id/submit', authenticate, darController.submitMyDAR)

// Approve DAR (responsible person: reporting manager, HR, Admin)
router.post('/:id/approve', authenticate, darController.approveDar)

// Reject DAR (responsible person: reporting manager, HR, Admin)
router.post('/:id/reject', authenticate, darController.rejectDar)

module.exports = router
