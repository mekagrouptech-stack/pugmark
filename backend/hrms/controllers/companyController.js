const path = require('path')
const fs = require('fs')
const companyService = require('../services/companyService')
const logger = require('../utils/logger')
const { asyncHandler } = require('../utils/asyncHandler')

/**
 * Upload company logo - saves to storage/companies/logos, returns path for DB
 * POST /api/companies/upload/logo
 */
const uploadCompanyLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    })
  }
  const fileUrl = `http://localhost:5000/storage/companies/logos/${req.file.filename}`
  res.json({
    success: true,
    message: 'Logo uploaded successfully',
    data: { url: fileUrl },
  })
})

/**
 * Get all companies
 * GET /api/companies
 */
const getAllCompanies = asyncHandler(async (req, res) => {
  try {
    const { isActive, country, search } = req.query
    const filters = {}

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true'
    }

    if (country) {
      filters.country = country
    }

    if (search) {
      filters.search = search
    }

    const companies = await companyService.getAllCompanies(filters)
    const data = companies.map((c) => {
      const item = c.toJSON ? c.toJSON() : c
      if (item.logo_url && !item.logoUrl) item.logoUrl = item.logo_url
      return item
    })

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    })
  } catch (error) {
    logger.error('Error in getAllCompanies:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch companies',
    })
  }
})

/**
 * Get company logo image - serves file via API for reliable display (avoids CORS)
 * GET /api/companies/:id/logo
 */
const getCompanyLogo = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const company = await companyService.getCompanyById(id)
    let logoPath = (company.logoUrl || company.logo_url || '').trim()
    if (!logoPath) {
      return res.status(404).json({ success: false, message: 'No logo' })
    }
    // Strip full URL prefix if stored as http://localhost:5000/storage/...
    logoPath = logoPath.replace(/^https?:\/\/[^/]+/, '')
    // Now logoPath is like /storage/companies/logos/logo-xxx.png or just a filename
    const relPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath
    const fullPath = relPath.includes('/')
      ? path.join(__dirname, '..', relPath)
      : path.join(__dirname, '../storage/companies/logos', relPath)
    const resolved = path.resolve(fullPath)
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ success: false, message: 'Logo file not found' })
    }
    res.sendFile(resolved)
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return res.status(404).json({ success: false, message: 'Company not found' })
    }
    throw err
  }
})

/**
 * Get company by ID
 * GET /api/companies/:id
 */
const getCompanyById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const company = await companyService.getCompanyById(id)
    const data = company.toJSON ? company.toJSON() : company
    // Ensure logoUrl is available (handle logo_url from DB)
    if (data.logo_url && !data.logoUrl) data.logoUrl = data.logo_url

    res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    logger.error('Error in getCompanyById:', error)
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Company not found',
      })
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch company',
    })
  }
})

/**
 * Create a new company
 * POST /api/companies
 */
const createCompany = asyncHandler(async (req, res) => {
  try {
    const company = await companyService.createCompany(req.body)

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company,
    })
  } catch (error) {
    logger.error('Error in createCompany:', error)
    if (error.name === 'BadRequestError') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid company data',
      })
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create company',
    })
  }
})

/**
 * Update company
 * PUT /api/companies/:id
 */
const updateCompany = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const company = await companyService.updateCompany(id, req.body)

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company,
    })
  } catch (error) {
    logger.error('Error in updateCompany:', error)
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Company not found',
      })
    }
    if (error.name === 'BadRequestError') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid company data',
      })
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update company',
    })
  }
})

/**
 * Delete company (soft delete)
 * DELETE /api/companies/:id
 */
const deleteCompany = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    await companyService.deleteCompany(id)

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    })
  } catch (error) {
    logger.error('Error in deleteCompany:', error)
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Company not found',
      })
    }
    if (error.name === 'BadRequestError') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Cannot delete company',
      })
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete company',
    })
  }
})

module.exports = {
  getAllCompanies,
  getCompanyById,
  getCompanyLogo,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
}
