/**
 * Development Server Starter
 * Runs both frontend and backend servers simultaneously
 * 
 * Usage: node start-dev.js
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting HRMS Development Servers...\n')

// Start Backend
console.log('📦 Starting Backend Server (Port 3001)...')
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit',
})

// Start Frontend
console.log('⚛️  Starting Frontend Server (Port 3000)...')
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit',
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down servers...')
  backend.kill()
  frontend.kill()
  process.exit()
})

process.on('SIGTERM', () => {
  backend.kill()
  frontend.kill()
  process.exit()
})

backend.on('error', (error) => {
  console.error('❌ Backend error:', error)
})

frontend.on('error', (error) => {
  console.error('❌ Frontend error:', error)
})

console.log('\n✅ Both servers are starting...')
console.log('💡 Press Ctrl+C to stop both servers\n')
