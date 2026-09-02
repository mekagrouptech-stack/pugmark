/**
 * Run this script to create reimbursement_requests and reimbursement_expense_items tables.
 * Usage: node scripts/create-reimbursement-tables.js
 * Make sure .env has correct DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { Sequelize } = require('sequelize')
const migration = require('../migrations/20260207000001-create-reimbursement-tables.js')

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrms_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
)

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to database:', process.env.DB_NAME || 'hrms_db')
    const queryInterface = sequelize.getQueryInterface()
    await migration.up(queryInterface, Sequelize)
    console.log('Done. Tables reimbursement_requests and reimbursement_expense_items created.')
  } catch (err) {
    if (err.original && err.original.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('Tables already exist. No action needed.')
      process.exit(0)
      return
    }
    if (err.message && err.message.includes('already exists')) {
      console.log('Tables already exist. No action needed.')
      process.exit(0)
      return
    }
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
