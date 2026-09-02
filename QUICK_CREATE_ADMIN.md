# Quick Guide: Create Admin Login Credentials

## 🚨 Important: Database Password Required

Before creating admin, ensure your `backend/.env` file has the correct MySQL password.

---

## ✅ Quick Steps

### 1. Edit `backend/.env` file
Open `backend/.env` and set your MySQL password:
```env
DB_PASSWORD=your_actual_mysql_password
```

**If your MySQL has no password**, leave it empty:
```env
DB_PASSWORD=
```

### 2. Create Admin User

#### Option A: Interactive (Recommended)
```bash
cd backend
npm run create:new-admin
```

Then enter:
- Name: `System Administrator`
- Email: `admin@hrms.com`
- Password: `Admin@123` (or your preferred password)

#### Option B: Command Line
```bash
cd backend
node scripts/create-new-admin.js --name "Admin" --email "admin@hrms.com" --password "Admin@123"
```

---

## 📋 Default Admin Credentials (If Already Created)

**Email:** `hradmin@hrms.com`  
**Password:** `HRAdmin@2024`

Or

**Email:** `admin@hrms.com`  
**Password:** `admin123`

---

## 🔍 Check Existing Admins

To see all admin users in your database:

```bash
cd backend
node scripts/check-errors.js
```

Then check the database directly or use the query in CREATE_ADMIN_INSTRUCTIONS.md

---

## 🎯 Login

After creating admin, go to:
**http://localhost:3000/login**

Use the email and password you created.

---

## ❗ If Database Error Occurs

1. **Check MySQL is running**
   ```bash
   mysql -u root -p
   ```

2. **Verify database exists**
   ```sql
   SHOW DATABASES;
   USE hrms_db;
   ```

3. **Check .env file** in `backend/` directory has:
   - `DB_HOST=localhost`
   - `DB_USER=root`
   - `DB_PASSWORD=your_password` (or empty if no password)
   - `DB_NAME=hrms_db`

---

**Once .env is configured correctly, run the create admin script again!**
