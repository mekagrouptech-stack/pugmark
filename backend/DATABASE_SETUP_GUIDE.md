# Database Setup Guide

Complete guide to create and set up the HRMS database.

## 🚀 Quick Setup (Recommended)

### Option 1: Automated Setup (Easiest)

Run the complete setup script that does everything:

```bash
cd backend
npm run db:setup
```

This will:
1. ✅ Create the database
2. ✅ Run all migrations (create tables)
3. ✅ Seed sample data (offices)
4. ✅ Create admin user

**That's it!** Your database is ready.

---

## 📋 Manual Setup (Step by Step)

### Step 1: Create Database

**Option A: Using Node.js Script**
```bash
cd backend
npm run db:create
```

**Option B: Using MySQL Command Line**
```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Option C: Using SQL File**
```bash
mysql -u root -p < backend/scripts/setup-database.sql
```

### Step 2: Configure Environment

Ensure your `backend/.env` file has correct database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrms_db
DB_USER=root
DB_PASSWORD=your_password
```

### Step 3: Run Migrations

This creates all tables automatically:

```bash
cd backend
npm run db:migrate
```

**Tables Created:**
- ✅ `users` - User accounts
- ✅ `offices` - Office locations
- ✅ `user_offices` - User-office assignments
- ✅ `attendance_records` - Attendance punches

### Step 4: Seed Sample Data (Optional)

```bash
npm run db:seed
```

This adds sample offices:
- Mumbai Office (India)
- Dubai Office (UAE)
- New York Office (USA)

### Step 5: Create Admin User

```bash
npm run create:admin
```

Or set in `.env`:
```env
ADMIN_EMAIL=admin@hrms.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

---

## 🔍 Verify Database Setup

### Check Database Exists

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'hrms_db';"
```

### Check Tables Created

```bash
mysql -u root -p -e "USE hrms_db; SHOW TABLES;"
```

Expected output:
```
+----------------------+
| Tables_in_hrms_db    |
+----------------------+
| attendance_records   |
| offices              |
| user_offices         |
| users                |
+----------------------+
```

### Check Admin User

```bash
mysql -u root -p -e "USE hrms_db; SELECT id, email, name, role FROM users WHERE role='ADMIN';"
```

---

## 🗄️ Database Structure

### Tables Overview

1. **users**
   - User accounts and authentication
   - Roles: EMPLOYEE, MANAGER, HR, HEAD_HR, ADMIN, HOD

2. **offices**
   - Office locations with geofencing settings
   - Multi-country support

3. **user_offices**
   - Many-to-many relationship
   - User-office assignments

4. **attendance_records**
   - Attendance punch records
   - Location data (latitude, longitude)
   - Geofence validation results

See `DATABASE_SCHEMA.md` for complete schema documentation.

---

## 🔧 Troubleshooting

### Error: "Access denied for user"

**Solution:**
- Check database credentials in `.env`
- Verify MySQL user has CREATE DATABASE permission
- Try: `GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';`

### Error: "Database already exists"

**Solution:**
- This is fine, the script will skip creation
- Or drop and recreate: `DROP DATABASE hrms_db;`

### Error: "Table already exists"

**Solution:**
- Rollback migrations: `npm run db:migrate:undo:all`
- Then run: `npm run db:migrate`

### Error: "Cannot connect to MySQL"

**Solution:**
- Ensure MySQL server is running
- Check host and port in `.env`
- Test connection: `mysql -u root -p -h localhost`

### Error: "Sequelize CLI not found"

**Solution:**
```bash
npm install sequelize-cli --save-dev
```

---

## 📊 Database Management Commands

### View All Tables
```bash
mysql -u root -p -e "USE hrms_db; SHOW TABLES;"
```

### View Table Structure
```bash
mysql -u root -p -e "USE hrms_db; DESCRIBE users;"
```

### Count Records
```bash
mysql -u root -p -e "USE hrms_db; SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM offices;"
```

### Backup Database
```bash
mysqldump -u root -p hrms_db > hrms_db_backup.sql
```

### Restore Database
```bash
mysql -u root -p hrms_db < hrms_db_backup.sql
```

### Drop Database (⚠️ Deletes all data)
```bash
mysql -u root -p -e "DROP DATABASE hrms_db;"
```

---

## 🔄 Reset Database

To completely reset the database:

```bash
cd backend
npm run db:reset
```

This will:
1. Rollback all migrations
2. Run migrations again
3. Seed sample data

**⚠️ Warning:** This deletes all data!

---

## ✅ Setup Verification Checklist

After setup, verify:

- [ ] Database `hrms_db` exists
- [ ] All 4 tables created (users, offices, user_offices, attendance_records)
- [ ] Sample offices seeded (3 offices)
- [ ] Admin user created
- [ ] Can connect from backend (test with `npm run dev`)
- [ ] Can login with admin credentials

---

## 🎯 Next Steps

After database setup:

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test Connection:**
   - Check console for: "✅ Database connection established successfully"

3. **Test Login:**
   - Navigate to frontend login page
   - Use: `admin@hrms.com` / `admin123`

4. **Create More Users:**
   - Via backend API or SQL
   - Assign offices to users

---

## 📚 Related Documentation

- **Database Schema:** `DATABASE_SCHEMA.md`
- **API Documentation:** `API_DOCUMENTATION.md`
- **Backend Setup:** `README.md`
- **Complete Setup:** `COMPLETE_SETUP.md`

---

**Status:** ✅ Ready to Use
**Last Updated:** 2024-01-15
