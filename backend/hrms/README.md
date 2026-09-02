# HRMS Location-Based Attendance Backend

Production-ready Node.js + Express backend with **automatically generated database schema** for location-based attendance system with geofencing.

## 🚀 Features

- ✅ **Auto-generated Database Schema** - Migrations create all tables automatically
- ✅ **Sequelize ORM** - Type-safe database operations
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Authorization** - Employee, Manager, HR, Admin roles
- ✅ **Location-Based Attendance** - GPS coordinate validation
- ✅ **Geofencing** - Haversine formula distance calculation
- ✅ **Multi-Office Support** - Multiple offices globally
- ✅ **Input Validation** - Joi validation schemas
- ✅ **Error Handling** - Centralized error management
- ✅ **Logging** - Winston logger with file output
- ✅ **Security** - Rate limiting, CORS, Helmet

## 📊 Database Schema (Auto-Generated)

The backend automatically creates these tables via migrations:

1. **users** - User accounts with roles
2. **offices** - Office locations with geofencing settings
3. **user_offices** - User-office assignments (Many-to-Many)
4. **attendance_records** - Attendance punches with location data

See `DATABASE_SCHEMA.md` for complete schema documentation.

## 🔧 Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrms_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
```

### 3. Create Database & Setup (Easiest Way)

**One Command Setup:**
```bash
npm run db:setup
```

This automatically:
- ✅ Creates the database
- ✅ Runs all migrations (creates tables)
- ✅ Seeds sample data
- ✅ Creates admin user

**OR Manual Setup:**

Create database:
```bash
npm run db:create
```

Or using MySQL:
```sql
CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Migrations (Creates All Tables)

```bash
npm run db:migrate
```

This automatically creates:
- `users` table
- `offices` table
- `user_offices` table
- `attendance_records` table
- All indexes and foreign keys

### 5. Seed Sample Data (Optional)

```bash
npm run db:seed
```

### 6. Create Admin User

```bash
npm run create:admin
```

Or set in `.env`:
```env
ADMIN_EMAIL=admin@hrms.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

### 7. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Attendance
- `POST /api/attendance/punch` - Punch in/out with location
- `GET /api/attendance/records` - Get attendance records
- `GET /api/attendance/records/:id` - Get specific record

### Offices
- `GET /api/offices` - Get all offices
- `GET /api/offices/:id/location` - Get office location for map
- `GET /api/offices/user/:userId` - Get user's assigned offices
- `GET /api/offices/:id/access` - Check office access

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js      # Sequelize connection
│   └── config.js        # Sequelize CLI config
├── controllers/
│   ├── authController.js
│   ├── attendanceController.js
│   └── officeController.js
├── middleware/
│   ├── auth.js          # JWT authentication
│   ├── authorize.js     # Role authorization
│   ├── officeAccess.js  # Office access validation
│   └── errorHandler.js  # Global error handler
├── migrations/          # Database migrations (auto-creates tables)
│   ├── 20240115000001-create-users.js
│   ├── 20240115000002-create-offices.js
│   ├── 20240115000003-create-user-offices.js
│   └── 20240115000004-create-attendance-records.js
├── models/             # Sequelize models
│   ├── index.js
│   ├── User.js
│   ├── Office.js
│   ├── AttendanceRecord.js
│   └── UserOffice.js
├── routes/
│   ├── authRoutes.js
│   ├── attendanceRoutes.js
│   └── officeRoutes.js
├── seeders/            # Sample data
│   └── 20240115000001-seed-offices.js
├── services/           # Business logic
│   ├── attendanceService.js
│   └── officeService.js
├── utils/
│   ├── distanceCalculator.js  # Haversine formula
│   ├── errors.js              # Custom errors
│   ├── logger.js              # Winston logger
│   └── validators.js          # Joi schemas
├── scripts/
│   └── create-admin-user.js
├── server.js           # Application entry
└── package.json
```

## 🗄️ Database Management

### Run Migrations
```bash
npm run db:migrate
```

### Rollback Migration
```bash
npm run db:migrate:undo
```

### Run Seeders
```bash
npm run db:seed
```

### Reset Database
```bash
npm run db:reset
```

## 🔐 Authentication Flow

1. User logs in via `POST /api/auth/login`
2. Backend validates credentials
3. Returns JWT token
4. Client includes token in `Authorization: Bearer <token>` header
5. Middleware verifies token on protected routes

## 📊 Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation (Joi)
- SQL injection prevention (Sequelize ORM)
- Rate limiting
- CORS protection
- Security headers (Helmet)

## 📝 Documentation

- `README.md` - This file
- `API_DOCUMENTATION.md` - Complete API reference
- `DATABASE_SCHEMA.md` - Database schema details
- `BACKEND_ARCHITECTURE.md` - Architecture documentation
- `SETUP_GUIDE.md` - Detailed setup
- `COMPLETE_SETUP.md` - Complete setup guide

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrms.com","password":"admin123"}'
```

### Test Punch
```bash
curl -X POST http://localhost:3001/api/attendance/punch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "officeId": 1,
    "latitude": 19.1136,
    "longitude": 72.8697,
    "punchType": "IN"
  }'
```

## 🚀 Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Run migrations: `npm run db:migrate`
5. Use process manager (PM2)
6. Configure reverse proxy (nginx)
7. Enable HTTPS

## ✅ Status

- ✅ Database schema auto-generated
- ✅ Migrations ready
- ✅ Models with associations
- ✅ All APIs implemented
- ✅ Authentication & authorization
- ✅ Geofencing validation
- ✅ Production-ready code

---

**Version:** 1.0.0
**Status:** ✅ Production Ready
**Database:** ✅ Auto-Generated via Migrations
