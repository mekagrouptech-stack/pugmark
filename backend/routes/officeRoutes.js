const express = require('express')
const router = express.Router()
const officeController = require('../controllers/officeController')
const { authenticate, optionalAuthenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { validate, schemas } = require('../utils/validators')

/**
 * Office Routes
 */

// Get all offices (public or authenticated)
router.get('/', optionalAuthenticate, officeController.getAllOffices)

// Get office location for map (optimized for frontend)
router.get(
  '/:id/location',
  optionalAuthenticate,
  validate(schemas.getOfficeLocation, 'params'),
  officeController.getOfficeLocation
)

// Get user's assigned offices
router.get('/user/:userId', authenticate, officeController.getUserOffices)

// Check if user has access to office
router.get('/:id/access', authenticate, officeController.checkOfficeAccess)

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(schemas.office, 'body'),
  officeController.createOffice
)

router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validate(schemas.getOfficeLocation, 'params'),
  validate(schemas.office, 'body'),
  officeController.updateOffice
)

router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validate(schemas.getOfficeLocation, 'params'),
  officeController.deleteOffice
)

module.exports = router
