# Backend Server Connection Error - Fix ✅

## Error Message
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:3001/api/users:1
```

## Problem
The backend server is not running on port 3001, so the frontend cannot connect to the API.

---

## ✅ Solution: Start Backend Server

### Option 1: Start Backend Only
```bash
cd backend
npm run dev
```

### Option 2: Start Both Frontend and Backend
```bash
# From project root
npm run start:all
```

### Option 3: Start Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (from root)
npm run dev
```

---

## 🔍 Verify Backend is Running

1. **Check Terminal:**
   - Should see: `✅ Database connection established successfully`
   - Should see: `🚀 Server running on port 3001`

2. **Test API:**
   - Open browser: `http://localhost:3001/health`
   - Should return: `{"success":true,"message":"Server is running"}`

3. **Check Network Tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try creating a user
   - API calls should show status 200 (not ERR_CONNECTION_REFUSED)

---

## 📋 Backend Server Requirements

1. **Database Connection:**
   - MySQL must be running
   - Database `hrms_db` must exist
   - `.env` file in `backend/` directory with correct credentials

2. **Port 3001:**
   - Must be available (not used by another process)
   - Check: `netstat -ano | findstr :3001` (Windows)

3. **Dependencies:**
   - Run `npm install` in `backend/` directory if needed

---

## 🚨 Common Issues

### Issue 1: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue 2: Database Connection Error
**Error:** `Access denied for user` or `Cannot connect to database`

**Solution:**
1. Check MySQL is running
2. Verify `.env` file has correct database credentials
3. Test connection: `mysql -u root -p`

### Issue 3: Missing Dependencies
**Error:** `Cannot find module`

**Solution:**
```bash
cd backend
npm install
```

---

## ✅ After Starting Backend

1. **Backend should show:**
   ```
   ✅ Database connection established successfully
   🚀 Server running on port 3001
   ```

2. **Frontend should work:**
   - User Management page should load
   - Creating/editing users should work
   - No more ERR_CONNECTION_REFUSED errors

---

## 📝 Quick Start Commands

```bash
# Start everything (recommended)
npm run start:all

# Or start separately:
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
npm run dev
```

---

**The backend server must be running for the User Management feature to work!**
