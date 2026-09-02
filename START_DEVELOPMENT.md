# 🚀 Starting Development Servers

This guide shows you how to start both frontend and backend servers for the HRMS application.

---

## 📋 Option 1: Run Both Servers at Once (Recommended)

### Using the Start Script
```bash
npm run start:all
```

This will automatically start both backend and frontend servers in a single command.

---

## 📋 Option 2: Run Servers Separately (Two Terminal Windows)

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

Backend will run on: **http://localhost:3001**

### Terminal 2 - Frontend Server
```bash
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## 📋 Option 3: Using Individual NPM Scripts

### Start Backend Only
```bash
npm run start:backend
```

### Start Frontend Only
```bash
npm run start:frontend
```

---

## 🌐 Server URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Backend Health Check**: http://localhost:3001/health

---

## 🔧 Prerequisites

Before starting, make sure you have:

1. ✅ **Node.js** installed (v14 or higher)
2. ✅ **Dependencies installed**:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```
3. ✅ **Database configured**:
   - MySQL database running
   - `.env` file in `backend/` directory with database credentials
4. ✅ **Database migrations run**:
   ```bash
   cd backend
   npm run db:migrate
   ```

---

## 🛑 Stopping Servers

- **If using Option 1**: Press `Ctrl+C` to stop both servers
- **If using Option 2**: Press `Ctrl+C` in each terminal window

---

## 📝 Quick Start Commands

```bash
# Install all dependencies
npm install && cd backend && npm install && cd ..

# Run database migrations
cd backend && npm run db:migrate && cd ..

# Start both servers
npm run start:all
```

---

## 🐛 Troubleshooting

### Port Already in Use
If you get "port already in use" error:
- **Backend (3001)**: Stop any existing backend server or change `PORT` in `backend/.env`
- **Frontend (3000)**: Stop any existing frontend server or change port in `vite.config.js`

### Database Connection Error
- Check your `.env` file in `backend/` directory
- Ensure MySQL is running
- Verify database credentials

### Module Not Found Errors
- Run `npm install` in both root and `backend/` directories
- Delete `node_modules` and `package-lock.json`, then reinstall

---

## 📚 Additional Commands

### Create Admin User
```bash
cd backend
npm run create:new-admin
```

### Check for Errors
```bash
cd backend
node scripts/check-errors.js
```

---

**Happy Coding! 🎉**
