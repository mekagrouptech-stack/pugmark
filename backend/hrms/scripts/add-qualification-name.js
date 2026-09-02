/**
 * Adds educational_information.qualification_name.
 *
 * Sequelize runs with sync({ alter: false }), so model changes never reach the
 * database on their own — this script is what actually creates the column.
 * Safe to re-run: it checks for the column first and exits quietly if present.
 *
 * Usage: node scripts/add-qualification-name.js
 */
require('dotenv').config()
const { sequelize } = require('../config/database')

const TABLE = 'educational_information'
const COLUMN = 'qualification_name'

;(async () => {
  try {
    await sequelize.authenticate()

    const [existing] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      { replacements: [TABLE, COLUMN] }
    )

    if (existing.length) {
      console.log(`✓ ${TABLE}.${COLUMN} already exists — nothing to do`)
      process.exit(0)
    }

    await sequelize.query(
      `ALTER TABLE \`${TABLE}\`
       ADD COLUMN \`${COLUMN}\` VARCHAR(150) NULL AFTER \`highest_qualification\``
    )

    console.log(`✓ added ${TABLE}.${COLUMN}`)
    process.exit(0)
  } catch (err) {
    console.error('✗ failed:', err.message)
    process.exit(1)
  }
})()
