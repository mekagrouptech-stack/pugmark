const { User } = require('../models')
const { connectDB } = require('../config/database')
require('dotenv').config()

/**
 * Script to create login credentials for all user types
 * 
 * Usage: node scripts/create-all-user-types.js
 */
async function createAllUserTypes() {
  try {
    await connectDB()
    console.log('🔐 Creating Users for All User Types\n')

    const userTypes = [
      {
        name: 'System Administrator',
        email: 'admin@hrms.com',
        password: 'Admin@123',
        role: 'ADMIN',
        employeeCode: 'ADMIN001',
        department: 'Administration',
        designation: 'System Administrator',
      },
      {
        name: 'Head HR',
        email: 'headhr@hrms.com',
        password: 'HeadHR@123',
        role: 'HEAD_HR',
        employeeCode: 'HEADHR001',
        department: 'Human Resources',
        designation: 'Head of Human Resources',
      },
      {
        name: 'HR Manager',
        email: 'hr@hrms.com',
        password: 'HR@123',
        role: 'HR',
        employeeCode: 'HR001',
        department: 'Human Resources',
        designation: 'HR Manager',
      },
      {
        name: 'Department Head',
        email: 'hod@hrms.com',
        password: 'HOD@123',
        role: 'HOD',
        employeeCode: 'HOD001',
        department: 'IT',
        designation: 'Head of Department',
      },
      {
        name: 'Team Manager',
        email: 'manager@hrms.com',
        password: 'Manager@123',
        role: 'MANAGER',
        employeeCode: 'MGR001',
        department: 'IT',
        designation: 'Project Manager',
      },
      {
        name: 'John Employee',
        email: 'employee@hrms.com',
        password: 'Employee@123',
        role: 'EMPLOYEE',
        employeeCode: 'EMP001',
        department: 'IT',
        designation: 'Software Developer',
      },
    ]

    const createdUsers = []
    const existingUsers = []

    for (const userData of userTypes) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          where: { email: userData.email },
        })

        if (existingUser) {
          console.log(`⚠️  User already exists: ${userData.email}`)
          existingUsers.push({
            ...userData,
            existing: true,
          })
          continue
        }

        // Check if employee code exists
        const existingCode = await User.findOne({
          where: { employeeCode: userData.employeeCode },
        })

        if (existingCode) {
          // Generate unique employee code
          userData.employeeCode = `${userData.role}${Date.now().toString().slice(-6)}`
        }

        // Create user
        const user = await User.create({
          ...userData,
          isActive: true,
        })

        createdUsers.push(userData)
        console.log(`✅ Created: ${userData.role} - ${userData.email}`)
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message)
      }
    }

    // Display summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 LOGIN CREDENTIALS SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (createdUsers.length > 0) {
      console.log('✅ NEWLY CREATED USERS:\n')
      createdUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.role}`)
        console.log(`   Email:    ${user.email}`)
        console.log(`   Password: ${user.password}`)
        console.log(`   Name:     ${user.name}`)
        console.log(`   Code:     ${user.employeeCode}`)
        console.log('')
      })
    }

    if (existingUsers.length > 0) {
      console.log('⚠️  EXISTING USERS (Already in database):\n')
      existingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.role}`)
        console.log(`   Email:    ${user.email}`)
        console.log(`   Password: ${user.password} (if you remember it)`)
        console.log(`   Name:     ${user.name}`)
        console.log('')
      })
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 Use these credentials to login at: http://localhost:3000/login')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating users:', error.message)
    if (error.errors) {
      error.errors.forEach((err) => {
        console.error(`   - ${err.message}`)
      })
    }
    process.exit(1)
  }
}

createAllUserTypes()
