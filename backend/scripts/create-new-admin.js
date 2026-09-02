const { User } = require('../models')
const { connectDB } = require('../config/database')
require('dotenv').config()

/**
 * Script to create a new admin user
 * 
 * Usage:
 *   node scripts/create-new-admin.js
 *   node scripts/create-new-admin.js --name "Admin Name" --email "admin@example.com" --password "password123"
 * 
 * Or set environment variables:
 *   ADMIN_NAME="Admin Name" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="password123" node scripts/create-new-admin.js
 */
async function createNewAdmin() {
  try {
    await connectDB()

    // Get credentials from command line arguments or environment variables
    const args = process.argv.slice(2)
    const getArg = (flag) => {
      const index = args.indexOf(flag)
      return index !== -1 && args[index + 1] ? args[index + 1] : null
    }

    const name = getArg('--name') || process.env.ADMIN_NAME || 'Admin User'
    const email = getArg('--email') || process.env.ADMIN_EMAIL || `admin${Date.now()}@hrms.com`
    const password = getArg('--password') || process.env.ADMIN_PASSWORD || 'Admin@123'
    const employeeCode = getArg('--code') || process.env.ADMIN_CODE || `ADMIN${Date.now().toString().slice(-6)}`
    const department = getArg('--department') || process.env.ADMIN_DEPARTMENT || 'Administration'
    const designation = getArg('--designation') || process.env.ADMIN_DESIGNATION || 'System Administrator'

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format!')
      process.exit(1)
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email },
    })

    if (existingUser) {
      console.log(`❌ User with email "${email}" already exists!`)
      console.log('💡 Use a different email address.')
      process.exit(1)
    }

    // Check if employee code already exists
    const existingCode = await User.findOne({
      where: { employeeCode },
    })

    if (existingCode) {
      console.log(`❌ Employee Code "${employeeCode}" already exists!`)
      console.log('💡 Use a different employee code.')
      process.exit(1)
    }

    // Create admin user
    const adminData = {
      email,
      password,
      name,
      role: 'ADMIN',
      employeeCode,
      department,
      designation,
      isActive: true,
    }

    const admin = await User.create(adminData)

    console.log('\n✅ Admin user created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Admin Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Name:        ${admin.name}`)
    console.log(`Email:       ${admin.email}`)
    console.log(`Password:    ${password}`)
    console.log(`Role:        ${admin.role}`)
    console.log(`Employee ID: ${admin.employeeCode}`)
    console.log(`Department:  ${admin.department}`)
    console.log(`Designation: ${admin.designation}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 Please save these credentials securely!')
    console.log('\n📝 Usage Examples:')
    console.log('   Login with: Email and Password above')
    console.log('   Or create another admin:')
    console.log('   node scripts/create-new-admin.js --name "John Doe" --email "john@hrms.com" --password "SecurePass123"')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    if (error.errors) {
      error.errors.forEach((err) => {
        console.error(`   - ${err.message}`)
      })
    }
    process.exit(1)
  }
}

createNewAdmin()
