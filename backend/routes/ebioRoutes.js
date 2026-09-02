const express = require('express')
const router = express.Router()
const ebioController = require('../controllers/ebioController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

/**
 * eBioServerNew integration routes (admin/HR only).
 *   POST /api/ebio/sync   — pull device logs for a date into attendance_logs
 *   GET  /api/ebio/test   — verify connectivity/credentials
 */
router.use(authenticate, authorize(['ADMIN', 'HR', 'HEAD_HR']))

router.post('/pull', ebioController.pull) // both sources (CSV + API)
router.post('/sync', ebioController.sync) // SOAP API only
router.post('/import-csv', ebioController.importCsv) // CSV only
router.get('/test', ebioController.test)

module.exports = router
