# Location-Based Attendance System Setup Guide

## Overview
This system adds location-based attendance punching with geofencing capabilities to your HRMS application. It includes:
- GPS location capture on attendance punch
- Map integration with OpenStreetMap (Leaflet)
- Geofencing validation
- Multiple office location support
- Admin office management panel

## Installation

### 1. Install Required Dependencies

```bash
npm install leaflet react-leaflet
```

### 2. Verify Installation

The following files have been created/updated:

**New Files:**
- `src/utils/locationUtils.js` - Location utilities (Haversine formula, geofencing)
- `src/features/office/officeService.js` - Office management API service
- `src/features/office/officeSlice.js` - Office Redux slice
- `src/components/map/AttendanceMap.jsx` - Map component with Leaflet
- `src/pages/attendance/LocationAttendancePunch.jsx` - Location-based punch component
- `src/pages/admin/OfficeManagement.jsx` - Admin office management panel

**Updated Files:**
- `src/app/store.js` - Added office reducer
- `src/features/attendance/attendanceService.js` - Added location data to punch methods
- `src/features/attendance/attendanceSlice.js` - Added punchIn/punchOut actions
- `src/pages/attendance/MyAttendance.jsx` - Added location display in attendance records
- `src/routes/AppRoutes.jsx` - Added new routes

## Features

### 1. Location Capture
- Automatically captures GPS coordinates when user punches attendance
- Uses browser Geolocation API
- Handles permission requests and errors gracefully

### 2. Map Integration
- Interactive map showing:
  - User's current location (green marker)
  - Office location (blue marker)
  - Geofence circle (allowed radius)
- Real-time distance calculation
- Visual feedback for within/outside radius

### 3. Geofencing
- Each office has:
  - Latitude/Longitude
  - Allowed radius (in meters)
  - Strict/Flexible geofencing mode
- Validates user location against office radius
- Blocks or warns based on configuration

### 4. Multiple Office Support
- Support for multiple offices globally
- Users can be assigned to specific offices
- Role-based access (admins can access all offices)

### 5. Admin Panel
- Create/Edit/Delete offices
- Set location via map click or manual coordinates
- Configure radius and geofencing rules
- View office locations on map

### 6. Role-Based Rules
- **Normal Employees**: Must be within radius (if strict geofencing enabled)
- **Managers/Admins/HR**: Can override location restriction with remark

## Usage

### For Employees

1. Navigate to `/attendance/punch`
2. Select your office from dropdown
3. Click "Capture Location" to get your GPS coordinates
4. Map will show your location and office location
5. If within radius, click "Punch In" or "Punch Out"
6. If outside radius, provide a remark explaining why

### For Admins

1. Navigate to `/admin/offices`
2. Click "Add Office" to create new office
3. Enter office details:
   - Name, Country, Address
   - Latitude/Longitude (or click on map)
   - Allowed radius
   - Strict/Flexible geofencing toggle
4. Click on map to set location visually
5. Save office

## API Integration

### Office Service Methods

```javascript
// Get all offices
officeService.getOffices()

// Get office by ID
officeService.getOfficeById(id)

// Create office
officeService.createOffice(officeData)

// Update office
officeService.updateOffice(id, officeData)

// Delete office
officeService.deleteOffice(id)

// Get user's assigned offices
officeService.getUserOffices(userId)
```

### Attendance Service Methods

```javascript
// Punch In with location
attendanceService.punchIn({
  type: 'in',
  officeId: 1,
  latitude: 19.1136,
  longitude: 72.8697,
  timestamp: '2024-01-15T09:00:00Z',
  remark: 'Optional remark',
  distance: 45,
  isWithinRadius: true
})

// Punch Out with location
attendanceService.punchOut({
  type: 'out',
  officeId: 1,
  latitude: 19.1136,
  longitude: 72.8697,
  timestamp: '2024-01-15T18:00:00Z',
  remark: 'Optional remark',
  distance: 42,
  isWithinRadius: true
})
```

## Location Utilities

### Calculate Distance
```javascript
import { calculateDistance } from '../../utils/locationUtils'

const distance = calculateDistance(lat1, lon1, lat2, lon2)
// Returns distance in meters
```

### Validate Geofence
```javascript
import { validateGeofence } from '../../utils/locationUtils'

const validation = validateGeofence(
  userLat, userLon,
  officeLat, officeLon,
  radius
)
// Returns { isWithinRadius: boolean, distance: number }
```

### Get Current Location
```javascript
import { getCurrentLocation } from '../../utils/locationUtils'

try {
  const location = await getCurrentLocation()
  // Returns { latitude, longitude, accuracy }
} catch (error) {
  // Handle error
}
```

## Security & Privacy

- Location is captured **only** at punch time
- No continuous tracking
- Location data stored with attendance records
- Proper permission handling for browser Geolocation API
- Role-based access control for office management

## Browser Compatibility

- Modern browsers with Geolocation API support
- HTTPS required for geolocation (or localhost for development)
- Mobile browsers fully supported

## Troubleshooting

### Location Permission Denied
- User needs to grant location permission in browser
- Check browser settings
- Ensure HTTPS is used (required for geolocation)

### Map Not Loading
- Check internet connection (OpenStreetMap tiles require internet)
- Verify Leaflet CSS is imported
- Check browser console for errors

### Distance Calculation Issues
- Ensure coordinates are in decimal degrees format
- Verify latitude (-90 to 90) and longitude (-180 to 180) ranges

## Future Enhancements

- Offline map support
- Location history tracking
- Geofence violation reports
- Integration with Google Maps API (optional)
- Mobile app support
- Location-based shift assignment

## Support

For issues or questions, refer to:
- Leaflet documentation: https://leafletjs.com/
- Browser Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
