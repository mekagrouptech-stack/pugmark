# Backend API Integration Guide

This document outlines the complete backend API integration for the HRMS mobile app.

## ✅ Integrated Endpoints

### Authentication (`/api/auth`)
- ✅ `POST /api/auth/login` - User login
- ✅ `POST /api/auth/logout` - User logout
- ✅ `GET /api/auth/me` - Get current user
- ✅ `POST /api/auth/refresh` - Refresh access token
- ✅ `POST /api/auth/forgot-password` - Request password reset
- ✅ `POST /api/auth/reset-password` - Reset password with token
- ✅ `POST /api/auth/change-password` - Change password (authenticated)

### Attendance (`/api/attendance`)
- ✅ `POST /api/attendance/punch` - Punch in/out
- ✅ `GET /api/attendance/today` - Get today's attendance (NEW - just added)
- ✅ `GET /api/attendance/records` - Get attendance records with filters
- ✅ `GET /api/attendance/records/:id` - Get specific attendance record
- ✅ `GET /api/attendance/team` - Get team attendance (Admin/HR/Manager)
- ✅ `PUT /api/attendance/update` - Update attendance (Admin/HR/Manager)

### Users/Employees (`/api/users`)
- ✅ `GET /api/users` - Get all users/employees
- ✅ `GET /api/users/:id` - Get user by ID
- ✅ `POST /api/users` - Create user (Admin only)
- ✅ `PUT /api/users/:id` - Update user
- ✅ `DELETE /api/users/:id` - Delete user (Admin only)
- ⚠️ `PATCH /api/users/:id/status` - Toggle user status (NOT YET IMPLEMENTED IN BACKEND)

### Payroll (`/api/payroll`)
- ✅ `GET /api/payroll` - Get payroll list
- ✅ `GET /api/payroll/:id` - Get payroll by ID
- ⚠️ `GET /api/payroll/:id/payslip` - Download payslip (VERIFY IMPLEMENTATION)

### Profile (`/api/profile`)
- ✅ Profile endpoints available (check profileRoutes.js)

### Companies (`/api/companies`)
- ✅ Company endpoints available (check companyRoutes.js)

### Offices (`/api/offices`)
- ✅ Office endpoints available (check officeRoutes.js)

## ⚠️ Missing Endpoints (Need Backend Implementation)

### Dashboard (`/api/dashboard`)
- ❌ `GET /api/dashboard/stats` - Dashboard statistics
  - **Status**: Mobile app calls this but endpoint doesn't exist
  - **Solution**: Create dashboard controller and route, or update mobile app to calculate from existing endpoints

### Leaves (`/api/leaves`)
- ❌ `GET /api/leaves` - Get all leaves
- ❌ `GET /api/leaves/:id` - Get leave by ID
- ❌ `POST /api/leaves` - Apply for leave
- ❌ `PATCH /api/leaves/:id/approve` - Approve leave
- ❌ `PATCH /api/leaves/:id/reject` - Reject leave
- ❌ `PATCH /api/leaves/:id/cancel` - Cancel leave
- ❌ `GET /api/leaves/balance` - Get leave balance
  - **Status**: Mobile app expects these endpoints but they don't exist
  - **Solution**: Create leave routes, controller, and service in backend

### DAR (Daily Activity Report) (`/api/dar`)
- ❌ `POST /api/dar/create` - Create DAR
- ❌ `GET /api/dar/my` - Get my DARs
- ❌ `GET /api/dar/team` - Get team DARs
- ❌ `GET /api/dar/all` - Get all DARs (Admin/HR)
- ❌ `GET /api/dar/:id` - Get DAR by ID
- ❌ `PUT /api/dar/:id` - Update DAR
- ❌ `POST /api/dar/:id/submit` - Submit DAR
- ❌ `POST /api/dar/:id/approve` - Approve DAR
- ❌ `POST /api/dar/:id/reject` - Reject DAR
- ❌ `GET /api/dar/stats` - Get DAR statistics
  - **Status**: Mobile app expects these endpoints but they don't exist
  - **Solution**: Create DAR routes, controller, and service in backend

## 📱 Mobile App Configuration

### API Base URL
The mobile app is configured to use:
- **Android Emulator**: `http://10.0.2.2:3001/api`
- **iOS Simulator**: `http://localhost:3001/api`
- **Physical Device**: Requires your computer's IP address (e.g., `http://192.168.1.100:3001/api`)

### Finding Your IP Address
- **Windows**: Run `ipconfig` and look for IPv4 Address
- **Mac/Linux**: Run `ifconfig` or `ip addr show`

### Updating API URL for Physical Device
1. Find your computer's IP address
2. Update `hrmsapp/hrms/utils/constants.ts`:
   ```typescript
   return 'http://YOUR_IP_ADDRESS:3001/api';
   ```

## 🔒 CORS Configuration

The backend CORS is configured to allow:
- Web frontend: `http://localhost:3000`
- Expo dev server: `exp://localhost:8081`
- Local network IPs for mobile testing
- Android emulator: `http://10.0.2.2:3001`
- iOS simulator: `http://localhost:3001`
- In development mode: All origins (for easier mobile testing)

## 🧪 Testing API Integration

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Mobile App**:
   ```bash
   cd hrmsapp/hrms
   npx expo start
   ```

3. **Test Endpoints**:
   - Login with real credentials
   - Check network tab in Expo dev tools
   - Verify API calls are hitting the backend

## 📝 Next Steps

1. ✅ **Completed**: API base URL configuration for mobile devices
2. ✅ **Completed**: CORS configuration for mobile app
3. ✅ **Completed**: Added `/api/attendance/today` endpoint
4. ⏳ **Pending**: Create leave management endpoints
5. ⏳ **Pending**: Create DAR endpoints
6. ⏳ **Pending**: Create dashboard stats endpoint or update mobile app
7. ⏳ **Pending**: Add user status toggle endpoint

## 🔗 Related Files

- **Mobile App API Config**: `hrmsapp/hrms/utils/constants.ts`
- **API Service**: `hrmsapp/hrms/services/api.ts`
- **Backend Server**: `backend/server.js`
- **Backend Routes**: `backend/routes/*.js`
