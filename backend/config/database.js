const { Sequelize } = require('sequelize')
require('dotenv').config()

const env = process.env.NODE_ENV || 'development'

const dbConfig = {
  database: process.env.DB_NAME || (env === 'production' ? 'mekacom_pugmark' : 'hrms_db'),
  username: process.env.DB_USER || (env === 'production' ? 'mekacom_pugmarkuser' : 'root'),
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
    },
    timezone: '+00:00', // UTC
  }
)

async function ensureSchemaColumns(seq) {
  const dbName = seq.config.database
  try {
    // users.hr_head_id (for HR Head assignment per user)
    const [uCols] = await seq.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'hr_head_id'`,
      { replacements: [dbName] }
    )
    if (uCols.length === 0) {
      await seq.query('ALTER TABLE users ADD COLUMN hr_head_id INT NULL')
      console.log('✅ Added hr_head_id to users table')
    }
    // users.company_email (official company email for notices / official mail)
    const [ceCols] = await seq.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'company_email'`,
      { replacements: [dbName] }
    )
    if (ceCols.length === 0) {
      await seq.query('ALTER TABLE users ADD COLUMN company_email VARCHAR(255) NULL')
      console.log('✅ Added company_email to users table')
    }
    // attendance_records columns that carry biometric punches.
    //
    // These were added to the model after the original create-attendance-records
    // migration and never got a migration of their own, so a database built from
    // migrations alone is missing them. `source` in particular is fatal but
    // silent: the biometric sync scopes every read and delete by it, so without
    // the column each sync throws "Unknown column 'source'", rolls back, and
    // every employee shows as Absent while the raw punches still display fine on
    // the Biometric Attendance page. Ensure them here rather than relying on the
    // deploy having run migrations.
    const attendanceCols = [
      ['source', "VARCHAR(16) NOT NULL DEFAULT 'manual'"],
      ['check_in_time', 'DATETIME NULL'],
      ['check_out_time', 'DATETIME NULL'],
      ['total_hours', 'DECIMAL(5,2) NULL'],
      ['status', 'VARCHAR(16) NULL'],
    ]
    for (const [column, definition] of attendanceCols) {
      const [found] = await seq.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance_records' AND COLUMN_NAME = ?`,
        { replacements: [dbName, column] }
      )
      if (found.length === 0) {
        await seq.query(`ALTER TABLE attendance_records ADD COLUMN ${column} ${definition}`)
        console.log(`✅ Added ${column} to attendance_records table`)
      }
    }

    // leaves columns (two-step leave approval)
    const [lCols] = await seq.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leaves' AND COLUMN_NAME = 'hr_head_id'`,
      { replacements: [dbName] }
    )
    if (lCols.length === 0) {
      await seq.query('ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL')
      await seq.query('ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL')
      await seq.query('ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL')
      console.log('✅ Added hr_head_id and related columns to leaves table')
    }
  } catch (e) {
    console.warn('⚠️ Could not ensure schema columns:', e.message)
  }
}

const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection established successfully')

    await ensureSchemaColumns(sequelize)

    // Sync models in development (optional - migrations are preferred)
    if (process.env.NODE_ENV === 'development' && process.env.SYNC_DB === 'true') {
      console.log('🔄 Syncing database models...')
      await sequelize.sync({ alter: false }) // Use migrations instead
    }

    return sequelize
  } catch (error) {
    console.error('❌ Unable to connect to database:', error)
    throw error
  }
}

module.exports = { sequelize, connectDB }

