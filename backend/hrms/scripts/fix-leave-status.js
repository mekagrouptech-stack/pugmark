/**
 * Fix leaves with NULL/empty status so they appear in Pending Leave Approval.
 * Run: cd backend && npm run db:fix-leave-status
 *
 * Issue: Some leaves have status = NULL or '' and don't show in approval list.
 * This script sets status = 'Pending_Manager' and backfills reporting_manager_id from the applicant.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { sequelize } = require('../config/database')

async function run() {
  try {
    await sequelize.authenticate()
    console.log('\n=== Fix Leave Status ===\n')

    // 1. Fix NULL/empty status -> Pending_Manager (only for leaves not yet approved/rejected)
    const [statusResult] = await sequelize.query(`
      UPDATE leaves
      SET status = 'Pending_Manager'
      WHERE status = '' OR status IS NULL OR status = 'Pending'
    `)
    const affectedStatus = statusResult?.affectedRows ?? 0
    if (affectedStatus > 0) {
      console.log(`Updated ${affectedStatus} leave(s) status to Pending_Manager`)
    }

    // 2. Backfill reporting_manager_id from users where leave has user_id but no reporting_manager_id
    const [managerResult] = await sequelize.query(`
      UPDATE leaves l
      INNER JOIN users u ON u.id = l.user_id
      SET l.reporting_manager_id = u.reporting_manager_id
      WHERE l.reporting_manager_id IS NULL AND u.reporting_manager_id IS NOT NULL
    `)
    const affectedManager = managerResult?.affectedRows ?? managerResult
    if (affectedManager > 0) {
      console.log(`Backfilled reporting_manager_id for ${affectedManager} leave(s)`)
    }

    // 3. Ensure status column accepts Pending_Manager (alter enum if needed)
    try {
      const [cols] = await sequelize.query(`
        SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leaves' AND COLUMN_NAME = 'status'
      `)
      const enumDef = cols?.[0]?.COLUMN_TYPE || ''
      if (enumDef && !enumDef.includes('Pending_Manager')) {
        await sequelize.query(`
          ALTER TABLE leaves MODIFY COLUMN status
          ENUM('Pending','Pending_Manager','Pending_HR','Approved','Rejected','Cancelled')
          NOT NULL DEFAULT 'Pending_Manager'
        `)
        console.log('Extended status ENUM to include Pending_Manager, Pending_HR')
      }
    } catch (e) {
      if (!e.message?.includes('Duplicate column') && !e.message?.includes('already exists')) {
        console.warn('Enum check/alter:', e.message)
      }
    }

    console.log('\nDone. Refresh Pending Leave Approval page.\n')
  } catch (e) {
    console.error('Error:', e.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
