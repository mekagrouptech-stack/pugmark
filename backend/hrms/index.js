const express = require('express')
const path = require('path')
const compression = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const { connectDB, sequelize } = require('./config/database')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const attendanceRoutes = require('./routes/attendanceRoutes')
const officeRoutes = require('./routes/officeRoutes')
const authRoutes = require('./routes/authRoutes')
const profileRoutes = require('./routes/profileRoutes')
const userRoutes = require('./routes/userRoutes')
const payrollRoutes = require('./routes/payrollRoutes')
const companyRoutes = require('./routes/companyRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const salaryRoutes = require('./routes/salaryRoutes')
const leaveRoutes = require('./routes/leaveRoutes')
const darRoutes = require('./routes/darRoutes')
const reimbursementRoutes = require('./routes/reimbursementRoutes')
const permissionRoutes = require('./routes/permissionRoutes')
const extraEarningsRoutes = require('./routes/extraEarningsRoutes')
const invoiceRoutes = require('./routes/invoiceRoutes')
const letterRoutes = require('./routes/letterRoutes')
const maintenanceRoutes = require('./routes/maintenanceRoutes')
const approvalRoutes = require('./routes/approvalRoutes')
const roleRoutes = require('./routes/roleRoutes')
const departmentRoutes = require('./routes/departmentRoutes')
const iclockRoutes = require('./routes/iclockRoutes')
const { adminNotification } = require('./middleware/adminNotification')
const payrollScheduler = require('./services/payrollScheduler')
const logger = require('./utils/logger')

const http = require('http')
const app = express()
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === 'production'

// Trust proxy in production (behind Nginx/Apache)
if (isProduction) {
  app.set('trust proxy', 1)
}

// Create HTTP server for Socket.IO
const httpServer = http.createServer(app)

// gzip every text response. The frontend bundle is ~915kB of JS/CSS that
// compresses to ~290kB, so without this the browser downloads roughly three
// times more than it needs to on a cold visit. Must sit above the routes and
// the static handler to catch both.
app.use(compression())

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Let frontend handle CSP
}))

// In production, serve the frontend build from ../dist.
//
// Deliberately mounted ABOVE the CORS gate below. These are this app's own
// public files, requested same-origin by the page the server just handed out —
// they need no allowlist. Behind CORS, any origin missing from CORS_ORIGIN (a
// "www." host, a bare IP, http-vs-https) makes the cors callback error on the
// requests for the app's own JS and CSS, and the user gets a blank page rather
// than a working shell with failing API calls.
if (isProduction) {
  const frontendDist = path.join(__dirname, '..', 'dist')

  // Everything under /assets carries a content hash in its filename, so a
  // changed file is a changed URL — it can be cached hard and never
  // revalidated. index.html must NOT be: it is the only unhashed file, and
  // caching it is what makes a deploy invisible to returning users (worse, it
  // keeps pointing them at hashed chunks the new build deleted).
  app.use(
    '/assets',
    express.static(path.join(frontendDist, 'assets'), {
      immutable: true,
      maxAge: '1y',
    })
  )
  app.use(
    express.static(frontendDist, {
      // Favicons and other unhashed public/ files: short cache, revalidated.
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache')
        }
      },
    })
  )
}

// CORS configuration
// Allow requests from web frontend and mobile app
const corsOriginsFromEnv = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : []
// CORS_ORIGIN (singular) may also be a comma-separated list — split it too so a
// value like "https://pugmarkhr.com,http://pugmarkhr.com" matches each origin
// instead of being treated as one literal string.
const corsOriginSingular = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
const allowedOrigins = [
  ...corsOriginSingular,
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  // Production site — hardcoded so login works regardless of the .env value.
  'https://pugmarkhr.com',
  'http://pugmarkhr.com',
  'https://www.pugmarkhr.com',
  'http://www.pugmarkhr.com',
  /^https?:\/\/([a-zA-Z0-9-]+\.)?pugmarkhr\.com$/, // any pugmarkhr.com (sub)domain, http/https
  'https://hrm.meka.com',
  'https://www.hrm.meka.com',
  'https://hrms.meka.com',
  'https://www.hrms.meka.com',
  /^https:\/\/[a-zA-Z0-9-]+\.meka\.com$/, // *.meka.com subdomains
  'exp://localhost:8081', // Expo dev server
  /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Expo on local network
  /^http:\/\/10\.0\.2\.2:5000$/, // Android emulator
  /^http:\/\/localhost:5000$/, // iOS simulator
  ...corsOriginsFromEnv,
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true)
      
      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin
        }
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin)
        }
        return false
      })
      
      if (isAllowed) {
        callback(null, true)
      } else {
        // In development, allow all origins for mobile testing
        if (process.env.NODE_ENV === 'development') {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-HTTP-Method-Override'],
  })
)

// HTTP method override.
// The cPanel Apache in front of this app rejects PUT/PATCH/DELETE with a 403
// before they ever reach Node (only GET/POST get proxied through). The frontend
// therefore sends those as POST + `X-HTTP-Method-Override: PUT|PATCH|DELETE`,
// and we restore the real method here — before any route is matched.
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const override = String(req.headers['x-http-method-override'] || '').toUpperCase()
    if (['PUT', 'PATCH', 'DELETE'].includes(override)) {
      req.method = override
    }
  }
  next()
})

/**
 * Rate limiting.
 *
 * Two tiers, because one number cannot serve both purposes. The dashboard is a
 * SPA: a single page load fans out into a dozen API calls, and several screens
 * poll on a timer, so a real user legitimately makes hundreds of requests in a
 * sitting. Meanwhile everyone in the office arrives from one NAT address and
 * shares a bucket. A budget tight enough to stop password guessing therefore
 * locks out ordinary use — which is exactly what happened: a 100-per-15-minutes
 * setting left ~6 requests a minute for the whole office and users hit "Too many
 * requests" on the login screen before they could sign in.
 *
 * So: a generous ceiling on /api/ that only a runaway client would reach, and a
 * strict one on the credential endpoints where brute force actually applies.
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 3000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production', // skip in dev to avoid 429
})

/**
 * Credential endpoints. Counts only FAILED attempts (skipSuccessfulRequests), so
 * a shared office IP is never penalised for people simply signing in — the
 * budget is spent exclusively on wrong passwords.
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 30,
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again in a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV !== 'production',
})

app.use('/api/', limiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)
app.use('/api/auth/request-otp', authLimiter)
app.use('/api/auth/verify-otp', authLimiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files - storage (images/paths in DB) and uploads (legacy)
app.use('/storage', express.static(path.join(__dirname, 'storage'), { maxAge: '7d' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }))

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  })
})

// Biometric device push (eSSL AIFace Orcus / ZKTeco ADMS).
// Mounted OUTSIDE /api so the rate limiter does not throttle the terminal, and
// before the JSON-based routes because it attaches its own text body parser.
app.use('/iclock', iclockRoutes)
// eBioServerNew Web Hook — UNAUTHENTICATED push receiver (see routes file).
app.use('/ebio-hook', require('./routes/ebioWebhookRoutes'))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/offices', officeRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/users', userRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/salary', salaryRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/dar', darRoutes)
app.use('/api/reimbursements', reimbursementRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/extra-earnings', extraEarningsRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/letters', letterRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/notices', require('./routes/noticeRoutes'))
app.use('/api/ebio', require('./routes/ebioRoutes'))

// Admin notification middleware for all API routes
app.use('/api', adminNotification)

// In production, serve frontend for all non-API routes (SPA fallback)
if (isProduction) {
  const frontendDist = path.join(__dirname, '..', 'dist')
  app.get('*', (req, res, next) => {
    // Only serve index.html for non-API, non-static routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/storage/') || req.path.startsWith('/uploads/')) {
      return next()
    }
    // Same reasoning as the static handler above: the SPA shell must never be
    // cached, or a deploy leaves returning users on a stale asset manifest.
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

// 404 handler (only hits for /api/* routes in production)
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

// Helpers for dialect-agnostic table/column checks (MySQL + SQLite)
const queryInterface = () => sequelize.getQueryInterface()
const hasTable = async (tableName) => {
  const tables = await queryInterface().showAllTables()
  const names = Array.isArray(tables)
    ? tables.map((t) => (typeof t === 'string' ? t : Object.values(t)[0]))
    : []
  return names.some((t) => String(t).toLowerCase() === tableName.toLowerCase())
}
const hasColumn = async (tableName, columnName) => {
  try {
    const desc = await queryInterface().describeTable(tableName)
    return Object.keys(desc || {}).some(
      (k) => k.toLowerCase() === columnName.toLowerCase()
    )
  } catch {
    return false
  }
}

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB()

    // Ensure reimbursement tables exist (create if missing)
    try {
      if (!(await hasTable('reimbursement_requests'))) {
        const reimbursementMigration = require('./migrations/20260207000001-create-reimbursement-tables.js')
        const { Sequelize } = require('sequelize')
        await reimbursementMigration.up(queryInterface(), Sequelize)
        logger.info('✅ Reimbursement tables created')
      }
    } catch (err) {
      logger.warn('Reimbursement tables check/create:', err.message)
    }

    // Ensure notices tables exist (Important Notice feature). sync() with no
    // options is CREATE TABLE IF NOT EXISTS — safe/idempotent, never alters.
    try {
      const { Notice, NoticeRecipient } = require('./models')
      await Notice.sync()
      await NoticeRecipient.sync()
      logger.info('✅ Notices tables ready')
    } catch (err) {
      logger.warn('Notices tables check/create:', err.message)
    }

    // Ensure the leave balance adjustments table exists (HR credits/debits on
    // the Leave Balance page). sync() with no options is CREATE TABLE IF NOT
    // EXISTS — safe/idempotent, never alters.
    try {
      const { LeaveBalanceAdjustment } = require('./models')
      await LeaveBalanceAdjustment.sync()
      logger.info('✅ Leave balance adjustments table ready')
    } catch (err) {
      logger.warn('Leave balance adjustments table check/create:', err.message)
    }

    // Ensure the login OTP table exists (passwordless web sign-in).
    try {
      const { LoginOtp } = require('./models')
      await LoginOtp.sync()
      logger.info('✅ Login OTP table ready')
    } catch (err) {
      logger.warn('Login OTP table check/create:', err.message)
    }

    // Ensure reporting_manager_id column exists on users (for "Report To" person name)
    try {
      if (!(await hasColumn('users', 'reporting_manager_id'))) {
        const reportingManagerMigration = require('./migrations/20260206000001-add-reporting-manager-to-users.js')
        const { Sequelize } = require('sequelize')
        await reportingManagerMigration.up(queryInterface(), Sequelize)
        logger.info('✅ reporting_manager_id column added to users')
      }
    } catch (err) {
      logger.warn('Reporting manager column check:', err.message)
    }

    // Ensure leaves table exists (for leave approval by reporting person / admin)
    try {
      if (!(await hasTable('leaves'))) {
        const leaveMigration = require('./migrations/20260208000001-create-leaves.js')
        const { Sequelize } = require('sequelize')
        await leaveMigration.up(queryInterface(), Sequelize)
        logger.info('✅ Leaves table created')
      }
      // Ensure hr_head_id exists (users + leaves for two-step leave approval)
      if (await hasTable('users') && !(await hasColumn('users', 'hr_head_id'))) {
        await sequelize.query('ALTER TABLE users ADD COLUMN hr_head_id INT NULL')
        logger.info('✅ Added hr_head_id to users table')
      }
      if (await hasTable('users') && !(await hasColumn('users', 'punch_in_latitude'))) {
        await sequelize.query('ALTER TABLE users ADD COLUMN punch_in_latitude DECIMAL(10,8) NULL')
        await sequelize.query('ALTER TABLE users ADD COLUMN punch_in_longitude DECIMAL(11,8) NULL')
        await sequelize.query('ALTER TABLE users ADD COLUMN punch_in_radius INT NULL DEFAULT 100')
        logger.info('✅ Added punch_in_latitude/longitude/radius to users table')
      }
      if (await hasTable('leaves') && !(await hasColumn('leaves', 'hr_head_id'))) {
        await sequelize.query('ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL')
        await sequelize.query('ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL')
        await sequelize.query('ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL')
        logger.info('✅ Added hr_head_id and related columns to leaves table')
      }
      // attendance_records.source — distinguishes biometric-derived rows from
      // manual admin punches so the biometric sync stays idempotent.
      if (await hasTable('attendance_records') && !(await hasColumn('attendance_records', 'source'))) {
        await sequelize.query(
          "ALTER TABLE attendance_records ADD COLUMN source VARCHAR(16) NOT NULL DEFAULT 'manual'"
        )
        logger.info('✅ Added source column to attendance_records table')
      }
      // companies.employee_code_prefix — per-company prefix for auto-generated
      // employee codes (e.g. AMPL -> AMPL1, AMPL2).
      if (await hasTable('companies') && !(await hasColumn('companies', 'employee_code_prefix'))) {
        await sequelize.query('ALTER TABLE companies ADD COLUMN employee_code_prefix VARCHAR(16) NULL')
        logger.info('✅ Added employee_code_prefix column to companies table')
      }
      // users.monthly_tds — manual monthly TDS entered on the salary structure.
      // TDS cannot be derived from CTC alone (it depends on the employee's
      // declarations and regime), so it is captured by hand per employee.
      if (await hasTable('users') && !(await hasColumn('users', 'monthly_tds'))) {
        await sequelize.query(
          'ALTER TABLE users ADD COLUMN monthly_tds DECIMAL(12,2) NOT NULL DEFAULT 0'
        )
        logger.info('✅ Added monthly_tds column to users table')
      }
    } catch (err) {
      logger.warn('Leaves table check:', err.message)
    }

    // Ensure attendance_requests table exists (for Late Mark / Absent Regularization approval)
    try {
      if (!(await hasTable('attendance_requests'))) {
        const attendanceRequestsMigration = require('./migrations/20260209000001-create-attendance-requests.js')
        const { Sequelize } = require('sequelize')
        await attendanceRequestsMigration.up(queryInterface(), Sequelize)
        logger.info('✅ Attendance requests table created')
      }
      // Add check_out column if missing
      const [cols] = await sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_requests' AND COLUMN_NAME = 'check_out'"
      )
      if (cols.length === 0) {
        await sequelize.query('ALTER TABLE attendance_requests ADD COLUMN check_out VARCHAR(32) NULL')
        logger.info('✅ Added check_out to attendance_requests')
      }
      // approval_note — mandatory note the approver records when regularizing
      // a day, so every approved regulation carries a written justification.
      const [noteCols] = await sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_requests' AND COLUMN_NAME = 'approval_note'"
      )
      if (noteCols.length === 0) {
        await sequelize.query('ALTER TABLE attendance_requests ADD COLUMN approval_note TEXT NULL')
        logger.info('✅ Added approval_note to attendance_requests')
      }
    } catch (err) {
      logger.warn('Attendance requests table check:', err.message)
    }

    // Ensure dars table exists (for Daily Activity Reports)
    try {
      if (!(await hasTable('dars'))) {
        const darMigration = require('./migrations/20260209000002-create-dars.js')
        const { Sequelize } = require('sequelize')
        await darMigration.up(queryInterface(), Sequelize)
        logger.info('✅ DAR table created')
      }
    } catch (err) {
      logger.warn('DAR table check:', err.message)
    }

    // Ensure dar_projects table exists (project master for DAR)
    try {
      if (!(await hasTable('dar_projects'))) {
        const darProjectsMigration = require('./migrations/20260209000003-create-dar-projects.js')
        const { Sequelize } = require('sequelize')
        await darProjectsMigration.up(queryInterface(), Sequelize)
        logger.info('✅ DAR projects table created')
      }
    } catch (err) {
      logger.warn('DAR projects table check:', err.message)
    }

    // Ensure dar_clients table exists (client master for DAR/timesheet)
    try {
      if (!(await hasTable('dar_clients'))) {
        const darClientsMigration = require('./migrations/20260209000004-create-dar-clients.js')
        const { Sequelize } = require('sequelize')
        await darClientsMigration.up(queryInterface(), Sequelize)
        logger.info('✅ DAR clients table created')
      }
    } catch (err) {
      logger.warn('DAR clients table check:', err.message)
    }

    // Ensure role_permissions table exists (Access Control Manager)
    try {
      if (!(await hasTable('role_permissions'))) {
        const rolePermMigration = require('./migrations/20260210000005-create-role-permissions.js')
        const { Sequelize } = require('sequelize')
        await rolePermMigration.up(queryInterface(), Sequelize)
        logger.info('✅ role_permissions table created')
      }
    } catch (err) {
      logger.warn('role_permissions table check:', err.message)
    }

    // Ensure extra_earnings_deductions table exists
    try {
      if (!(await hasTable('extra_earnings_deductions'))) {
        const extraEarningsMigration = require('./migrations/20260210000006-create-extra-earnings-deductions.js')
        const { Sequelize } = require('sequelize')
        await extraEarningsMigration.up(queryInterface(), Sequelize)
        logger.info('✅ extra_earnings_deductions table created')
      }
    } catch (err) {
      logger.warn('Extra earnings table check:', err.message)
    }

    // Ensure invoice_employees + employee_invoices tables exist (daily-wage
    // workers and contractors who are not registered as HRMS users)
    try {
      if (!(await hasTable('invoice_employees')) || !(await hasTable('employee_invoices'))) {
        const invoicesMigration = require('./migrations/20260819000001-create-employee-invoices.js')
        const { Sequelize } = require('sequelize')
        await invoicesMigration.up(queryInterface(), Sequelize)
        logger.info('✅ invoice_employees + employee_invoices tables created')
      }
      // employee_invoices.company_id — which of our companies the invoice is
      // billed to. Nullable: invoices raised before this column existed keep
      // the hardcoded bill-to block the PDF has always printed.
      if (
        (await hasTable('employee_invoices')) &&
        !(await hasColumn('employee_invoices', 'company_id'))
      ) {
        await sequelize.query('ALTER TABLE employee_invoices ADD COLUMN company_id INT NULL')
        logger.info('✅ Added company_id column to employee_invoices table')
      }
    } catch (err) {
      logger.warn('Invoice employees table check:', err.message)
    }

    // Ensure salary_heads table exists
    try {
      if (!(await hasTable('salary_heads'))) {
        const salaryHeadsMigration = require('./migrations/20260210000007-create-salary-heads.js')
        const { Sequelize } = require('sequelize')
        await salaryHeadsMigration.up(queryInterface(), Sequelize)
        logger.info('✅ salary_heads table created')
      }
    } catch (err) {
      logger.warn('Salary heads table check:', err.message)
    }

    // Ensure salary_structures table exists
    try {
      if (!(await hasTable('salary_structures'))) {
        const salaryStructuresMigration = require('./migrations/20260310000001-create-salary-structures.js')
        const { Sequelize } = require('sequelize')
        await salaryStructuresMigration.up(queryInterface(), Sequelize)
        logger.info('✅ salary_structures table created')
      }
    } catch (err) {
      logger.warn('Salary structures table check:', err.message)
    }

    // Ensure roles and departments tables exist (Settings master data)
    try {
      if (!(await hasTable('roles'))) {
        const rolesDeptMigration = require('./migrations/20260224000001-create-roles-and-departments.js')
        const { Sequelize } = require('sequelize')
        await rolesDeptMigration.up(queryInterface(), Sequelize)
        logger.info('✅ roles and departments tables created')
      } else if (await hasColumn('roles', 'code')) {
        // Tables exist with old schema - run alter to keep only name
        const alterMigration = require('./migrations/20260224000002-alter-roles-departments-name-only.js')
        const { Sequelize } = require('sequelize')
        await alterMigration.up(queryInterface(), Sequelize)
        logger.info('✅ roles and departments tables simplified to name only')
      }
    } catch (err) {
      logger.warn('Roles/departments tables check:', err.message)
    }

    // Seed default roles if table is empty
    try {
      if (await hasTable('roles')) {
        const [rows] = await sequelize.query('SELECT COUNT(*) as cnt FROM roles')
        const count = rows?.[0]?.cnt ?? 0
        if (count === 0) {
          await sequelize.query(
            "INSERT INTO roles (name, created_at, updated_at) VALUES ('EMPLOYEE', NOW(), NOW()), ('MANAGER', NOW(), NOW()), ('HR', NOW(), NOW()), ('HEAD_HR', NOW(), NOW()), ('HOD', NOW(), NOW()), ('ADMIN', NOW(), NOW())"
          )
          logger.info('✅ Default roles seeded')
        }
      }
    } catch (err) {
      logger.warn('Roles seed check:', err.message)
    }

    // Seed default salary structures if table is empty
    try {
      if (await hasTable('salary_structures')) {
        const [rows] = await sequelize.query('SELECT COUNT(*) as cnt FROM salary_structures')
        const count = rows?.[0]?.cnt ?? 0
        if (count === 0) {
          await sequelize.query(`
            INSERT INTO salary_structures (name, total_earnings, total_deductions, total_salary, status, created_at, updated_at) VALUES
            ('HO Staff', 182000, 2000, 2184000, 'Published', NOW(), NOW()),
            ('Nerav Salary', 433333, 200, 5199996, 'Published', NOW(), NOW()),
            ('Consultant', 150000, 0, 1800000, 'Published', NOW(), NOW()),
            ('Standard Structure', 120000, 0, 1440000, 'Published', NOW(), NOW())
          `)
          logger.info('✅ Default salary structures seeded')
        }
      }
    } catch (err) {
      logger.warn('Salary structures seed check:', err.message)
    }

    // Ensure attendance_logs table + users.device_pin exist (eSSL biometric push)
    try {
      if (!(await hasTable('attendance_logs')) || !(await hasColumn('users', 'device_pin'))) {
        const attendanceLogsMigration = require('./migrations/20260721000001-create-attendance-logs.js')
        const { Sequelize } = require('sequelize')
        await attendanceLogsMigration.up(queryInterface(), Sequelize)
        logger.info('✅ attendance_logs table / users.device_pin created')
      }
    } catch (err) {
      logger.warn('Attendance logs table check:', err.message)
    }

    // Ensure payrolls carries the salary-structure breakup columns. Payroll
    // stores the structure (from utils/salaryStructure.js) prorated by
    // attendance, so a payslip always reflects what was actually paid.
    try {
      if (await hasTable('payrolls')) {
        const structureColumns = {
          pf_enabled: 'TINYINT(1) NOT NULL DEFAULT 0',
          basic: 'DECIMAL(12,2) NULL',
          hra: 'DECIMAL(12,2) NULL',
          special_allowance: 'DECIMAL(12,2) NULL',
          cca: 'DECIMAL(12,2) NULL',
          conveyance: 'DECIMAL(12,2) NULL',
          education: 'DECIMAL(12,2) NULL',
          bonus: 'DECIMAL(12,2) NULL',
          gross_earned: 'DECIMAL(12,2) NULL',
          employee_pf: 'DECIMAL(12,2) NULL',
          employer_pf: 'DECIMAL(12,2) NULL',
          professional_tax: 'DECIMAL(12,2) NULL',
          tds: 'DECIMAL(12,2) NULL DEFAULT 0',
          gratuity: 'DECIMAL(12,2) NULL',
          total_deductions: 'DECIMAL(12,2) NULL',
          net_payable: 'DECIMAL(12,2) NULL',
        }
        const added = []
        for (const [column, definition] of Object.entries(structureColumns)) {
          if (!(await hasColumn('payrolls', column))) {
            await sequelize.query(`ALTER TABLE payrolls ADD COLUMN ${column} ${definition}`)
            added.push(column)
          }
        }
        if (added.length > 0) {
          logger.info(`✅ Added salary structure columns to payrolls: ${added.join(', ')}`)
        }
      }
    } catch (err) {
      logger.warn('Payrolls salary structure columns check:', err.message)
    }

    // Announce whether /iclock is IP-restricted (see ICLOCK_ALLOWED_IPS in .env)
    require('./middleware/iclockIpFilter').logIclockIpPolicy()

    // Start payroll scheduler
    payrollScheduler.start()

    // Start eBioServerNew auto-poller (no-op unless EBIO_ENABLED + EBIO_POLL_MINUTES set)
    try {
      require('./services/ebioServerService').startPoller()
    } catch (e) {
      logger.warn(`[ebio] poller not started: ${e.message}`)
    }
    // Start biometric CSV auto-importer (no-op unless EBIO_CSV_POLL_MINUTES set)
    try {
      require('./services/biometricCsvImporter').startPoller()
    } catch (e) {
      logger.warn(`[csv] importer not started: ${e.message}`)
    }

    // Initialize Socket.IO server
    const { initializeSocketServer } = require('./socket/socketServer')
    const io = initializeSocketServer(httpServer)
    // Make io available to middleware via app
    app.set('io', io)
    logger.info('✅ Socket.IO server initialized')

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`💬 Socket.IO ready for real-time chat`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`)
  httpServer.close(() => {
    logger.info('HTTP server closed')
    sequelize.close().then(() => {
      logger.info('Database connection closed')
      process.exit(0)
    })
  })
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

startServer()

module.exports = app
