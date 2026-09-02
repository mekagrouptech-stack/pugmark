const moment = require('moment-timezone')

const IST_TIMEZONE = 'Asia/Kolkata' // IST = UTC + 5h 30m

/**
 * Get a Moment instance in IST for the given date.
 */
const toIST = (date) => {
  // Parse as UTC first (DB stores UTC), then convert to IST
  return moment.utc(date).tz(IST_TIMEZONE)
}

/**
 * Start of day (00:00) in IST for the given date.
 */
const istStartOfDay = (date) => {
  return toIST(date).startOf('day')
}

/**
 * End of day (23:59:59.999) in IST for the given date.
 */
const istEndOfDay = (date) => {
  return toIST(date).endOf('day')
}

/**
 * Get current time in IST as a Date object
 * This is used for all attendance timestamps - always server-side IST
 */
const getCurrentIST = () => {
  return moment.tz(IST_TIMEZONE).toDate()
}

/**
 * Get current time in IST as ISO string
 */
const getCurrentISTAsISO = () => {
  return moment.tz(IST_TIMEZONE).toISOString()
}

module.exports = {
  moment,
  IST_TIMEZONE,
  toIST,
  istStartOfDay,
  istEndOfDay,
  getCurrentIST,
  getCurrentISTAsISO,
}

