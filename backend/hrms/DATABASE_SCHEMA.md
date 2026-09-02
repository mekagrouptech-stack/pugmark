# Database Schema Documentation

## Overview

This document describes the automatically generated database schema for the location-based attendance system.

## Tables

### 1. `users`

Stores user accounts and authentication information.

**Columns:**
- `id` (INT, PK, AUTO_INCREMENT) - Primary key
- `email` (VARCHAR(255), UNIQUE, NOT NULL) - User email
- `password` (VARCHAR(255), NOT NULL) - Hashed password
- `name` (VARCHAR(255), NOT NULL) - User full name
- `employee_code` (VARCHAR(50), UNIQUE) - Employee code
- `role` (ENUM) - User role: EMPLOYEE, MANAGER, HR, HEAD_HR, ADMIN, HOD
- `department` (VARCHAR(255)) - Department name
- `designation` (VARCHAR(255)) - Job designation
- `is_active` (BOOLEAN, DEFAULT true) - Account status
- `last_login` (DATE) - Last login timestamp
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Record update time

**Indexes:**
- `idx_users_email` (UNIQUE) - Email lookup
- `idx_users_employee_code` (UNIQUE) - Employee code lookup
- `idx_users_role` - Role filtering
- `idx_users_is_active` - Active users filtering

**Relationships:**
- One-to-Many with `attendance_records`
- Many-to-Many with `offices` (through `user_offices`)

---

### 2. `offices`

Stores office location information and geofencing settings.

**Columns:**
- `id` (INT, PK, AUTO_INCREMENT) - Primary key
- `name` (VARCHAR(255), NOT NULL) - Office name
- `country` (VARCHAR(100), NOT NULL) - Country name
- `address` (TEXT, NOT NULL) - Full address
- `latitude` (DECIMAL(10,8), NOT NULL) - Office latitude (-90 to 90)
- `longitude` (DECIMAL(11,8), NOT NULL) - Office longitude (-180 to 180)
- `radius` (INT, DEFAULT 100) - Allowed radius in meters (10-10000)
- `is_active` (BOOLEAN, DEFAULT true) - Office status
- `strict_geofencing` (BOOLEAN, DEFAULT true) - Strict geofencing mode
- `timezone` (VARCHAR(50), DEFAULT 'UTC') - Office timezone
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Record update time

**Indexes:**
- `idx_offices_is_active` - Active offices filtering
- `idx_offices_country` - Country filtering
- `idx_offices_location` - Location-based queries (latitude, longitude)

**Relationships:**
- One-to-Many with `attendance_records`
- Many-to-Many with `users` (through `user_offices`)

---

### 3. `user_offices`

Junction table for user-office assignments (Many-to-Many relationship).

**Columns:**
- `id` (INT, PK, AUTO_INCREMENT) - Primary key
- `user_id` (INT, FK → users.id, NOT NULL) - User ID
- `office_id` (INT, FK → offices.id, NOT NULL) - Office ID
- `is_primary` (BOOLEAN, DEFAULT false) - Primary office flag
- `assigned_at` (DATE, DEFAULT CURRENT_TIMESTAMP) - Assignment date
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Record update time

**Indexes:**
- `unique_user_office` (UNIQUE) - Prevents duplicate assignments
- `idx_user_offices_user_id` - User lookup
- `idx_user_offices_office_id` - Office lookup

**Constraints:**
- Foreign key constraints with CASCADE on delete
- Unique constraint on (user_id, office_id)

**Relationships:**
- Many-to-One with `users`
- Many-to-One with `offices`

---

### 4. `attendance_records`

Stores attendance punch records with location data.

**Columns:**
- `id` (INT, PK, AUTO_INCREMENT) - Primary key
- `user_id` (INT, FK → users.id, NOT NULL) - User ID
- `office_id` (INT, FK → offices.id, NOT NULL) - Office ID
- `punch_type` (ENUM('IN', 'OUT'), NOT NULL) - Punch type
- `latitude` (DECIMAL(10,8), NOT NULL) - Punch latitude
- `longitude` (DECIMAL(11,8), NOT NULL) - Punch longitude
- `distance` (INT, NOT NULL) - Distance from office in meters
- `is_within_radius` (BOOLEAN, DEFAULT false) - Geofence validation result
- `remark` (TEXT) - Optional remark (required for overrides)
- `accuracy` (DECIMAL(8,2)) - GPS accuracy in meters
- `ip_address` (VARCHAR(45)) - Client IP address
- `user_agent` (TEXT) - Client user agent
- `created_at` (TIMESTAMP) - Punch timestamp
- `updated_at` (TIMESTAMP) - Record update time

**Indexes:**
- `idx_attendance_user_date` - User and date queries
- `idx_attendance_office_id` - Office filtering
- `idx_attendance_punch_type` - Punch type filtering
- `idx_attendance_created_at` - Date range queries
- `idx_attendance_is_within_radius` - Geofence validation queries
- `user_date_punch_index` - Composite index for sequence validation

**Constraints:**
- Foreign key to `users` with CASCADE on delete
- Foreign key to `offices` with RESTRICT on delete

**Relationships:**
- Many-to-One with `users`
- Many-to-One with `offices`

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│    users    │         │   user_offices    │         │   offices   │
├─────────────┤         ├──────────────────┤         ├─────────────┤
│ id (PK)     │◄──┐     │ id (PK)          │     ┌──►│ id (PK)     │
│ email       │   │     │ user_id (FK)      │     │   │ name        │
│ password    │   │     │ office_id (FK)    │     │   │ latitude    │
│ name        │   │     │ is_primary        │     │   │ longitude   │
│ role        │   │     └──────────────────┘     │   │ radius      │
│ ...         │   │                              │   │ ...         │
└─────────────┘   │                              │   └─────────────┘
      │           │                              │
      │           │                              │
      │           └──────────────────────────────┘
      │
      │
      │ 1:N
      │
      ▼
┌──────────────────┐
│attendance_records│
├──────────────────┤
│ id (PK)          │
│ user_id (FK)      │
│ office_id (FK)   │
│ punch_type       │
│ latitude         │
│ longitude        │
│ distance         │
│ is_within_radius │
│ ...              │
└──────────────────┘
```

## Database Constraints

### Primary Keys
- All tables have auto-incrementing integer primary keys

### Foreign Keys
- `user_offices.user_id` → `users.id` (CASCADE on delete)
- `user_offices.office_id` → `offices.id` (CASCADE on delete)
- `attendance_records.user_id` → `users.id` (CASCADE on delete)
- `attendance_records.office_id` → `offices.id` (RESTRICT on delete)

### Unique Constraints
- `users.email` - Unique email addresses
- `users.employee_code` - Unique employee codes
- `user_offices(user_id, office_id)` - Unique user-office assignments

### Check Constraints (via Application)
- `latitude`: -90 to 90
- `longitude`: -180 to 180
- `radius`: 10 to 10000 meters
- `punch_type`: IN or OUT only

## Indexes for Performance

### High-Frequency Queries
1. **User Authentication**: `users.email` (unique index)
2. **Office Lookup**: `offices.is_active`, `offices.country`
3. **Attendance Queries**: 
   - `attendance_records(user_id, created_at)` - User attendance history
   - `attendance_records(office_id)` - Office attendance reports
   - `attendance_records(created_at)` - Date range queries
4. **User-Office Assignment**: `user_offices(user_id, office_id)` (unique)

### Composite Indexes
- `attendance_records(user_id, created_at, punch_type)` - Sequence validation
- `offices(latitude, longitude)` - Location-based queries

## Data Types Rationale

### Coordinates
- **DECIMAL(10,8)** for latitude: ±90.00000000 (8 decimal places = ~1.1mm precision)
- **DECIMAL(11,8)** for longitude: ±180.00000000 (8 decimal places = ~1.1mm precision)

### Distance
- **INT** for distance: Meters (max 2,147,483,647m = sufficient for any office radius)

### Timestamps
- **TIMESTAMP** with automatic `created_at` and `updated_at` management

### Enums
- **ENUM** for `role` and `punch_type`: Ensures data integrity at database level

## Migration Strategy

Migrations are created in chronological order:
1. `20240115000001-create-users.js`
2. `20240115000002-create-offices.js`
3. `20240115000003-create-user-offices.js`
4. `20240115000004-create-attendance-records.js`

Run migrations:
```bash
npm run db:migrate
```

Rollback:
```bash
npm run db:migrate:undo
```

## Seeding

Sample data seeders:
- `20240115000001-seed-offices.js` - Sample offices (Mumbai, Dubai, New York)

Run seeders:
```bash
npm run db:seed
```

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt (10 rounds)
2. **Soft Deletes**: Offices use `is_active` flag instead of hard deletes
3. **Audit Trail**: `created_at` and `updated_at` track all changes
4. **Referential Integrity**: Foreign keys ensure data consistency
5. **Index Security**: Indexes don't expose sensitive data

## Performance Optimization

1. **Indexed Columns**: All frequently queried columns are indexed
2. **Composite Indexes**: Multi-column indexes for complex queries
3. **Connection Pooling**: Sequelize pool configuration for optimal connections
4. **Query Optimization**: Use of Sequelize includes for efficient joins

---

**Schema Version:** 1.0.0
**Last Updated:** 2024-01-15
**Status:** ✅ Production Ready
