/**
 * Create leave_approvals table if missing.
 * Run: cd backend && npm run db:create-leave-approvals
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { sequelize } = require('../config/database')

async function run() {
  try {
    await sequelize.authenticate()
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS leave_approvals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        leave_id INT NOT NULL,
        approved_by INT NOT NULL,
        approval_level ENUM('manager','hr_head') NOT NULL,
        action ENUM('approved','rejected') NOT NULL,
        comments TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leave_id) REFERENCES leaves(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_leave_approvals_leave_id (leave_id),
        INDEX idx_leave_approvals_approved_by (approved_by)
      )
    `)
    console.log('leave_approvals table ready.')
  } catch (e) {
    console.error('Error:', e.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}
run()
