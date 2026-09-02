# How to Start Backend Server - Step by Step

## 🚨 Error: ERR_CONNECTION_REFUSED

This means the backend server is **NOT running**. Follow these steps:

---

## ✅ Step-by-Step Solution

### Step 1: Open a New Terminal/Command Prompt

**Important:** Use a **separate terminal window** (not the one running frontend)

### Step 2: Navigate to Backend Directory

```bash
cd C:\Users\USER\Desktop\HRMS\backend
```

### Step 3: Check .env File

Make sure `backend/.env` file exists with:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrms_db
DB_USER=root
DB_PASSWORD=your_mysql_password
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Step 4: Install Dependencies (if needed)

```bash
npm install
```

### Step 5: Start Backend Server

```bash
npm run dev
```

**OR**

```bash
node server.js
```

---

## ✅ Expected Output

When backend starts successfully, you should see:

```
✅ Database connection established successfully
🚀 Server running on port 3001
📝 Environment: development
```

---

## 🔍 Verify Backend is Running

### Test 1: Check Health Endpoint
Open browser: `http://localhost:3001/health`

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### Test 2: Check Port
```bash
netstat -ano | findstr :3001
```

Should show a process listening on port 3001.

---

## 🚨 Common Issues & Fixes

### Issue 1: Database Connection Error

**Error:** `Access denied for user` or `Cannot connect to database`

**Fix:**
1. Make sure MySQL is running
2. Check `.env` file has correct password
3. Test MySQL connection:
   ```bash
   mysql -u root -p
   ```

### Issue 2: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Fix:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F

# Then start server again
npm run dev
```

### Issue 3: Missing Dependencies

**Error:** `Cannot find module`

**Fix:**
```bash
cd backend
npm install
```

### Issue 4: .env File Missing

**Error:** Database connection fails

**Fix:**
```bash
cd backend
copy env.example .env
# Then edit .env with your database credentials
```

---

## 📋 Quick Start Commands

### Start Backend Only:
```bash
cd backend
npm run dev
```

### Start Both Frontend and Backend:
```bash
# From project root
npm run start:all
```

---

## ✅ After Backend Starts

1. **Keep the terminal open** (don't close it)
2. **Go back to your browser**
3. **Refresh the User Management page**
4. **Try creating/editing a user again**
5. **Error should be gone!**

---

## 🎯 Important Notes

- ✅ Backend must be running **before** using User Management
- ✅ Backend runs on port **3001**
- ✅ Frontend runs on port **3000**
- ✅ Both must be running simultaneously
- ✅ Keep both terminal windows open

---

**Once the backend server is running, the ERR_CONNECTION_REFUSED error will be resolved!**
