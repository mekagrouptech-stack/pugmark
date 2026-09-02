# 🚀 Quick Database Setup

## Run without MySQL (SQLite)

If MySQL is not installed or not running, you can use SQLite for local development:

1. In `backend/.env`, add:
   ```env
   USE_SQLITE=true
   ```
2. Create tables (one time): `cd backend && npm run db:migrate`
3. Start the backend: `npm run dev`

The app will use the SQLite database at `backend/data/hrms.sqlite`. No MySQL required.

---

## One Command Setup (MySQL)

```bash
cd backend
npm run db:setup
```

**That's it!** This single command will:
1. ✅ Create the database `hrms_db`
2. ✅ Create all tables (users, offices, user_offices, attendance_records)
3. ✅ Add sample offices (Mumbai, Dubai, New York)
4. ✅ Create admin user (admin@hrms.com / admin123)

---

## Prerequisites

1. **MySQL installed and running**
   - Check: `mysql --version`
   - Start MySQL service if needed

2. **Environment configured**
   - Copy `env.example` to `.env`
   - Update database credentials:
     ```env
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=hrms_db
     DB_USER=root
     DB_PASSWORD=your_password
     ```

3. **Dependencies installed**
   ```bash
   npm install
   ```

---

## Manual Setup (If Needed)

### Step 1: Create Database
```bash
npm run db:create
```

### Step 2: Run Migrations
```bash
npm run db:migrate
```

### Step 3: Seed Data
```bash
npm run db:seed
```

### Step 4: Create Admin
```bash
npm run create:admin
```

---

## Verify Setup

### Check Database
```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'hrms_db';"
```

### Check Tables
```bash
mysql -u root -p -e "USE hrms_db; SHOW TABLES;"
```

### Check Admin User
```bash
mysql -u root -p -e "USE hrms_db; SELECT email, name, role FROM users WHERE role='ADMIN';"
```

---

## Start Backend

After database setup:

```bash
npm run dev
```

You should see:
```
✅ Database connection established successfully
🚀 Server running on port 3001
```

---

## Test Login

1. Start frontend: `npm run dev` (from project root)
2. Navigate to: `http://localhost:3000/login`
3. Login with:
   - Email: `admin@hrms.com`
   - Password: `admin123`

---

## Troubleshooting

### "Access denied for user"
- Check `.env` file credentials
- Verify MySQL user has permissions

### "Database already exists"
- This is fine, setup will continue

### "Cannot connect to MySQL"
- Ensure MySQL is running
- Check host/port in `.env`

---

**Need more help?** See `DATABASE_SETUP_GUIDE.md` for detailed instructions.
