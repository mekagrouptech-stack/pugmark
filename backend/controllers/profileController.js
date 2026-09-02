const profileService = require('../services/profileService')
const { asyncHandler } = require('../utils/asyncHandler')
const logger = require('../utils/logger')
const path = require('path')

/**
 * Profile fields an employee cannot set on themselves - only HR/Admin may.
 *
 * The whole Employment Information group is HR-owned: joining/confirmation
 * dates, employee code, department, company, notice period and exit dates are
 * decided by HR, so an employee may read them but never edit them. Blocking
 * them here (not just in the UI) is what actually enforces it - the profile
 * endpoints are otherwise reachable by any authenticated user.
 */
const EMPLOYMENT_FIELDS = [
  'dateOfJoining',
  'confirmationDate',
  'employmentStatus',
  'employeeCode',
  'noticePeriod',
  'stateTax',
  'compOffOvertime',
  'department',
  'workLocation',
  'companyId',
  'lastWorkingDate',
]

const HR_ONLY_FIELDS = ['officialMobileNo', ...EMPLOYMENT_FIELDS]
const HR_ONLY_ROLES = ['HR', 'HEAD_HR', 'ADMIN']

const canEditHrOnlyFields = (user) =>
  HR_ONLY_ROLES.includes(String(user?.role || '').toUpperCase())

/**
 * Get user profile
 * GET /api/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const profile = await profileService.getProfile(userId)

  res.json({
    success: true,
    message: 'Profile fetched successfully',
    data: profile,
  })
})

/**
 * Update a single profile field
 * PATCH /api/profile/field
 */
const updateField = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { group, field, value } = req.body

  if (!group || !field) {
    return res.status(400).json({
      success: false,
      message: 'Group and field are required',
    })
  }

  if (HR_ONLY_FIELDS.includes(field) && !canEditHrOnlyFields(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'This field can only be updated by HR or Admin',
    })
  }

  const result = await profileService.updateField(userId, group, field, value)

  res.json({
    success: true,
    message: 'Field updated successfully',
    data: result,
  })
})

/**
 * Update an entire profile group
 * PUT /api/profile/group
 */
const updateGroup = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { group, data } = req.body

  if (!group || !data) {
    return res.status(400).json({
      success: false,
      message: 'Group and data are required',
    })
  }

  // The group form resends every field, including untouched ones, so quietly
  // drop HR-only fields instead of failing the whole save.
  let payload = data
  if (!canEditHrOnlyFields(req.user)) {
    payload = { ...data }
    HR_ONLY_FIELDS.forEach((field) => delete payload[field])
  }

  const result = await profileService.updateGroup(userId, group, payload)

  res.json({
    success: true,
    message: 'Profile group updated successfully',
    data: result,
  })
})

/**
 * Upload avatar
 * POST /api/profile/upload/avatar
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    })
  }

  const userId = req.user.id
  // Path stored in DB - served from /storage
  const fileUrl = `/storage/avatars/${req.file.filename}`

  // Update avatar field in profile
  const result = await profileService.updateField(
    userId,
    'basicInformation',
    'avatar',
    fileUrl
  )

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      url: fileUrl,
      profile: result.profile,
    },
  })
})

/**
 * Upload document
 * POST /api/profile/upload/document
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    })
  }

  const userId = req.user.id
  const { field } = req.body

  if (!field) {
    return res.status(400).json({
      success: false,
      message: 'Document field name is required',
    })
  }

  // Path stored in DB - served from /storage
  const fileUrl = `/storage/documents/${req.file.filename}`

  // Special handling for company logos - use dedicated company logo upload instead
  // (saves to storage/companies/logos); this fallback kept for backward compat
  if (field === 'companyLogo') {
    return res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        field,
        url: fileUrl,
      },
    })
  }

  // Every document slot holds a single file - replace the existing one
  await profileService.updateField(userId, 'documents', field, fileUrl)

  // Get updated profile
  const result = await profileService.getProfile(userId)

  res.json({
    success: true,
    message: 'Document uploaded successfully',
    data: {
      field,
      url: fileUrl,
      profile: result,
    },
  })
})

module.exports = {
  getProfile,
  updateField,
  updateGroup,
  uploadAvatar,
  uploadDocument,
}
