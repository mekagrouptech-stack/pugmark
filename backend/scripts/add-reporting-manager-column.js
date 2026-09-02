/**
 * One-time script to add reporting_manager_id to users table.
 * Run: node scripts/add-reporting-manager-column.js
 */
require('dotenv').config()
const { sequelize } = require('../config/database')

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to database.')

    const queryInterface = sequelize.getQueryInterface()
    const Sequelize = require('sequelize')

    // Check if column already exists
    const tableDesc = await queryInterface.describeTable('users')
    if (tableDesc.reporting_manager_id) {
      console.log('Column reporting_manager_id already exists. Nothing to do.')
      process.exit(0)
      return
    }

    await queryInterface.addColumn('users', 'reporting_manager_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    console.log('Added column reporting_manager_id to users.')

    await queryInterface.addIndex('users', ['reporting_manager_id'], {
      name: 'idx_users_reporting_manager_id',
    })
    console.log('Added index idx_users_reporting_manager_id.')

    console.log('Done. You can restart the backend and login again.')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
