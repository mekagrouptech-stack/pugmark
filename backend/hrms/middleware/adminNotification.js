const logger = require('../utils/logger')

/**
 * Admin Notification Middleware
 * Emits a Socket.IO notification to all admin/super-admin users
 * for every authenticated non-GET API action.
 */

const adminNotification = (req, res, next) => {
  // Only attach listener once per request
  if (req._adminNotificationAttached) {
    return next()
  }
  req._adminNotificationAttached = true

  const io = req.app.get('io')

  // If Socket.IO is not initialized, skip
  if (!io) {
    return next()
  }

  const startTime = Date.now()

  res.on('finish', () => {
    try {
      // We only care about non-GET actions (create/update/delete)
      if (req.method === 'GET') return

      // Require authenticated user
      if (!req.user) return

      const durationMs = Date.now() - startTime
      const userRole = String(req.user.role || '').toUpperCase()

      const notification = {
        type: 'api_action',
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        timestamp: new Date().toISOString(),
      }

      // Emit to dedicated admin notifications room
      io.to('admin_notifications').emit('admin_notification', notification)
    } catch (error) {
      logger.error('Failed to emit admin notification:', error)
    }
  })

  next()
}

module.exports = {
  adminNotification,
}

