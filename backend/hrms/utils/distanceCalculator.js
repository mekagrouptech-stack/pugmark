/**
 * Distance Calculation Utility
 * Implements Haversine formula for calculating distance between two GPS coordinates
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Validate inputs
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number'
  ) {
    throw new Error('All coordinates must be valid numbers')
  }

  // Validate latitude range (-90 to 90)
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees')
  }

  // Validate longitude range (-180 to 180)
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees')
  }

  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = R * c // Distance in meters
  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

/**
 * Validate if a location is within geofence radius
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} officeLat - Office latitude
 * @param {number} officeLon - Office longitude
 * @param {number} radius - Allowed radius in meters
 * @returns {object} { isWithinRadius: boolean, distance: number }
 */
const validateGeofence = (userLat, userLon, officeLat, officeLon, radius) => {
  if (typeof radius !== 'number' || radius <= 0) {
    throw new Error('Radius must be a positive number')
  }

  const distance = calculateDistance(userLat, userLon, officeLat, officeLon)
  return {
    isWithinRadius: distance <= radius,
    distance,
  }
}

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
const formatDistance = (distanceInMeters) => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters}m`
  }
  return `${(distanceInMeters / 1000).toFixed(2)}km`
}

module.exports = {
  calculateDistance,
  validateGeofence,
  formatDistance,
}
