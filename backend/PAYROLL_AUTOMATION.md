# Payroll Automation System

## Overview

This system automatically calculates payroll for all active employees on the 1st day of every month at 00:05 AM, processing the **previous month's** attendance data (N+1 execution).

## Features

- ✅ **Automatic Scheduling**: Runs on 1st of every month at 00:05 AM
- ✅ **N+1 Execution**: Calculates payroll for the previous month
- ✅ **Attendance-Based Calculation**: Uses actual attendance records
- ✅ **Idempotent**: Prevents duplicate processing (LOCKED status)
- ✅ **Safety Validations**: Skips employees without salary, inactive employees, etc.
- ✅ **Manual Trigger**: API endpoint for manual execution
- ✅ **Comprehensive Logging**: All operations are logged

## Database Schema

### Users Table (Updated)
- Added `monthly_salary` (DECIMAL 12,2) - Monthly salary in INR

### Payrolls Table (New)
- `id` - Primary key
- `user_id` - Foreign key to users
- `payroll_month` - Month (1-12)
- `payroll_year` - Year
- `monthly_salary` - Salary at time of calculation
- `total_working_days` - Total working days in month
- `full_days` - Number of full days present
- `half_days` - Number of half days
- `absent_days` - Number of absent days
- `payable_days` - Calculated payable days
- `lop_days` - Loss of Pay days
- `per_day_salary` - Per day salary
- `final_salary` - Final payable salary
- `status` - PENDING, PROCESSED, LOCKED, PAID
- `processed_at` - Processing timestamp
- `paid_date` - Payment date (optional)
- `remarks` - Additional notes

**Unique Constraint**: `(user_id, payroll_month, payroll_year)` - Prevents duplicates

## Payroll Calculation Rules

### Working Days
- Monday to Friday are considered working days
- Weekends (Saturday, Sunday) are excluded

### Attendance Calculation
- **Full Day**: Employee has both IN and OUT punch on the same day
- **Half Day**: Employee has only IN or only OUT punch
- **Absent**: No attendance record for the day

### Salary Calculation
1. **Per Day Salary** = Monthly Salary / Total Working Days
2. **Payable Days** = (Full Days × 1.0) + (Half Days × 0.5)
3. **LOP Days** = Total Working Days - Payable Days
4. **Final Salary** = Payable Days × Per Day Salary (rounded to 2 decimals)

## API Endpoints

### 1. Manual Trigger Payroll Calculation
```
POST /api/payroll/run-auto
Authorization: Bearer <token>
Roles: ADMIN, HR, HEAD_HR
```

**Response:**
```json
{
  "success": true,
  "message": "Payroll calculation completed successfully",
  "data": {
    "month": 12,
    "year": 2023,
    "results": {
      "total": 50,
      "processed": 45,
      "skipped": 3,
      "failed": 2,
      "errors": [...]
    }
  }
}
```

### 2. Get Payroll Status
```
GET /api/payroll/status
Authorization: Bearer <token>
Roles: ADMIN, HR, HEAD_HR
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scheduler": {
      "isRunning": false,
      "isScheduled": true,
      "nextRun": "1st of every month at 00:05 AM"
    },
    "previousMonth": {
      "year": 2023,
      "month": 12,
      "monthName": "December"
    },
    "payrollCount": 45
  }
}
```

### 3. Get All Payrolls
```
GET /api/payroll?month=12&year=2023&userId=1&status=LOCKED
Authorization: Bearer <token>
Roles: ADMIN, HR, HEAD_HR, MANAGER
```

**Query Parameters:**
- `month` (optional) - Filter by month (1-12)
- `year` (optional) - Filter by year
- `userId` (optional) - Filter by user ID
- `status` (optional) - Filter by status (PENDING, PROCESSED, LOCKED, PAID)

### 4. Get Payroll by ID
```
GET /api/payroll/:id
Authorization: Bearer <token>
Roles: ADMIN, HR, HEAD_HR, MANAGER, EMPLOYEE
```

### 5. Calculate Payroll for Specific Employee
```
POST /api/payroll/calculate
Authorization: Bearer <token>
Roles: ADMIN, HR, HEAD_HR

Body:
{
  "userId": 1,
  "year": 2023,
  "month": 12
}
```

## Safety & Validation

### Automatic Skipping
The system automatically skips:
- ✅ Employees already processed for that month (LOCKED status)
- ✅ Employees without monthly salary set
- ✅ Inactive employees
- ✅ Employees who joined after the payroll month

### Validation
- ✅ Attendance days ≤ Working days
- ✅ Prevents duplicate payroll records
- ✅ Validates month (1-12)
- ✅ Validates user exists and is active

## Setup Instructions

### 1. Run Migrations
```bash
cd backend
npm run db:migrate
```

This will:
- Add `monthly_salary` column to `users` table
- Create `payrolls` table with all required fields

### 2. Set Employee Salaries
Update the `monthly_salary` field for each employee in the `users` table:

```sql
UPDATE users SET monthly_salary = 50000 WHERE id = 1;
```

Or use the User Management API to update employee information.

### 3. Start Server
The scheduler automatically starts when the server starts:

```bash
npm run dev
```

You should see:
```
📅 Payroll scheduler started. Will run on 1st of every month at 00:05 AM
```

## Testing

### Manual Trigger (For Testing)
You can manually trigger payroll calculation for testing:

```bash
curl -X POST http://localhost:3001/api/payroll/run-auto \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

### Check Status
```bash
curl http://localhost:3001/api/payroll/status \
  -H "Authorization: Bearer <your-token>"
```

## Cron Schedule

The scheduler uses the following cron expression:
```
5 0 1 * *
```

Which means:
- **Minute**: 5
- **Hour**: 0 (midnight)
- **Day of Month**: 1 (first day)
- **Month**: * (every month)
- **Day of Week**: * (any day of week)

**Result**: Runs at 00:05 AM on the 1st day of every month

## Logging

All payroll operations are logged with Winston logger:
- Scheduler start/stop
- Calculation start/completion
- Errors and warnings
- Skipped employees
- Processing results

Check logs in:
- `backend/logs/combined.log` - All logs
- `backend/logs/error.log` - Error logs only

## Error Handling

- If calculation fails for an employee, it's logged and the process continues
- Failed employees are included in the results with error details
- Scheduler continues even if one month's calculation fails
- Manual trigger can be retried if needed

## Future Enhancements

Potential improvements:
- Email notifications when payroll is processed
- Payroll approval workflow
- Integration with accounting systems
- Support for different salary structures
- Holiday calendar integration
- Leave management integration
