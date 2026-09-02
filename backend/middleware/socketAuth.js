const jwt = require('jsonwebtoken')
const { User } = require('../models')
const logger = require('../utils/logger')

/**
 * Authenticate Socket.IO connection using JWT token
 * @param {Socket} socket - Socket.IO socket instance
 * @returns {Promise<Object|null>} User object or null
 */
async function authenticateSocket(socket) {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token

    if (!token) {
      logger.warn('Socket connection attempt without token')
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // Fetch user from database
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'employeeCode', 'isActive'],
    })

    if (!user || !user.isActive) {
      logger.warn(`Socket authentication failed: User ${decoded.id} not found or inactive`)
      return null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeCode: user.employeeCode,
    }
  } catch (error) {
    logger.error('Socket authentication error:', error.message)
    return null
  }
}

module.exports = { authenticateSocket }
