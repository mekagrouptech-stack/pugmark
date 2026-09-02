const express = require('express')
const router = express.Router()
const {
  getAllCompanies,
  getCompanyById,
  getCompanyLogo,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
} = require('../controllers/companyController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')
const { uploadCompanyLogo: uploadCompanyLogoMw } = require('../middleware/upload')

// Logo - public (img src cannot send auth header)
router.get('/:id/logo', getCompanyLogo)

// All other routes require authentication
router.use(authenticate)

// Upload company logo (Admin only) - must be before /:id
router.post('/upload/logo', authorize(['ADMIN']), uploadCompanyLogoMw, uploadCompanyLogo)

// Get all companies (Admin/HR only)
router.get('/', authorize(['ADMIN', 'HR', 'HEAD_HR']), getAllCompanies)

// Get company by ID (Admin/HR/Manager can view)
router.get('/:id', authorize(['ADMIN', 'HR', 'HEAD_HR', 'MANAGER']), getCompanyById)

// Create company (Admin only)
router.post('/', authorize(['ADMIN']), createCompany)

// Update company (Admin only)
router.put('/:id', authorize(['ADMIN']), updateCompany)

// Delete company (Admin only)
router.delete('/:id', authorize(['ADMIN']), deleteCompany)

module.exports = router
