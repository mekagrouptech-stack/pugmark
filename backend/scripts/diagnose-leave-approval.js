/**
 * Diagnostic script for leave approval setup.
 * Run: cd backend && node scripts/diagnose-leave-approval.js
 *
 * Checks:
 * - Users and their Report To (reporting_manager_id)
 * - Pending leaves and who can approve them
 * - Common setup issues
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { sequelize } = require('../config/database')
const { User, Leave } = require('../models')

async function run() {
  try {
    await sequelize.authenticate()
    console.log('\n=== Leave Approval Diagnostic ===\n')

    // 1. All users with reporting manager
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email', 'employeeCode', 'role', 'reportingManagerId'],
      include: [{ model: User, as: 'reportingManager', required: false, attributes: ['id', 'name'] }],
      order: [['id', 'ASC']],
    })

    console.log('--- Users (Report To / Reporting Person) ---')
    for (const u of users) {
      const reportTo = u.reportingManager ? `${u.reportingManager.name} (id: ${u.reportingManager.id})` : 'NOT SET'
      console.log(`  ${u.name} (id: ${u.id}, role: ${u.role}) -> Report To: ${reportTo}`)
    }

    // 2. Pending leaves
    const [pendingLeaves] = await sequelize.query(`
      SELECT l.id, l.user_id, l.reporting_manager_id, l.hr_head_id, l.status, l.leave_type, l.start_date, l.end_date,
             u.name as applicant_name
      FROM leaves l
      JOIN users u ON u.id = l.user_id
      WHERE l.status IN ('Pending', 'Pending_Manager', 'Pending_HR')
      ORDER BY l.id DESC
    `)

    console.log('\n--- Pending Leaves ---')
    if (pendingLeaves.length === 0) {
      console.log('  No pending leaves found.')
      const [allLeaves] = await sequelize.query(
        `SELECT id, user_id, status, leave_type, start_date FROM leaves ORDER BY id DESC LIMIT 5`
      )
      if (allLeaves.length > 0) {
        console.log('  Recent leaves (any status):')
        allLeaves.forEach((l) => console.log(`    #${l.id}: user ${l.user_id} | ${l.status} | ${l.leave_type} | ${l.start_date}`))
      }
      console.log('\n  To create a pending leave:')
      console.log('  1. Ensure the employee has Report To set in User Management')
      console.log('  2. Log in as that employee and apply for leave via Apply for Leave')
    } else {
      for (const l of pendingLeaves) {
        console.log(`  Leave #${l.id}: ${l.applicant_name} | ${l.leave_type} | ${l.start_date} to ${l.end_date} | status: ${l.status}`)
        console.log(`    -> Reporting Person (id): ${l.reporting_manager_id || 'NULL'}`)
        console.log(`    -> Head HR (id): ${l.hr_head_id || 'NULL'}`)
      }
    }

    // 3. Who sees what
    console.log('\n--- Who Sees Pending Leaves ---')
    console.log('  ADMIN / HEAD_HR / HR: See ALL pending leaves')
    console.log('  Others (Manager, HOD, Employee): Only see leaves where they are the Reporting Person or Head HR\n')

    // 4. Common issues
    const employeesWithoutReportTo = users.filter((u) => u.role === 'EMPLOYEE' && !u.reportingManagerId)
    if (employeesWithoutReportTo.length > 0) {
      console.log('--- WARNING: Employees without Report To ---')
      employeesWithoutReportTo.forEach((u) => {
        console.log(`  ${u.name} (id: ${u.id}) - cannot apply for leave until Report To is set`)
      })
      console.log('')
    }

    const leavesWithNoReportingManager = pendingLeaves.filter((l) => !l.reporting_manager_id)
    if (leavesWithNoReportingManager.length > 0) {
      console.log('--- WARNING: Pending leaves with no Reporting Person ---')
      leavesWithNoReportingManager.forEach((l) => {
        console.log(`  Leave #${l.id} (${l.applicant_name}) - no one can approve as Reporting Person`)
      })
      console.log('')
    }

    console.log('--- Done ---\n')
  } catch (e) {
    console.error('Error:', e.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
