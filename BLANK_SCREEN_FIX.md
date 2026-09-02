# Blank Screen Fix Guide

## ✅ Fixes Applied

### 1. Added Error Boundary
- Created `src/components/ErrorBoundary.jsx` to catch React errors
- Wrapped the app in ErrorBoundary to display helpful error messages

### 2. Added Loading Screen
- Added loading state check in AppRoutes
- Shows loading spinner while checking authentication

### 3. Improved Route Handling
- Fixed root route (`/`) to redirect to login if not authenticated
- Fixed 404 routes to redirect properly based on auth status

### 4. Added Environment Variable
- Created `.env` file with API base URL
- Default: `VITE_API_BASE_URL=http://localhost:3001/api`

## 🔧 Quick Fixes

### Check Browser Console
Open browser DevTools (F12) and check for errors:
1. **Console tab** - Look for red error messages
2. **Network tab** - Check if API calls are failing
3. **Elements tab** - Verify HTML is rendering

### Common Issues and Solutions

#### 1. API Connection Error
**Symptom**: Blank screen, console shows API errors

**Fix**: 
- Ensure backend is running on port 3001
- Check `.env` file has correct API URL:
  ```
  VITE_API_BASE_URL=http://localhost:3001/api
  ```

#### 2. Authentication Issue
**Symptom**: Stuck on blank screen, redirecting in loop

**Fix**:
- Clear browser localStorage:
  ```javascript
  localStorage.clear()
  ```
- Then refresh the page

#### 3. Missing Dependencies
**Symptom**: Module not found errors

**Fix**:
```bash
npm install
```

#### 4. Build/Cache Issue
**Symptom**: Old code showing, changes not reflecting

**Fix**:
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run dev
```

## 🚀 Start Fresh

If still seeing blank screen:

1. **Stop all servers** (Ctrl+C)

2. **Clear everything**:
   ```bash
   # Clear node_modules cache
   rm -rf node_modules/.vite
   
   # Clear localStorage (in browser console)
   localStorage.clear()
   ```

3. **Restart both servers**:
   ```bash
   npm run start:all
   ```

4. **Open browser**:
   - Go to: http://localhost:3000
   - Open DevTools (F12)
   - Check Console for errors

## 📋 Debug Checklist

- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 3000
- [ ] `.env` file exists in root directory
- [ ] No errors in browser console
- [ ] Network requests are successful (check Network tab)
- [ ] localStorage is cleared (if stuck in redirect loop)

## 🔍 Error Messages to Look For

### "Cannot GET /"
- **Cause**: Route not found
- **Fix**: Ensure you're going to `/login` or `/dashboard`

### "Network Error" or CORS Error
- **Cause**: Backend not running or CORS misconfiguration
- **Fix**: Start backend server

### "Module not found"
- **Cause**: Missing dependency
- **Fix**: Run `npm install`

### "Unexpected token" or Syntax Error
- **Cause**: Code syntax error
- **Fix**: Check the file mentioned in error, fix syntax

## 💡 Expected Behavior

1. **First Visit (Not Logged In)**:
   - Should redirect to `/login`
   - Show login page

2. **After Login**:
   - Should redirect to `/dashboard`
   - Show dashboard page

3. **If Error Occurs**:
   - Should show error boundary with error message
   - Option to go back to login

## 📞 Still Having Issues?

1. **Check terminal output** for both frontend and backend
2. **Check browser console** (F12 → Console tab)
3. **Check Network tab** to see if API calls are working
4. **Try incognito/private window** to rule out cache issues

---

**The app should now properly show login page instead of blank screen!**
