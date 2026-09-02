-- Fix: Unknown column 'hr_head_id' in 'field list'
-- Run this SQL on your database (e.g. mysql -u root -p hrms_db < scripts/add-leaves-columns.sql)
-- Ignore "Duplicate column" errors if columns already exist

-- USERS table (error comes from User model query)
ALTER TABLE users ADD COLUMN hr_head_id INT NULL;

-- LEAVES table
ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL;
ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL;
ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL;
