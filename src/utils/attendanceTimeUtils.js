import dayjs from 'dayjs'

/**
 * Format a date string (YYYY-MM-DD or ISO) to DD/MM/YYYY for display.
 * Returns '--' if invalid.
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '--'
  const d = dayjs(dateStr)
  return d.isValid() ? d.format('DD/MM/YYYY') : dateStr
}

/**
 * Parse a time string like "10:48 AM", "02:48 pm", "14:48", "14:48:00" into a Date object (today).
 */
export const parseTimeStr = (str) => {
  if (!str) return null
  const match = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const mins = parseInt(match[2], 10)
  const secs = match[3] ? parseInt(match[3], 10) : 0
  const ampm = match[4]
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0
  }
  const d = new Date()
  d.setHours(hours, mins, secs, 0)
  return d
}

/**
 * Calculate time difference between checkIn and checkOut (or now if no checkOut).
 * Returns string like "4h 12m".
 * @param {string} checkInStr - Check in time string e.g. "10:48 AM"
 * @param {string|null} checkOutStr - Check out time string or null for live running
 * @param {Date} [currentTime] - Current time (for live updates, pass `new Date()`)
 * @returns {string}
 */
export const calcLiveTotal = (checkInStr, checkOutStr, currentTime = new Date()) => {
  if (!checkInStr) return '--:--'
  const inDate = parseTimeStr(checkInStr)
  if (!inDate) return '--:--'
  const endDate = checkOutStr ? parseTimeStr(checkOutStr) : currentTime
  if (!endDate) return '--:--'
  const diffMs = endDate - inDate
  if (diffMs < 0) return '--:--'
  const totalMins = Math.floor(diffMs / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}
