# HRMS Mobile App - API Endpoints Documentation

This document lists all backend API endpoints that the mobile app uses. **All data comes from real backend APIs - no mock data.**

## Base URL
- Development: `http://localhost:3001/api`
- Production: Set via `EXPO_PUBLIC_API_BASE_URL` environment variable

## Authentication

### POST /auth/login
Login with email and password.
- Request: `{ email: string, password: string }`
- Response: `{ user: User, token: string, refreshToken: string }`

### POST /auth/logout
Logout current user.
- Request: None
- Response: `{ success: boolean }`

### GET /auth/me
Get current authenticated user.
- Request: None (requires Bearer token)
- Response: `{ user: User }`

### POST /auth/refresh
Refresh access token.
- Request: `{ refreshToken: string }`
- Response: `{ token: string }`

### POST /auth/forgot-password
Request password reset.
- Request: `{ email: string }`
- Response: `{ success: boolean, message: string }`

### POST /auth/reset-password
Reset password with token.
- Request: `{ token: string, password: string }`
- Response: `{ success: boolean }`

## Dashboard

### GET /dashboard/stats
Get dashboard statistics.
- Query Params: `companyId?: string`
- Response: `DashboardStats`

## Attendance

### POST /attendance/punch
Punch in or out.
- Request: `{ officeId?: string, latitude: number, longitude: number, punchType: 'IN' | 'OUT', remark?: string, accuracy?: number, targetUserId?: string }`
- Response: `Attendance`

### GET /attendance/today
Get today's attendance record.
- Query Params: `userId?: string`
- Response: `Attendance | null`

### GET /attendance/records
Get attendance records with filters.
- Query Params: `page?, limit?, userId?, startDate?, endDate?, status?`
- Response: `PaginatedResponse<Attendance>`

### GET /attendance/monthly-summary
Get monthly attendance summary.
- Query Params: `month: number, year: number, userId?: string`
- Response: `{ present, absent, halfDay, onLeave, workingDays, attendance: Attendance[] }`

## Employees

### GET /users
Get all employees/users.
- Query Params: `page?, limit?, search?, companyId?, department?, isActive?, role?`
- Response: `PaginatedResponse<Employee>`

### GET /users/:id
Get employee by ID.
- Response: `Employee`

### POST /users
Create new employee.
- Request: `Partial<Employee>`
- Response: `Employee`

### PUT /users/:id
Update employee.
- Request: `Partial<Employee>`
- Response: `Employee`

### DELETE /users/:id
Delete employee.
- Response: `{ success: boolean }`

### PATCH /users/:id/status
Activate/Deactivate employee.
- Request: `{ isActive: boolean }`
- Response: `Employee`

## Leaves

### GET /leaves
Get all leaves.
- Query Params: `page?, limit?, userId?, status?, leaveType?, startDate?, endDate?`
- Response: `PaginatedResponse<Leave>`

### GET /leaves/:id
Get leave by ID.
- Response: `Leave`

### POST /leaves
Apply for leave.
- Request: `{ leaveType: string, startDate: string, endDate: string, reason: string }`
- Response: `Leave`

### PATCH /leaves/:id/approve
Approve leave.
- Request: `{ comments?: string }`
- Response: `Leave`

### PATCH /leaves/:id/reject
Reject leave.
- Request: `{ reason: string, comments?: string }`
- Response: `Leave`

### PATCH /leaves/:id/cancel
Cancel leave.
- Response: `Leave`

### GET /leaves/balance
Get leave balance.
- Query Params: `userId?: string`
- Response: `LeaveBalance[]`

## DAR (Daily Activity Report)

### POST /dar/create
Create a new DAR.
- Request: `DARCreateRequest`
- Response: `DAR`

### GET /dar/my
Get my DARs (for employee).
- Query Params: `DARFilterParams`
- Response: `PaginatedResponse<DAR>`

### GET /dar/team
Get team DARs (for manager).
- Query Params: `DARFilterParams`
- Response: `PaginatedResponse<DAR>`

### GET /dar/all
Get all DARs (for HR/Admin).
- Query Params: `DARFilterParams`
- Response: `PaginatedResponse<DAR>`

### GET /dar/:id
Get DAR by ID.
- Response: `DAR`

### PUT /dar/:id
Update DAR.
- Request: `DARUpdateRequest`
- Response: `DAR`

### POST /dar/:id/submit
Submit DAR (change status from DRAFT to SUBMITTED).
- Response: `DAR`

### POST /dar/:id/approve
Approve DAR (manager action).
- Request: `{ comments?: string }`
- Response: `DAR`

### POST /dar/:id/reject
Reject DAR (manager action).
- Request: `{ reason: string, comments?: string }`
- Response: `DAR`

### GET /dar/stats
Get DAR statistics.
- Query Params: `userId?: string`
- Response: `DARStats`

### POST /dar/export
Export DARs.
- Request: `DARFilterParams & { format: 'EXCEL' | 'PDF' }`
- Response: `{ url: string }`

## Payroll

### GET /payroll
Get payroll list.
- Query Params: `page?, limit?, userId?, month?, year?, companyId?`
- Response: `PaginatedResponse<Payroll>`

### GET /payroll/:id
Get payroll by ID.
- Response: `Payroll`

### GET /payroll/:id/payslip
Download payslip.
- Response: `{ url: string }`

## Missing Endpoints (TODO)

The following features need backend endpoints:

1. **GET /employees/birthdays** - Get employees with birthdays today
2. **GET /employees/anniversaries** - Get employees with work anniversaries today
3. **GET /holidays** - Get holidays list
4. **GET /notifications** - Get user notifications

Until these endpoints are available, the app will:
- Use alternative API calls (e.g., fetch all employees and filter client-side)
- Show empty states when data is not available
- Display clear error messages

## Error Handling

All API calls handle the following error scenarios:
- **401 Unauthorized**: Token expired or invalid - triggers automatic logout
- **403 Forbidden**: User doesn't have permission
- **404 Not Found**: Resource doesn't exist
- **500 Server Error**: Backend error
- **Network Error**: No internet connection

The app shows appropriate error messages and empty states for all scenarios.
