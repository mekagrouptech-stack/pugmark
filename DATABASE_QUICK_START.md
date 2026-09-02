# 🗄️ Database Quick Start

## ⚡ Fastest Way to Create Database

### One Command Setup

```bash
cd backend
npm run db:setup
```

**Done!** Your database is ready with:
- ✅ Database `hrms_db` created
- ✅ All tables created (users, offices, user_offices, attendance_records)
- ✅ Sample offices added
- ✅ Admin user created (admin@hrms.com / admin123)

---

## 📋 What Gets Created

### Database: `hrms_db`
- Character set: UTF8MB4
- Collation: utf8mb4_unicode_ci

### Tables:
1. **users** - User accounts and authentication
2. **offices** - Office locations with geofencing
3. **user_offices** - User-office assignments
4. **attendance_records** - Attendance punch records

### Sample Data:
- 3 Offices (Mumbai, Dubai, New York)
- 1 Admin user

---

## 🔧 Prerequisites

1. **MySQL installed**
   ```bash
   mysql --version
   ```

2. **MySQL running**
   - Windows: Check Services
   - Mac/Linux: `sudo service mysql start`

3. **Environment file**
   ```bash
   cd backend
   cp env.example .env
   ```
   
   Edit `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=hrms_db
   DB_USER=root
   DB_PASSWORD=your_password
   ```

---

## ✅ Verify Setup

### Check Database Exists
```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'hrms_db';"
```

### Check Tables
```bash
mysql -u root -p -e "USE hrms_db; SHOW TABLES;"
```

Expected:
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
mysql -u root -p -e "USE hrms_db; SELECT email, name, role FROM users;"
```

---

## 🚀 Next Steps

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Login:**
   - Go to: `http://localhost:3000/login`
   - Email: `admin@hrms.com`
   - Password: `admin123`

---

## 🔄 Reset Database

To completely reset (⚠️ deletes all data):

```bash
cd backend
npm run db:reset
```

---

## 📚 More Information

- **Detailed Guide:** `backend/DATABASE_SETUP_GUIDE.md`
- **Schema Docs:** `backend/DATABASE_SCHEMA.md`
- **Backend Setup:** `backend/README.md`

---

**Status:** ✅ Ready to Use
