-- Fix: Add hr_head_id and related columns to leaves table
-- Run in MySQL: mysql -u root -p hrms_db < migrations/fix-hr-head-id.sql
-- Or copy-paste each line into MySQL Workbench / phpMyAdmin

ALTER TABLE leaves ADD COLUMN hr_head_id INT NULL;
ALTER TABLE leaves ADD COLUMN manager_approved_by INT NULL;
ALTER TABLE leaves ADD COLUMN manager_approved_at DATETIME NULL;
CREATE INDEX idx_leaves_hr_head_id ON leaves(hr_head_id);

-- If any statement fails with "Duplicate column name", that column already exists - skip it.
