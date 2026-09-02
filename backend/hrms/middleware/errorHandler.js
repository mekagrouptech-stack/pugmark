const { AppError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Global Error Handler Middleware
 * Handles all errors and returns consistent API responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id,
  })

  // ValidationError from Joi/validators
  if (err.name === 'ValidationError' || err.constructor?.name === 'ValidationError') {
    const message = err.message || 'Validation Error'
    const errors = err.errors || []
    error = {
      statusCode: 400,
      message,
      errors,
    }
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = 'Validation Error'
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }))
    error = {
      statusCode: 400,
      message,
      errors,
    }
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate entry'
    error = {
      statusCode: 409,
      message,
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token',
    }
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired',
    }
  }

  // Default error
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * 404 Not Found Handler
 * Returns a generic message and silently handles common scanner/probe paths
 * (e.g. /403.shtml, /wp-login.php) to avoid reflecting user input and to keep
 * the frontend from displaying probe responses as user-facing errors.
 */
const notFoundHandler = (req, res, next) => {
  const probePattern = /\.(shtml|asp|aspx|php|cgi|jsp|env|git|bak|old|sql)(\?|$)|(wp-login|wp-admin|phpmyadmin|\.well-known)/i
  const isProbe = probePattern.test(req.originalUrl)
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    ...(isProbe && { probe: true }),
  })
}

module.exports = {
  errorHandler,
  notFoundHandler,
}
