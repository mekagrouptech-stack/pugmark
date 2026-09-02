-- Run this in MySQL (hrms_db) if the Node migration script fails.
-- Example: mysql -u root -p hrms_db < scripts/create-reimbursement-tables.sql

CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reimbursement_requests_user_id (user_id),
  INDEX idx_reimbursement_requests_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reimbursement_expense_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reimbursement_request_id INT NOT NULL,
  type VARCHAR(100) NULL,
  expense_date DATE NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  purpose TEXT NULL,
  proof_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reimbursement_expense_items_request_id (reimbursement_request_id),
  FOREIGN KEY (reimbursement_request_id) REFERENCES reimbursement_requests(id) ON UPDATE CASCADE ON DELETE CASCADE
);
