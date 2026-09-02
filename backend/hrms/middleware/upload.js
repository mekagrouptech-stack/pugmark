const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Storage root - all images/files stored here, paths saved in database
const storageRoot = path.join(__dirname, '../storage')
if (!fs.existsSync(storageRoot)) {
  fs.mkdirSync(storageRoot, { recursive: true })
}

// Subdirectories: companies/logos, avatars, documents (used across whole website)
const companiesLogosDir = path.join(storageRoot, 'companies', 'logos')
const avatarDir = path.join(storageRoot, 'avatars')
const documentsDir = path.join(storageRoot, 'documents')
const noticesDir = path.join(storageRoot, 'notices')

;[companiesLogosDir, avatarDir, documentsDir, noticesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// Path returned to client/database: /storage/... (relative, no host)
const getStoragePath = (subPath) => `/storage/${path.relative(storageRoot, subPath).replace(/\\/g, '/')}`

// Configure storage for company logos
const companyLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, companiesLogosDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = (path.extname(file.originalname) || '.png').toLowerCase()
    cb(null, `logo-${uniqueSuffix}${ext}`)
  },
})

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${req.user?.id || 'anon'}-${uniqueSuffix}${ext}`)
  },
})

// Configure storage for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `doc-${req.user?.id || 'anon'}-${uniqueSuffix}${ext}`)
  },
})

// File filter for avatars
const avatarFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG and PNG images are allowed for avatars'), false)
  }
}

// File filter for company logos (PNG, JPG up to 5MB)
const companyLogoFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (allowedTypes.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Only PNG and JPG images allowed for company logo'), false)
}

// Configure storage for notice attachments (PDF)
const noticeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, noticesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = (path.extname(file.originalname) || '.pdf').toLowerCase()
    cb(null, `notice-${uniqueSuffix}${ext}`)
  },
})

// File filter for notice attachments — PDF only
const noticeFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true)
  else cb(new Error('Only PDF files are allowed as a notice attachment'), false)
}

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error('Only PDF, JPEG, and PNG files are allowed for documents'),
      false
    )
  }
}

// Limits
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
}
const companyLogoLimit = { fileSize: 5 * 1024 * 1024 } // 5MB

// Multer instances
const uploadCompanyLogoMulter = multer({
  storage: companyLogoStorage,
  fileFilter: companyLogoFilter,
  limits: companyLogoLimit,
})

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits,
})

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits,
})

const uploadNotice = multer({
  storage: noticeStorage,
  fileFilter: noticeFilter,
  limits, // 10MB
})

/**
 * Spreadsheet uploads (attendance import).
 *
 * Memory storage, not disk: the importer parses the buffer and throws it away,
 * so writing a temp file would only leave orphans on the server. 5MB is well
 * past a year of attendance rows.
 *
 * The extension is checked alongside the MIME type because browsers and
 * versions of Excel disagree about what to send for .xlsx and .csv — Windows
 * commonly reports application/octet-stream — and a filter that trusted the
 * MIME type alone would reject perfectly valid sheets.
 */
const spreadsheetFilter = (req, file, cb) => {
  const allowedExt = ['.xlsx', '.xls', '.csv']
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (allowedExt.includes(ext)) return cb(null, true)
  cb(new Error('Only .xlsx, .xls and .csv files are allowed'), false)
}

const uploadSpreadsheetMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: spreadsheetFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

module.exports = {
  uploadSpreadsheet: uploadSpreadsheetMulter.single('file'),
  uploadAvatar: uploadAvatar.single('avatar'),
  uploadDocument: uploadDocument.single('document'),
  uploadMultipleDocuments: uploadDocument.array('documents', 10), // Max 10 files
  uploadCompanyLogo: uploadCompanyLogoMulter.single('logo'),
  uploadNoticeAttachment: uploadNotice.single('attachment'),
  getStoragePath,
  companiesLogosDir,
}
