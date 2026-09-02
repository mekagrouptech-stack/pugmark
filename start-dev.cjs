/**
 * Development Server Starter
 * Runs backend, web frontend, and mobile app simultaneously
 * 
 * Usage: npm run start:all
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting HRMS Development Servers...\n')

// Start Backend
console.log('📦 Starting Backend Server (Port 5000)...')
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit',
})

// Start Web Frontend
console.log('⚛️  Starting Web Frontend Server (Port 3000)...')
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit',
})

// Start Mobile App (Expo)
console.log('📱 Starting Mobile App (Expo)...')
const mobileApp = spawn('npx', ['expo', 'start'], {
  cwd: path.join(__dirname, 'hrmsapp', 'hrms'),
  shell: true,
  stdio: 'inherit',
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all servers...')
  backend.kill()
  frontend.kill()
  mobileApp.kill()
  process.exit()
})

process.on('SIGTERM', () => {
  backend.kill()
  frontend.kill()
  mobileApp.kill()
  process.exit()
})

backend.on('error', (error) => {
  console.error('❌ Backend error:', error)
})

frontend.on('error', (error) => {
  console.error('❌ Frontend error:', error)
})

mobileApp.on('error', (error) => {
  console.error('❌ Mobile App error:', error)
})

console.log('\n✅ All servers are starting...')
console.log('💡 Press Ctrl+C to stop all servers\n')
