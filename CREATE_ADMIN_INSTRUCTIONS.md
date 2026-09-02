# Creating Admin Login Credentials

## 🔧 Step 1: Setup Backend .env File

**If you don't have a `.env` file in the `backend/` directory**, create one with your database credentials:

Create `backend/.env` file with:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrms_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Important**: Replace `your_mysql_password_here` with your actual MySQL password!

---

## 👤 Step 2: Create Admin User

### Option A: Using NPM Script (Recommended)
```bash
cd backend
npm run create:new-admin
```

Then provide:
- Admin Name
- Email
- Password

### Option B: Using Command Line Arguments
```bash
cd backend
node scripts/create-new-admin.js --name "Admin Name" --email "admin@hrms.com" --password "Admin@123"
```

### Option C: Using Default Admin Script
```bash
cd backend
npm run create:admin
```

This creates:
- Email: `admin@hrms.com`
- Password: `admin123`

---

## 🔑 Admin Credentials Created Earlier

If you already created an admin user, use these credentials:

**Email:** `hradmin@hrms.com`  
**Password:** `HRAdmin@2024`

---

## ✅ Verify Admin User

Check if admin exists:
```bash
cd backend
node -e "const {User} = require('./models'); const {connectDB} = require('./config/database'); require('dotenv').config(); (async () => { await connectDB(); const admins = await User.findAll({where: {role: 'ADMIN'}, attributes: ['id', 'name', 'email', 'employeeCode']}); console.log('Admin Users:'); admins.forEach(a => console.log(`- ${a.name} (${a.email}) - ${a.employeeCode}`)); process.exit(0); })()"
```

---

## 🚨 Troubleshooting

### "Access denied" Error
- Check your MySQL password in `.env` file
- Ensure MySQL is running
- Verify database `hrms_db` exists

### "User already exists" Error
- Admin with that email already exists
- Use a different email or login with existing credentials

### Database Connection Error
- Check MySQL is running: `mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`
- Check `.env` file has correct credentials

---

**After creating admin, use the credentials to login at http://localhost:3000/login**
