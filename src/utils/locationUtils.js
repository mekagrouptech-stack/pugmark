/**
 * Location Utilities
 * Functions for calculating distances, validating geofences, and location operations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Check if a location is within the geofence radius
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} officeLat - Office latitude
 * @param {number} officeLon - Office longitude
 * @param {number} radius - Allowed radius in meters
 * @returns {object} { isWithinRadius: boolean, distance: number }
 */
export const validateGeofence = (userLat, userLon, officeLat, officeLon, radius) => {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon)
  return {
    isWithinRadius: distance <= radius,
    distance: Math.round(distance),
  }
}

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceInMeters) => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters}m`
  }
  return `${(distanceInMeters / 1000).toFixed(2)}km`
}

/**
 * Get current location from browser
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
        }
        reject(new Error(errorMessage))
      },
      options
    )
  })
}

/**
 * Check if location permission is granted
 * @returns {Promise<boolean>}
 */
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    // Fallback for browsers that don't support permissions API
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 1000 }
      )
    })
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state === 'granted'
  } catch (error) {
    return false
  }
}
