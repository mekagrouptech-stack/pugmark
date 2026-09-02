// Backed by dayjs rather than moment-timezone: the timezone plugin defers to
// the browser's built-in Intl database, so this costs a few KB instead of the
// ~790KB of tz data moment-timezone bundles. dayjs is already the date library
// used across the app (and by antd), so this also drops a duplicate dependency.
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const IST_TIMEZONE = 'Asia/Kolkata'

/**
 * Get a dayjs instance in IST for the given date string or Date.
 * Named for the moment-based original it replaced; the API surface used by
 * callers (.valueOf(), .format()) is identical.
 */
export const istMoment = (date) => {
  return dayjs(date).tz(IST_TIMEZONE)
}

/**
 * Format a date in IST with the given format string.
 * Default: 'YYYY-MM-DD HH:mm:ss'
 */
export const formatIST = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return istMoment(date).format(format)
}
