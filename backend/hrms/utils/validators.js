const Joi = require('joi')
const { ValidationError } = require('./errors')

/**
 * Validation middleware factory
 * Creates middleware to validate request data using Joi schemas
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }))

      // Log validation errors for debugging
      console.error('Validation failed:', {
        body: req[property],
        errors: errors,
      })

      return next(new ValidationError('Validation failed', errors))
    }

    // Replace request data with validated and sanitized data
    req[property] = value
    next()
  }
}

/**
 * Joi validation schemas
 */
const schemas = {
  // Attendance punch validation
  punchAttendance: Joi.object({
    officeId: Joi.number().integer().positive().optional().allow(null).messages({
      'number.base': 'Office ID must be a number',
      'number.positive': 'Office ID must be positive',
    }),
    latitude: Joi.number().min(-90).max(90).required().messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required',
    }),
    longitude: Joi.number().min(-180).max(180).required().messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required',
    }),
    punchType: Joi.string().valid('IN', 'OUT').required().messages({
      'any.only': 'Punch type must be either IN or OUT',
      'any.required': 'Punch type is required',
    }),
    remark: Joi.string().max(500).allow('', null).optional().messages({
      'string.max': 'Remark must not exceed 500 characters',
    }),
    // Optional target user for admin/HR punching on behalf of employees
    targetUserId: Joi.number().integer().positive().optional(),
  }),

  // Update attendance validation
  updateAttendance: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required',
      }),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required',
    }),
    checkInTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .allow(null, '')
      .optional()
      .messages({
        'string.pattern.base': 'Check-in time must be in HH:mm format (24-hour)',
      }),
    checkOutTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .allow(null, '')
      .optional()
      .messages({
        'string.pattern.base': 'Check-out time must be in HH:mm format (24-hour)',
      }),
    status: Joi.string()
      .valid('Present', 'Absent', 'Late', 'Half Day')
      .allow(null, '')
      .optional()
      .messages({
        'any.only': 'Status must be one of: Present, Absent, Late, Half Day',
      }),
  }),

  // Office location query validation
  getOfficeLocation: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),

  // Office creation/update validation
  office: Joi.object({
    name: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Office name is required',
      'string.max': 'Office name must not exceed 255 characters',
      'any.required': 'Office name is required',
    }),
    country: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Country is required',
      'string.max': 'Country must not exceed 100 characters',
      'any.required': 'Country is required',
    }),
    address: Joi.string().min(1).required().messages({
      'string.min': 'Address is required',
      'any.required': 'Address is required',
    }),
    latitude: Joi.number().min(-90).max(90).required().messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required',
    }),
    longitude: Joi.number().min(-180).max(180).required().messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required',
    }),
    radius: Joi.number().integer().min(10).max(10000).default(100).messages({
      'number.base': 'Radius must be a number',
      'number.integer': 'Radius must be an integer',
      'number.min': 'Radius must be at least 10 meters',
      'number.max': 'Radius must not exceed 10000 meters',
    }),
    isActive: Joi.boolean().default(true),
    strictGeofencing: Joi.boolean().default(true),
    timezone: Joi.string().max(50).default('UTC').optional(),
  }),

  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
  }),
}

module.exports = {
  validate,
  schemas,
}
