# Frontend-Backend Integration Guide

## ✅ Integration Status

All frontend services have been updated to integrate with the Node.js backend APIs.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

The frontend will use this URL for all API calls.

## 📡 API Integration Details

### 1. Authentication Service (`src/features/auth/authService.js`)

**Integrated Endpoints:**
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

**Changes:**
- ✅ Removed mock data
- ✅ Calls real backend API
- ✅ Normalizes user roles to uppercase
- ✅ Handles JWT token storage
- ✅ Error handling with user-friendly messages

**Usage:**
```javascript
import authService from './features/auth/authService'

// Login
const { token, user } = await authService.login({ email, password })

// Get current user
const user = await authService.getCurrentUser()
```

### 2. Attendance Service (`src/features/attendance/attendanceService.js`)

**Integrated Endpoints:**
- `POST /api/attendance/punch` - Punch in/out
- `GET /api/attendance/records` - Get attendance records
- `GET /api/attendance/records/:id` - Get specific record

**Changes:**
- ✅ Removed mock data
- ✅ Calls real backend API
- ✅ Sends location data (latitude, longitude, accuracy)
- ✅ Handles geofence validation responses
- ✅ Error handling for outside geofence, invalid sequences

**Request Format:**
```javascript
{
  officeId: 1,
  latitude: 19.1136,
  longitude: 72.8697,
  punchType: "IN", // or "OUT"
  remark: "Optional remark",
  accuracy: 10 // GPS accuracy in meters
}
```

**Response Format:**
```javascript
{
  id: 123,
  punchType: "IN",
  timestamp: "2024-01-15T09:00:00.000Z",
  office: { id: 1, name: "Mumbai Office" },
  location: {
    latitude: 19.1136,
    longitude: 72.8697,
    distance: 45,
    isWithinRadius: true
  },
  message: "Successfully punched in from office location"
}
```

### 3. Office Service (`src/features/office/officeService.js`)

**Integrated Endpoints:**
- `GET /api/offices` - Get all offices
- `GET /api/offices/:id/location` - Get office location for map
- `GET /api/offices/user/:userId` - Get user's assigned offices
- `GET /api/offices/:id/access` - Check office access

**Changes:**
- ✅ Removed mock data
- ✅ Calls real backend API
- ✅ Fetches user-assigned offices
- ✅ Returns office location data optimized for maps

**Usage:**
```javascript
import officeService from './features/office/officeService'

// Get all offices
const offices = await officeService.getOffices()

// Get user's assigned offices
const officeIds = await officeService.getUserOffices(userId)

// Get office location for map
const officeLocation = await officeService.getOfficeLocationForMap(officeId)
```

## 🔐 Authentication Flow

### Login Process

1. User enters credentials
2. Frontend calls `POST /api/auth/login`
3. Backend validates and returns JWT token + user data
4. Frontend stores token in localStorage
5. Token is automatically attached to all subsequent API requests via axios interceptor

### Token Management

- **Storage:** localStorage (`hrms_token`)
- **Auto-attachment:** Axios interceptor adds `Authorization: Bearer <token>` header
- **Auto-logout:** On 401 response, token is cleared and user redirected to login

## 📍 Location-Based Attendance Flow

### Punch Process

1. **Get Location:**
   - User grants location permission
   - Browser GPS captures coordinates
   - Accuracy is recorded

2. **Select Office:**
   - Frontend fetches user's assigned offices
   - User selects office (or auto-selected if only one)

3. **Validate Geofence:**
   - Frontend calculates distance (Haversine)
   - Shows visual feedback on map
   - Displays distance and status

4. **Punch Request:**
   - Frontend sends punch data to backend
   - Backend validates geofence again
   - Backend checks punch sequence
   - Backend applies role-based rules

5. **Handle Response:**
   - Success: Show confirmation, refresh attendance
   - Outside geofence: Show warning, request remark (if override allowed)
   - Invalid sequence: Show error message

### Error Handling

**Outside Geofence (Strict):**
```javascript
{
  success: false,
  message: "You are 150m away from the office. Attendance is only allowed within 100m radius."
}
```

**Invalid Sequence:**
```javascript
{
  success: false,
  message: "You have already punched in today. Please punch out first."
}
```

**Role-Based Override:**
- Employees: Cannot punch outside geofence
- Managers/Admins: Can override with mandatory remark

## 🗺️ Map Integration

### Office Location Display

- Office marker with name
- Geofence circle (radius visualization)
- User location marker
- Distance calculation display
- Real-time validation status

### Data Flow

1. Fetch office location: `GET /api/offices/:id/location`
2. Display on map with geofence circle
3. Capture user location via browser GPS
4. Calculate and display distance
5. Validate before punch submission

## 🔄 Redux State Management

### Auth State
```javascript
{
  user: { id, email, name, role, ... },
  token: "jwt_token",
  isAuthenticated: true,
  loading: false,
  error: null
}
```

### Office State
```javascript
{
  offices: [...],
  userOffices: [1, 2, 3], // Array of office IDs
  selectedOffice: {...},
  loading: false,
  error: null
}
```

### Attendance State
```javascript
{
  attendance: [...],
  currentPunch: {...},
  loading: false,
  error: null
}
```

## 🛡️ Error Handling

### API Error Responses

All services handle errors consistently:

```javascript
try {
  const data = await service.method()
  // Handle success
} catch (error) {
  // Error message from backend or default
  const errorMsg = error.message || 'Operation failed'
  message.error(errorMsg)
}
```

### Common Error Scenarios

1. **Network Error:** Connection timeout, server unreachable
2. **401 Unauthorized:** Token expired, invalid token → Auto-logout
3. **400 Bad Request:** Validation errors, invalid data
4. **403 Forbidden:** Insufficient permissions
5. **404 Not Found:** Resource doesn't exist
6. **409 Conflict:** Duplicate punch, invalid sequence
7. **500 Server Error:** Backend error

## 📝 Component Updates

### LocationAttendancePunch Component

**Updated:**
- ✅ Uses real API for punch in/out
- ✅ Handles backend validation responses
- ✅ Shows appropriate error messages
- ✅ Refreshes attendance after successful punch
- ✅ Handles geofence override with remarks

**Key Changes:**
```javascript
// Before: Mock data
await dispatch(punchIn(mockData))

// After: Real API call
const result = await dispatch(punchIn({
  officeId: selectedOffice.id,
  latitude: userLocation.latitude,
  longitude: userLocation.longitude,
  remark: remarkText || null,
  accuracy: userLocation.accuracy || null,
})).unwrap()

message.success(result.message || 'Punch In successful!')
```

### Office Management Component

**Updated:**
- ✅ Fetches offices from backend
- ✅ Fetches user-assigned offices
- ✅ Displays office data on map
- ✅ Handles CRUD operations (when backend endpoints are added)

## 🧪 Testing Integration

### 1. Test Login

```bash
# Frontend
# Navigate to /login
# Enter credentials: admin@hrms.com / admin123
# Should redirect to dashboard
```

### 2. Test Attendance Punch

```bash
# 1. Navigate to /attendance/punch
# 2. Grant location permission
# 3. Select office
# 4. Click "Punch In"
# 5. Verify success message
# 6. Check attendance records updated
```

### 3. Test Geofence Validation

```bash
# 1. Move outside office radius (use browser dev tools to mock location)
# 2. Try to punch
# 3. Verify error message or remark requirement
```

## 🚀 Deployment Checklist

- [ ] Set `VITE_API_BASE_URL` to production backend URL
- [ ] Ensure backend CORS allows frontend domain
- [ ] Verify JWT token expiration settings
- [ ] Test all API endpoints
- [ ] Verify error handling works correctly
- [ ] Test location permissions on mobile devices
- [ ] Verify geofence validation works
- [ ] Test role-based access control

## 📚 API Documentation

For complete backend API documentation, see:
- `backend/API_DOCUMENTATION.md`

## 🔗 Related Files

**Services:**
- `src/features/auth/authService.js`
- `src/features/attendance/attendanceService.js`
- `src/features/office/officeService.js`

**API Configuration:**
- `src/services/api.js` - Axios instance with interceptors

**Redux Slices:**
- `src/features/auth/authSlice.js`
- `src/features/attendance/attendanceSlice.js`
- `src/features/office/officeSlice.js`

**Components:**
- `src/pages/attendance/LocationAttendancePunch.jsx`
- `src/pages/admin/OfficeManagement.jsx`
- `src/pages/auth/Login.jsx`

---

**Status:** ✅ Fully Integrated
**Last Updated:** 2024-01-15
