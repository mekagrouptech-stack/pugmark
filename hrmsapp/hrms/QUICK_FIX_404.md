# Quick Fix for 404 Error

## The Problem
You're getting a 404 error because the backend server is not running or not accessible.

## Solution

### Step 1: Start the Backend Server

Open a **new terminal** and run:

```bash
cd C:\Users\USER\Desktop\HRMS\backend
npm run dev
```

You should see:
```
Server running on port 3001
Database connected successfully
```

**IMPORTANT:** Keep this terminal open! The server must be running for the app to work.

### Step 2: Verify Backend is Running

Open your browser and go to:
```
http://localhost:3001/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### Step 3: Test Login Endpoint

You can test the login endpoint directly:
```bash
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@hrms.com\",\"password\":\"Admin@123\"}"
```

### Step 4: Check Browser Console

1. Open your app in the browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for: `API Base URL: http://localhost:3001/api`
5. Try to login
6. Check Network tab to see the actual URL being called

## Common Issues

### Issue 1: Backend Not Running
**Solution:** Start the backend server (Step 1 above)

### Issue 2: Wrong Port
**Solution:** Make sure backend is on port 3001. Check `backend/server.js` or `backend/.env`

### Issue 3: CORS Error
**Solution:** The backend CORS is already configured. If you still see CORS errors, check `backend/server.js` CORS settings.

### Issue 4: Wrong API URL
**Solution:** 
- For web: Should be `http://localhost:3001/api`
- Check browser console for the actual URL being used

## Still Not Working?

1. **Check if backend is actually running:**
   - Look for "Server running on port 3001" in backend terminal
   - Try accessing `http://localhost:3001/health` in browser

2. **Check the exact error:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to login
   - Click on the failed request
   - Check the "Request URL" - it should be `http://localhost:3001/api/auth/login`

3. **Verify backend routes:**
   - The login route is at: `POST /api/auth/login`
   - Check `backend/routes/authRoutes.js` to confirm

4. **Restart everything:**
   - Stop backend server (Ctrl+C)
   - Stop frontend/app
   - Start backend: `cd backend && npm run dev`
   - Start app: `cd hrmsapp/hrms && npx expo start`
