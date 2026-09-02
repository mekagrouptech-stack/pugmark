const mysql = require('mysql2/promise')
require('dotenv').config()

/**
 * Script to create the database if it doesn't exist
 * Usage: node scripts/create-database.js
 */
async function createDatabase() {
  try {
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    })

    const databaseName = process.env.DB_NAME || 'hrms_db'

    console.log(`📦 Creating database: ${databaseName}...`)

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)

    console.log(`✅ Database '${databaseName}' created successfully!`)

    await connection.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating database:', error.message)
    process.exit(1)
  }
}

createDatabase()
