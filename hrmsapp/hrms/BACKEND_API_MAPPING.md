# Backend API Integration - Complete Mapping

This document maps the exact backend API structure to the mobile app services.

## Backend Response Format

All backend responses follow this structure:
```json
{
  "success": true/false,
  "message": "string",
  "data": { ... }
}
```

## Authentication Endpoints

### POST /api/auth/login
**Backend Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "EMPLOYEE",
      "employeeCode": "EMP001",
      "department": "IT",
      "designation": "Developer"
    }
  }
}
```

**Mobile App Mapping:**
- Extracts `data.token` and `data.user`
- Splits `user.name` into `firstName` and `lastName`
- Uses token as both access and refresh token (temporary)

### GET /api/auth/me
**Backend Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    // Full user object with offices association
  }
}
```

### POST /api/auth/refresh
**Backend Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {}
}
```

### POST /api/auth/forgot-password
**Request:** `{ email: string }`
**Response:** `{ success: true, message: string }`

### POST /api/auth/reset-password
**Request:** `{ token: string, password: string }`
**Response:** `{ success: true, message: string }`

## User/Employee Endpoints

### GET /api/users
**Backend Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [/* array of users */],
  "count": 10
}
```

**Query Parameters:**
- `role`, `department`, `isActive`, `search`, `companyId`

**Mobile App Mapping:**
- Converts to `PaginatedResponse<Employee>` format
- Maps `data` array and `count` to pagination structure

### GET /api/users/:id
**Backend Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": { /* user object */ }
}
```

### POST /api/users
**Request:** User creation data
**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": { /* created user */ }
}
```

### PUT /api/users/:id
**Request:** User update data
**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { /* updated user */ }
}
```

### DELETE /api/users/:id
**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Attendance Endpoints

### POST /api/attendance/punch
**Request:**
```json
{
  "officeId": "number",
  "latitude": "number",
  "longitude": "number",
  "punchType": "IN" | "OUT",
  "remark": "string (optional)",
  "accuracy": "number (optional)",
  "targetUserId": "number (optional, for admin/HR)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Punch successful",
  "data": { /* attendance record */ }
}
```

### GET /api/attendance/today
**Query Parameters:** `userId` (optional, for admin/HR)
**Response:**
```json
{
  "success": true,
  "message": "Today's attendance retrieved successfully",
  "data": { /* attendance record */ }
}
```
**Note:** Returns 404 if no attendance record for today

### GET /api/attendance/records
**Query Parameters:** `startDate`, `endDate`, `officeId`
**Response:**
```json
{
  "success": true,
  "message": "Attendance records retrieved successfully",
  "data": [/* array of attendance records */]
}
```

### GET /api/attendance/team
**Response:**
```json
{
  "success": true,
  "message": "Team attendance retrieved successfully",
  "data": [/* array of team attendance */]
}
```

## Payroll Endpoints

### GET /api/payroll
**Query Parameters:** Standard filters
**Response:**
```json
{
  "success": true,
  "message": "...",
  "data": [/* payroll records */]
}
```

### GET /api/payroll/:id
**Response:**
```json
{
  "success": true,
  "message": "...",
  "data": { /* payroll record */ }
}
```

## API Service Layer

The `apiService` in `services/api.ts` handles:
1. Base URL configuration
2. Request/Response interceptors
3. Token management
4. Error handling
5. Response transformation

**Response Transformation:**
- Backend returns: `{ success, message, data }`
- API service extracts: `response.data` (the nested data object)
- Services then access: `response.data` for the actual data

## Error Handling

Backend errors follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

Mobile app extracts error from: `error.response.data.message`

## Important Notes

1. **No Refresh Token:** Backend doesn't return refreshToken in login response. Mobile app uses access token as refresh token temporarily.

2. **User Name Field:** Backend uses `name` (single string), mobile app splits it into `firstName` and `lastName`.

3. **Pagination:** Backend `/api/users` doesn't return pagination metadata, so mobile app constructs it from `count` and `data.length`.

4. **404 Handling:** Some endpoints (like `/attendance/today`) return 404 when no data exists. Mobile app handles this gracefully.
