const express = require('express')
const router = express.Router()
const attendanceController = require('../controllers/attendanceController')
const attendanceRequestController = require('../controllers/attendanceRequestController')
const attendanceLogController = require('../controllers/attendanceLogController')
const { authenticate, canOverrideGeofence } = require('../middleware/auth')
const { authorize, authorizeOrReportingPerson } = require('../middleware/authorize')
const { validateOfficeAccess } = require('../middleware/officeAccess')
const { validate, schemas } = require('../utils/validators')
const { uploadSpreadsheet } = require('../middleware/upload')

/**
 * Attendance Routes
 * All routes require authentication
 */

// Biometric (eSSL device) punch logs for a given day
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR', 'HOD'),
  attendanceLogController.getDeviceLogs
)

// Punch attendance (IN/OUT)
router.post(
  '/punch',
  authenticate,
  canOverrideGeofence,
  validate(schemas.punchAttendance),
  validateOfficeAccess,
  attendanceController.punchAttendance
)

// Get today's attendance for current user
router.get('/today', authenticate, attendanceController.getTodayAttendance)

// Get user's attendance records
router.get('/records', authenticate, attendanceController.getAttendanceRecords)

// Get team / all employees attendance. Reporting persons are included even when
// their role is EMPLOYEE — the controller narrows the rows to their own reports.
router.get(
  '/team',
  authenticate,
  authorizeOrReportingPerson('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.getTeamAttendance
)

// Get late mark records (check-in after 10:15 AM = Late). Manager sees team; Admin sees all.
router.get(
  '/late-marks',
  authenticate,
  authorizeOrReportingPerson('ADMIN', 'HR', 'MANAGER', 'HEAD_HR', 'HOD'),
  attendanceController.getLateMarks
)

// Get specific attendance record
router.get('/records/:id', authenticate, attendanceController.getAttendanceRecordById)

// Delete attendance record (Admin / HR / Manager only)
router.delete(
  '/records/:id',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.deleteAttendanceRecord
)

// Update attendance record (Admin / HR / Manager only)
router.put(
  '/update',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  validate(schemas.updateAttendance),
  attendanceController.updateAttendance
)

// Import attendance from a spreadsheet (Admin / HR / Manager only).
// multipart/form-data, field name "file".
router.post(
  '/import',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  uploadSpreadsheet,
  attendanceController.importAttendanceExcel
)

// Fill a whole month for a set of employees (Admin / HR / Manager only).
router.post(
  '/bulk-month',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.bulkFillMonth
)

// Monthly matrix workbook — employees down, days across. Doubles as the offline
// form for a month and as the file the import above reads back.
router.get(
  '/monthly-template',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.downloadMonthlyTemplate
)

// Paste-from-Excel entry. Preview first (writes nothing), then apply.
router.post(
  '/paste-preview',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.previewPaste
)
router.post(
  '/paste',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.applyPaste
)

// Export a month's actual attendance in the same matrix layout, so a month can
// be pulled out, corrected in Excel, and pushed back through the import above.
router.get(
  '/monthly-export',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.exportMonthlyMatrix
)

// Blank template for the import above.
router.get(
  '/import-template',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR'),
  attendanceController.downloadImportTemplate
)

// Attendance requests (Late Mark / Absent Regularization)
router.get('/requests/my', authenticate, attendanceRequestController.getMyRequests)
// My Team loads this on every tab, so a reporting person has to be able to call
// it. Attendance regulation still goes to Head HR alone — the controller hands
// everyone else an empty list — but they get that empty list instead of a 403
// on every page view.
router.get(
  '/requests/pending',
  authenticate,
  authorizeOrReportingPerson('ADMIN', 'HR', 'MANAGER', 'HEAD_HR', 'HOD'),
  attendanceRequestController.getPendingRequests
)
router.patch(
  '/requests/:id/approve',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR', 'HOD'),
  attendanceRequestController.approveRequest
)
router.patch(
  '/requests/:id/reject',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'HEAD_HR', 'HOD'),
  attendanceRequestController.rejectRequest
)
router.post('/requests', authenticate, attendanceRequestController.createRequest)

module.exports = router
