# Quick Fix for Blank Screen Issue

## 🚨 Immediate Steps to Fix Blank Screen

### Step 1: Create `.env` File
Create a file named `.env` in the **root directory** (same level as `package.json`):

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Step 2: Clear Browser Cache
1. Open browser DevTools (Press F12)
2. Go to Console tab
3. Type and press Enter:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

### Step 3: Restart Servers
```bash
# Stop both servers (Ctrl+C)
# Then restart:
npm run start:all
```

### Step 4: Open Browser
Go to: **http://localhost:3000/login**

---

## ✅ Fixes Already Applied

1. ✅ **Error Boundary** - Catches React errors and shows helpful messages
2. ✅ **Loading Screen** - Shows while checking authentication
3. ✅ **Route Fixes** - Proper redirects based on auth status
4. ✅ **Default Route** - Redirects to `/login` if not authenticated

---

## 🔍 Check Browser Console

Press **F12** → **Console tab** and look for:

### If you see errors:
1. **"Cannot find module"** → Run `npm install`
2. **"Network Error"** → Backend not running, start it with `cd backend && npm run dev`
3. **"CORS Error"** → Check backend CORS settings
4. **"Module not found"** → Run `npm install` in both root and backend

### If console is clean:
The app should be working. If still blank:
1. Try **incognito/private window**
2. Clear browser cache completely
3. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

---

## 📋 Verify These Are Running

### Terminal 1 - Backend:
```
✅ Server running on port 3001
✅ Database connection established successfully
```

### Terminal 2 - Frontend (or same terminal if using start:all):
```
✅ VITE v5.0.8  ready in XXX ms
✅ ➜  Local:   http://localhost:3000/
```

---

## 🎯 Expected Result

After these steps, you should see:
- **Login page** (if not logged in)
- **Dashboard page** (if already logged in)

If you still see a blank screen, check the **Console tab** in DevTools and share the error message!

---

## 💡 Common Issues

| Issue | Solution |
|-------|----------|
| Blank white screen | Create `.env` file, clear localStorage |
| Redirect loop | Clear localStorage and refresh |
| "Cannot GET /" | Go to `/login` instead of root |
| API errors | Ensure backend is running on port 3001 |
| Module errors | Run `npm install` in both directories |

---

**The blank screen should now be resolved! 🎉**
