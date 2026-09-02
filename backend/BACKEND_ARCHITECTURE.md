# Backend Architecture Documentation

## 🏗️ Architecture Overview

The backend follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         Routes Layer                │  ← HTTP routing & middleware
├─────────────────────────────────────┤
│       Controllers Layer             │  ← Request/Response handling
├─────────────────────────────────────┤
│        Services Layer               │  ← Business logic
├─────────────────────────────────────┤
│        Utilities Layer             │  ← Reusable functions
├─────────────────────────────────────┤
│      Database Layer                 │  ← Data access
└─────────────────────────────────────┘
```

## 📂 Directory Structure

```
backend/
├── config/              # Configuration files
│   └── database.js      # Database connection setup
│
├── controllers/         # Request handlers
│   ├── attendanceController.js
│   └── officeController.js
│
├── middleware/          # Express middleware
│   ├── auth.js          # JWT authentication
│   ├── authorize.js     # Role-based authorization
│   ├── officeAccess.js  # Office access validation
│   └── errorHandler.js  # Global error handling
│
├── routes/              # API route definitions
│   ├── attendanceRoutes.js
│   └── officeRoutes.js
│
├── services/            # Business logic layer
│   ├── attendanceService.js
│   └── officeService.js
│
├── utils/               # Utility functions
│   ├── distanceCalculator.js  # Haversine formula
│   ├── errors.js              # Custom error classes
│   ├── logger.js              # Winston logger
│   └── validators.js          # Joi validation schemas
│
├── logs/                # Log files (auto-generated)
├── server.js            # Application entry point
└── package.json
```

## 🔄 Request Flow

### 1. Request Entry
```
HTTP Request → Express App → Middleware Chain → Route Handler
```

### 2. Middleware Chain (Example: Punch Attendance)
```
1. Rate Limiter
2. CORS
3. Body Parser
4. Authentication (JWT)
5. Geofence Override Check
6. Input Validation (Joi)
7. Office Access Validation
8. Controller
```

### 3. Controller → Service → Database
```
Controller receives request
  ↓
Calls Service with business logic
  ↓
Service queries Database
  ↓
Service processes data
  ↓
Returns result to Controller
  ↓
Controller formats response
  ↓
Returns JSON response
```

## 🔐 Authentication & Authorization Flow

### Authentication (JWT)
1. Client sends request with `Authorization: Bearer <token>`
2. `authenticate` middleware verifies token
3. Extracts user info (id, email, role)
4. Attaches `req.user` to request object

### Authorization (Role-Based)
1. `authorize` middleware checks user role
2. Compares against allowed roles
3. Proceeds or returns 403 Forbidden

### Office Access
1. `validateOfficeAccess` middleware checks office assignment
2. Admins/Managers: Access all offices
3. Employees: Only assigned offices
4. Validates before processing attendance

## 📊 Service Layer Responsibilities

### AttendanceService
- **processPunch()**: Main business logic for attendance punching
  - Validates geofence
  - Checks punch sequence
  - Saves attendance record
  - Returns formatted result

- **validatePunchSequence()**: Prevents invalid punch sequences
  - No double punch-in
  - Must punch-in before punch-out

- **getUserAttendanceRecords()**: Fetches user's attendance history
  - Supports date range filtering
  - Supports office filtering
  - Formats data for frontend

### OfficeService
- **getOfficeById()**: Fetches office details
- **getAllOffices()**: Lists all active offices
- **getUserOffices()**: Gets user's assigned offices
- **checkUserOfficeAccess()**: Validates office access
- **getOfficeLocationForMap()**: Optimized data for map rendering

## 🛡️ Security Layers

### 1. Input Validation
- Joi schemas validate all inputs
- Type checking, range validation
- Sanitization of user input

### 2. Authentication
- JWT token verification
- Token expiration handling
- Invalid token rejection

### 3. Authorization
- Role-based access control
- Office assignment validation
- Geofence override permissions

### 4. SQL Injection Prevention
- Parameterized queries only
- No string concatenation
- Sequelize query builder

### 5. Rate Limiting
- Per-IP request limiting
- Prevents abuse
- Configurable thresholds

### 6. Security Headers
- Helmet middleware
- CORS configuration
- XSS protection

## 🔧 Error Handling Strategy

### Error Hierarchy
```
AppError (base)
  ├── BadRequestError (400)
  ├── UnauthorizedError (401)
  ├── ForbiddenError (403)
  ├── NotFoundError (404)
  ├── ValidationError (400)
  └── ConflictError (409)
```

### Error Flow
1. Error thrown in service/controller
2. Caught by error handler middleware
3. Logged to file and console
4. Formatted response sent to client
5. Consistent error structure

## 📝 Logging Strategy

### Log Levels
- **error**: Errors and exceptions
- **warn**: Warning messages
- **info**: General information
- **debug**: Debug information (development only)

### Log Destinations
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

### Logged Events
- Attendance punches
- Geofence overrides
- Authentication failures
- API errors
- Database errors

## 🧮 Distance Calculation

### Haversine Formula Implementation
- Located in `utils/distanceCalculator.js`
- Calculates great-circle distance
- Returns distance in meters
- Validates coordinate ranges
- Used consistently across services

### Geofence Validation
- Compares user location to office location
- Checks against allowed radius
- Returns boolean + distance
- Handles edge cases

## 🔄 Data Flow Examples

### Example 1: Punch Attendance

```
1. Client → POST /api/attendance/punch
   {
     "officeId": 1,
     "latitude": 19.1136,
     "longitude": 72.8697,
     "punchType": "IN"
   }

2. Middleware Chain:
   - authenticate: Verify JWT, extract user
   - canOverrideGeofence: Check override permission
   - validate: Validate request body
   - validateOfficeAccess: Check office assignment

3. Controller:
   - Extract data from request
   - Call attendanceService.processPunch()

4. Service:
   - Fetch office details
   - Calculate distance (Haversine)
   - Validate geofence
   - Check punch sequence
   - Save to database
   - Return result

5. Controller:
   - Format response
   - Return JSON

6. Client receives:
   {
     "success": true,
     "message": "Successfully punched in",
     "data": { ... }
   }
```

### Example 2: Get Office Location

```
1. Client → GET /api/offices/1/location

2. Controller:
   - Extract office ID
   - Call officeService.getOfficeLocationForMap()

3. Service:
   - Query database for office
   - Format data for map
   - Return optimized structure

4. Controller:
   - Return JSON response

5. Client receives:
   {
     "success": true,
     "data": {
       "id": 1,
       "latitude": 19.1136,
       "longitude": 72.8697,
       "radius": 100,
       ...
     }
   }
```

## 🎯 Design Principles

### 1. Separation of Concerns
- Routes: HTTP routing only
- Controllers: Request/response handling
- Services: Business logic
- Utils: Reusable functions

### 2. Single Responsibility
- Each module has one clear purpose
- Services handle one domain each
- Controllers handle one resource each

### 3. DRY (Don't Repeat Yourself)
- Reusable utilities
- Shared middleware
- Common error handling

### 4. Error Handling First
- Try-catch in all async operations
- Custom error classes
- Consistent error responses

### 5. Security by Default
- Authentication required
- Input validation
- SQL injection prevention
- Rate limiting

## 🚀 Scalability Considerations

### Current Architecture Supports:
- Multiple offices
- Multiple countries
- Role-based access
- Geofencing rules per office
- Future attendance rules

### Easy to Extend:
- Additional validation rules
- New attendance types
- Multiple geofence shapes
- Location history tracking
- Analytics endpoints

## 📦 Dependencies Overview

### Core
- **express**: Web framework
- **mysql2**: Database driver
- **sequelize**: ORM (for raw queries)

### Security
- **jsonwebtoken**: JWT authentication
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **cors**: CORS middleware

### Validation & Utilities
- **joi**: Input validation
- **winston**: Logging
- **morgan**: HTTP logging
- **dotenv**: Environment variables

## 🔍 Code Quality

### Best Practices Followed:
- ✅ Consistent error handling
- ✅ Input validation
- ✅ Parameterized queries
- ✅ Logging
- ✅ Environment configuration
- ✅ Modular structure
- ✅ Clear naming conventions
- ✅ Comments and documentation

---

**Status:** ✅ Production Ready
**Architecture:** Layered (Routes → Controllers → Services → Database)
**Pattern:** RESTful API with middleware chain
