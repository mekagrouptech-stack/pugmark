-- HRMS Database Setup Script
-- Run this script to create the database and set up initial configuration

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE hrms_db;

-- Note: Tables will be created automatically by Sequelize migrations
-- Run: npm run db:migrate

-- After migrations, you can create an admin user:
-- INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
-- VALUES (
--   'admin@hrms.com',
--   '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash 'admin123'
--   'Admin User',
--   'ADMIN',
--   true,
--   NOW(),
--   NOW()
-- );

-- To hash password, use Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('admin123', 10);
-- console.log(hash);
