/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch errors and pass them to error handler
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = { asyncHandler }
