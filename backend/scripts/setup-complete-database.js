const mysql = require('mysql2/promise')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
require('dotenv').config()

/**
 * Complete database setup script
 * Creates database, runs migrations, and optionally seeds data
 * Usage: node scripts/setup-complete-database.js
 */
async function setupCompleteDatabase() {
  try {
    console.log('🚀 Starting complete database setup...\n')

    // Step 1: Create database
    console.log('📦 Step 1: Creating database...')
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    })

    const databaseName = process.env.DB_NAME || 'hrms_db'
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log(`✅ Database '${databaseName}' created successfully!\n`)

    await connection.end()

    // Step 2: Run migrations
    console.log('🔄 Step 2: Running migrations...')
    try {
      const { stdout, stderr } = await execAsync('npm run db:migrate', {
        cwd: process.cwd(),
      })
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
      console.log('✅ Migrations completed successfully!\n')
    } catch (error) {
      console.error('❌ Migration error:', error.message)
      throw error
    }

    // Step 3: Run seeders (optional)
    console.log('🌱 Step 3: Seeding initial data...')
    try {
      const { stdout, stderr } = await execAsync('npm run db:seed', {
        cwd: process.cwd(),
      })
      if (stdout) console.log(stdout)
      if (stderr && !stderr.includes('No seeders found')) {
        console.error(stderr)
      }
      console.log('✅ Seeders completed!\n')
    } catch (error) {
      console.warn('⚠️  Seeder warning (this is optional):', error.message)
    }

    // Step 4: Create admin user
    console.log('👤 Step 4: Creating admin user...')
    try {
      const { stdout, stderr } = await execAsync('npm run create:admin', {
        cwd: process.cwd(),
      })
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
      console.log('✅ Admin user created!\n')
    } catch (error) {
      console.warn('⚠️  Admin user creation warning:', error.message)
      console.log('💡 You can create admin user manually later using: npm run create:admin\n')
    }

    console.log('🎉 Database setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Start backend server: npm run dev')
    console.log('2. Test login with admin credentials')
    console.log('3. Start frontend: npm run dev (from project root)')
    console.log('\n✅ Ready to go!')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('1. Ensure MySQL is running')
    console.error('2. Check database credentials in .env file')
    console.error('3. Verify user has CREATE DATABASE permission')
    process.exit(1)
  }
}

setupCompleteDatabase()
