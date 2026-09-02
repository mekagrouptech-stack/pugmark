# Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install
```bash
cd backend
npm install
```

### Step 2: Configure
```bash
cp env.example .env
# Edit .env with your database credentials
```

### Step 3: Create Database
```sql
CREATE DATABASE hrms_db;
```

### Step 4: Run Migrations (Auto-creates all tables)
```bash
npm run db:migrate
```

### Step 5: Create Admin User
```bash
npm run create:admin
```

### Step 6: Start Server
```bash
npm run dev
```

## ✅ Verify Installation

1. Check health: `curl http://localhost:3001/health`
2. Login: `POST /api/auth/login` with admin credentials
3. Get token and test punch: `POST /api/attendance/punch`

## 📊 Database Tables Created

Migrations automatically create:
- ✅ `users` - User accounts
- ✅ `offices` - Office locations  
- ✅ `user_offices` - User-office assignments
- ✅ `attendance_records` - Attendance punches

All with proper:
- ✅ Foreign keys
- ✅ Indexes
- ✅ Constraints
- ✅ Relationships

## 🎯 Next Steps

1. Seed sample offices: `npm run db:seed`
2. Create test users via API or SQL
3. Test attendance punching
4. Integrate with frontend

---

**That's it!** Your backend is ready with a complete database schema.
