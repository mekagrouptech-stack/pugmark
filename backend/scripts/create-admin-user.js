const { User } = require('../models')
const { connectDB } = require('../config/database')
require('dotenv').config()

/**
 * Script to create admin user
 * Usage: node scripts/create-admin-user.js
 */
async function createAdminUser() {
  try {
    await connectDB()

    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@hrms.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: process.env.ADMIN_NAME || 'Admin User',
      role: 'ADMIN',
      employeeCode: 'ADMIN001',
      department: 'Administration',
      designation: 'System Administrator',
      isActive: true,
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: adminData.email },
    })

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', adminData.email)
      return
    }

    // Create admin user
    const admin = await User.create(adminData)
    console.log('✅ Admin user created successfully!')
    console.log('Email:', admin.email)
    console.log('Password:', adminData.password)
    console.log('Role:', admin.role)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  }
}

createAdminUser()
