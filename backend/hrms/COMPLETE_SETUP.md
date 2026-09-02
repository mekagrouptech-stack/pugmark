# Complete Backend Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy and configure environment file:
```bash
cp env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrms_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
```

### 3. Create Database

```sql
CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Migrations

This will automatically create all database tables:
```bash
npm run db:migrate
```

### 5. Seed Sample Data (Optional)

```bash
npm run db:seed
```

This seeds sample offices (Mumbai, Dubai, New York).

### 6. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## 📊 Database Schema

The migrations automatically create:

1. **users** - User accounts
2. **offices** - Office locations
3. **user_offices** - User-office assignments
4. **attendance_records** - Attendance punch records

See `DATABASE_SCHEMA.md` for complete schema documentation.

## 🔐 Authentication

### Create Admin User (Manual)

After running migrations, create an admin user:

```sql
INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
VALUES (
  'admin@hrms.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash password
  'Admin User',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

Or use a script to create users (recommended).

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)

### Attendance
- `POST /api/attendance/punch` - Punch in/out
- `GET /api/attendance/records` - Get attendance records
- `GET /api/attendance/records/:id` - Get specific record

### Offices
- `GET /api/offices` - Get all offices
- `GET /api/offices/:id/location` - Get office location for map
- `GET /api/offices/user/:userId` - Get user's assigned offices
- `GET /api/offices/:id/access` - Check office access

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hrms.com",
    "password": "password123"
  }'
```

### Test Punch Attendance
```bash
curl -X POST http://localhost:3001/api/attendance/punch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "officeId": 1,
    "latitude": 19.1136,
    "longitude": 72.8697,
    "punchType": "IN"
  }'
```

## 📝 Database Management

### Run Migrations
```bash
npm run db:migrate
```

### Rollback Last Migration
```bash
npm run db:migrate:undo
```

### Rollback All Migrations
```bash
npm run db:migrate:undo:all
```

### Run Seeders
```bash
npm run db:seed
```

### Reset Database (Rollback + Migrate + Seed)
```bash
npm run db:reset
```

## 🔧 Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists
- Test connection: `mysql -u root -p -e "USE hrms_db;"`

### Migration Errors
- Ensure database is empty or use `db:migrate:undo:all` first
- Check MySQL version (8.0+ recommended)
- Verify user has CREATE TABLE permissions

### Model Import Errors
- Ensure all models are properly exported in `models/index.js`
- Check Sequelize version compatibility
- Verify database connection is established

## 📚 Documentation

- `README.md` - Overview
- `API_DOCUMENTATION.md` - Complete API reference
- `DATABASE_SCHEMA.md` - Database schema details
- `BACKEND_ARCHITECTURE.md` - Architecture documentation
- `SETUP_GUIDE.md` - Detailed setup instructions

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Database created
- [ ] Migrations run successfully
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Can login and get JWT token
- [ ] Can punch attendance
- [ ] Can fetch offices

---

**Status:** ✅ Production Ready
**Database:** ✅ Auto-generated via Migrations
**ORM:** ✅ Sequelize with Models
