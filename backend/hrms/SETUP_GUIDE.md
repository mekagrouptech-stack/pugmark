# Backend Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrms_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

Ensure your MySQL database exists and contains the required tables:
- `offices` - Office locations
- `attendance_records` - Attendance punch records
- `user_offices` - User-office assignments
- `users` - User accounts

**Note:** The backend assumes these tables exist. It does not create them.

### 4. Start Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### 5. Verify Installation

Check health endpoint:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## Testing API Endpoints

### Test Authentication

You'll need a valid JWT token. The token should contain:
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "name": "John Doe"
}
```

### Test Punch Attendance

```bash
curl -X POST http://localhost:3001/api/attendance/punch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "officeId": 1,
    "latitude": 19.1136,
    "longitude": 72.8697,
    "punchType": "IN"
  }'
```

### Test Get Offices

```bash
curl http://localhost:3001/api/offices
```

## Database Query Examples

The backend uses raw SQL queries. Here are examples of what the queries expect:

### Offices Table Structure (Assumed)
```sql
-- Example columns (not a schema definition, just reference)
id INT PRIMARY KEY
name VARCHAR(255)
country VARCHAR(100)
address TEXT
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)
radius INT
is_active TINYINT(1)
strict_geofencing TINYINT(1)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Attendance Records Table Structure (Assumed)
```sql
-- Example columns (not a schema definition, just reference)
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT
office_id INT
punch_type ENUM('IN', 'OUT')
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)
distance INT
is_within_radius TINYINT(1)
remark TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### User Offices Table Structure (Assumed)
```sql
-- Example columns (not a schema definition, just reference)
user_id INT
office_id INT
PRIMARY KEY (user_id, office_id)
```

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure database exists
- Check network connectivity

### JWT Token Errors
- Verify `JWT_SECRET` is set in `.env`
- Check token format: `Bearer <token>`
- Ensure token is not expired

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process using port 3001

### Module Not Found
- Run `npm install` again
- Check `node_modules` exists
- Verify Node.js version

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure production database
4. Set up process manager (PM2)
5. Configure reverse proxy (nginx)
6. Enable HTTPS
7. Set up monitoring
8. Configure log rotation

## Next Steps

1. Integrate with your existing database
2. Update queries to match your schema
3. Add authentication endpoints (login, register)
4. Configure CORS for your frontend domain
5. Set up monitoring and alerts
6. Add unit tests
7. Configure CI/CD pipeline

---

For detailed API documentation, see `API_DOCUMENTATION.md`
For architecture details, see `BACKEND_ARCHITECTURE.md`
