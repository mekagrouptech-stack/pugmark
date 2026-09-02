const { User } = require('../models')
const { connectDB } = require('../config/database')
require('dotenv').config()

/**
 * Script to create multiple users for each role type
 * Creates 5 users for each role: ADMIN, HR, HEAD_HR, HOD, MANAGER, EMPLOYEE
 * 
 * Usage: node scripts/create-multiple-users.js
 * 
 * To change the number of users per role, modify the USERS_PER_ROLE constant
 */

const USERS_PER_ROLE = 5

// Role configurations
const roleConfigs = {
  ADMIN: {
    prefix: 'ADMIN',
    department: 'Administration',
    designations: ['System Administrator', 'IT Administrator', 'Database Administrator', 'Network Administrator', 'Security Administrator'],
    passwordPrefix: 'Admin@',
  },
  HEAD_HR: {
    prefix: 'HEADHR',
    department: 'Human Resources',
    designations: ['Head of Human Resources', 'Senior HR Director', 'HR Operations Head', 'Talent Acquisition Head', 'HR Strategy Head'],
    passwordPrefix: 'HeadHR@',
  },
  HR: {
    prefix: 'HR',
    department: 'Human Resources',
    designations: ['HR Manager', 'HR Executive', 'HR Specialist', 'Recruitment Manager', 'HR Coordinator'],
    passwordPrefix: 'HR@',
  },
  HOD: {
    prefix: 'HOD',
    department: 'IT',
    designations: ['Head of Department - IT', 'Head of Department - Finance', 'Head of Department - Sales', 'Head of Department - Marketing', 'Head of Department - Operations'],
    passwordPrefix: 'HOD@',
  },
  MANAGER: {
    prefix: 'MGR',
    department: 'IT',
    designations: ['Project Manager', 'Team Manager', 'Product Manager', 'Operations Manager', 'Development Manager'],
    passwordPrefix: 'Manager@',
  },
  EMPLOYEE: {
    prefix: 'EMP',
    department: 'IT',
    designations: ['Software Developer', 'Frontend Developer', 'Backend Developer', 'QA Engineer', 'DevOps Engineer'],
    passwordPrefix: 'Employee@',
  },
}

// Generate names for users
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Amanda']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']

function generateRandomName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

async function createMultipleUsers() {
  try {
    await connectDB()
    console.log('🔐 Creating Multiple Users for Each Role Type\n')
    console.log(`📊 Creating ${USERS_PER_ROLE} users for each role...\n`)

    const createdUsers = []
    const existingUsers = []
    const errors = []

    // Process each role
    for (const [role, config] of Object.entries(roleConfigs)) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`👥 Creating ${USERS_PER_ROLE} users for role: ${role}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      for (let i = 1; i <= USERS_PER_ROLE; i++) {
        const name = generateRandomName()
        const email = `${config.prefix.toLowerCase()}${i}@hrms.com`
        const password = `${config.passwordPrefix}${i}23`
        const employeeCode = `${config.prefix}${String(i).padStart(3, '0')}`
        const designation = config.designations[i - 1] || `${config.designations[0]} ${i}`

        const userData = {
          name,
          email,
          password,
          role,
          employeeCode,
          department: config.department,
          designation,
          isActive: true,
        }

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
            userData.employeeCode = `${config.prefix}${Date.now().toString().slice(-6)}${i}`
          }

          // Create user
          const user = await User.create(userData)

          createdUsers.push({
            ...userData,
            id: user.id,
          })
          console.log(`✅ Created: ${userData.role} - ${userData.email} (${userData.name})`)
        } catch (error) {
          const errorMsg = `❌ Error creating ${userData.email}: ${error.message}`
          console.error(errorMsg)
          errors.push({
            ...userData,
            error: error.message,
          })
        }
      }
    }

    // Display summary
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 CREATION SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Group by role
    const usersByRole = {}
    createdUsers.forEach((user) => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = []
      }
      usersByRole[user.role].push(user)
    })

    if (createdUsers.length > 0) {
      console.log('✅ NEWLY CREATED USERS:\n')
      Object.entries(usersByRole).forEach(([role, users]) => {
        console.log(`\n📌 ${role} (${users.length} users):`)
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name}`)
          console.log(`      Email:    ${user.email}`)
          console.log(`      Password: ${user.password}`)
          console.log(`      Code:     ${user.employeeCode}`)
          console.log(`      Dept:     ${user.department}`)
          console.log(`      Designation: ${user.designation}`)
        })
      })
    }

    if (existingUsers.length > 0) {
      console.log('\n\n⚠️  EXISTING USERS (Already in database):\n')
      const existingByRole = {}
      existingUsers.forEach((user) => {
        if (!existingByRole[user.role]) {
          existingByRole[user.role] = []
        }
        existingByRole[user.role].push(user)
      })

      Object.entries(existingByRole).forEach(([role, users]) => {
        console.log(`\n📌 ${role} (${users.length} users):`)
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} - ${user.name}`)
        })
      })
    }

    if (errors.length > 0) {
      console.log('\n\n❌ ERRORS:\n')
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.email}: ${error.error}`)
      })
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📊 Total Created: ${createdUsers.length} users`)
    console.log(`⚠️  Already Existed: ${existingUsers.length} users`)
    console.log(`❌ Errors: ${errors.length} users`)
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

createMultipleUsers()
