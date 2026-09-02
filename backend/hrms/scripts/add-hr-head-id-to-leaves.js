/**
 * Add hr_head_id and related columns to leaves table if they don't exist.
 * Fixes: "Unknown column 'hr_head_id' in 'field list'"
 *
 * Run:
 *   npm run db:fix-leaves              (development DB)
 *   NODE_ENV=production npm run db:fix-leaves   (production DB - ensure .env has DB credentials)
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { Sequelize } = require('sequelize')

// Use same config as server (config/database.js)
const env = process.env.NODE_ENV || 'development'
const dbConfig = env === 'production'
  ? {
      database: process.env.DB_NAME || 'mekacom_pugmark',
      username: process.env.DB_USER || 'mekacom_pugmarkuser',
      password: process.env.DB_PASSWORD || '',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
    }
  : {
      database: process.env.DB_NAME || 'hrms_db',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
    }

console.log(`Using database: ${dbConfig.database} (${env})`)

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port || 3306,
  dialect: 'mysql',
  logging: false,
})

async function columnExists(table, column) {
  const [results] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [dbConfig.database, table, column] }
  )
  return results.length > 0
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to database')

    if (!(await columnExists('leaves', 'hr_head_id'))) {
      await sequelize.query('ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL')
      console.log('Added column leaves.hr_head_id')
    } else {
      console.log('Column leaves.hr_head_id already exists')
    }

    if (!(await columnExists('leaves', 'manager_approved_by'))) {
      await sequelize.query('ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL')
      console.log('Added column leaves.manager_approved_by')
    } else {
      console.log('Column leaves.manager_approved_by already exists')
    }

    if (!(await columnExists('leaves', 'manager_approved_at'))) {
      await sequelize.query('ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL')
      console.log('Added column leaves.manager_approved_at')
    } else {
      console.log('Column leaves.manager_approved_at already exists')
    }

    console.log('Done.')
  } catch (err) {
    console.error('Error:', err.message)
    if (err.original) console.error('SQL:', err.original.message)
    console.log('\nTo add manually, run these SQL commands on your database:')
    console.log('  ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL;')
    console.log('  ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL;')
    console.log('  ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL;')
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
