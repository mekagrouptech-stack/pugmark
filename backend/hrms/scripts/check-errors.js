/**
 * Diagnostic script to check for common errors
 * Usage: node scripts/check-errors.js
 */
require('dotenv').config()

async function checkErrors() {
  console.log('🔍 Checking for common errors...\n')
  const errors = []

  // 1. Check environment variables
  console.log('1. Checking environment variables...')
  const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET']
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key])
  if (missingEnvVars.length > 0) {
    console.log('   ❌ Missing environment variables:', missingEnvVars.join(', '))
    errors.push('Missing environment variables')
  } else {
    console.log('   ✅ All required environment variables present')
  }

  // 2. Check database connection
  console.log('\n2. Checking database connection...')
  try {
    const { connectDB } = require('../config/database')
    await connectDB()
    console.log('   ✅ Database connection successful')
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message)
    errors.push('Database connection failed')
  }

  // 3. Check models
  console.log('\n3. Checking models...')
  try {
    const models = require('../models')
    const requiredModels = [
      'User',
      'BasicInformation',
      'PersonalInformation',
      'ContactInformation',
      'EducationalInformation',
      'EmploymentInformation',
      'Document',
    ]
    const missingModels = requiredModels.filter((model) => !models[model])
    if (missingModels.length > 0) {
      console.log('   ❌ Missing models:', missingModels.join(', '))
      errors.push('Missing models')
    } else {
      console.log('   ✅ All models loaded successfully')
    }
  } catch (error) {
    console.log('   ❌ Error loading models:', error.message)
    errors.push('Model loading failed')
  }

  // 4. Check routes
  console.log('\n4. Checking routes...')
  try {
    require('../routes/profileRoutes')
    require('../routes/authRoutes')
    require('../routes/attendanceRoutes')
    require('../routes/officeRoutes')
    console.log('   ✅ All routes loaded successfully')
  } catch (error) {
    console.log('   ❌ Error loading routes:', error.message)
    console.log('   Stack:', error.stack)
    errors.push('Route loading failed')
  }

  // 5. Check services
  console.log('\n5. Checking services...')
  try {
    require('../services/profileService')
    console.log('   ✅ Profile service loaded successfully')
  } catch (error) {
    console.log('   ❌ Error loading profile service:', error.message)
    console.log('   Stack:', error.stack)
    errors.push('Service loading failed')
  }

  // 6. Check controllers
  console.log('\n6. Checking controllers...')
  try {
    require('../controllers/profileController')
    console.log('   ✅ Profile controller loaded successfully')
  } catch (error) {
    console.log('   ❌ Error loading profile controller:', error.message)
    console.log('   Stack:', error.stack)
    errors.push('Controller loading failed')
  }

  // 7. Check uploads directory
  console.log('\n7. Checking uploads directory...')
  const fs = require('fs')
  const path = require('path')
  const uploadsDir = path.join(__dirname, '../uploads')
  const avatarsDir = path.join(uploadsDir, 'avatars')
  const documentsDir = path.join(uploadsDir, 'documents')

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log('   ✅ Created uploads directory')
    } else {
      console.log('   ✅ Uploads directory exists')
    }

    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true })
      console.log('   ✅ Created avatars directory')
    }

    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true })
      console.log('   ✅ Created documents directory')
    }
  } catch (error) {
    console.log('   ❌ Error creating uploads directory:', error.message)
    errors.push('Uploads directory creation failed')
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (errors.length === 0) {
    console.log('✅ All checks passed! No errors found.')
    console.log('💡 If you\'re still experiencing issues, please share the error message from your terminal.')
  } else {
    console.log(`❌ Found ${errors.length} error(s):`)
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`)
    })
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  process.exit(errors.length > 0 ? 1 : 0)
}

checkErrors().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
