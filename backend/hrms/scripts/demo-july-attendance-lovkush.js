/**
 * DEMO: seed July 2026 attendance for Lovkush (user 12) and run payroll.
 * Present on all Mon–Fri working days except two (to show LOP), with IN+OUT
 * punches so payroll counts them as full days.
 *
 * Run: node scripts/demo-july-attendance-lovkush.js
 */
require('dotenv').config()
const mysql = require('mysql2/promise')
const payrollService = require('../services/payrollService')

const USER_ID = 12
const OFFICE_ID = 1
const YEAR = 2026
const MONTH = 7 // July
const LAT = 19.0176
const LNG = 72.8562
// Two working days the employee is "absent" (to demonstrate LOP)
const ABSENT_DATES = new Set(['2026-07-15', '2026-07-23'])

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrms_db',
  })

  // Clear any existing July records for a clean demo
  await conn.execute(
    `DELETE FROM attendance_records WHERE user_id=? AND created_at BETWEEN ? AND ?`,
    [USER_ID, `${YEAR}-07-01 00:00:00`, `${YEAR}-07-31 23:59:59`]
  )

  const daysInMonth = new Date(YEAR, MONTH, 0).getDate()
  let present = 0
  let absent = 0
  const rows = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(YEAR, MONTH - 1, day)
    const dow = date.getDay() // 0 Sun .. 6 Sat
    if (dow === 0 || dow === 6) continue // Mon–Fri only
    const dd = String(day).padStart(2, '0')
    const dateKey = `${YEAR}-07-${dd}`
    if (ABSENT_DATES.has(dateKey)) {
      absent++
      continue
    }
    present++
    const inTime = `${dateKey} 09:00:00`
    const outTime = `${dateKey} 18:00:00`
    // IN punch
    rows.push([USER_ID, OFFICE_ID, 'IN', LAT, LNG, 0, 1, inTime, null, null, inTime])
    // OUT punch
    rows.push([USER_ID, OFFICE_ID, 'OUT', LAT, LNG, 0, 1, null, outTime, 9.0, outTime])
  }

  const sql = `INSERT INTO attendance_records
    (user_id, office_id, punch_type, latitude, longitude, distance, is_within_radius, check_in_time, check_out_time, total_hours, created_at)
    VALUES ?`
  await conn.query(sql, [rows])
  console.log(`Inserted ${rows.length} punch rows → present days: ${present}, absent (working) days: ${absent}`)

  await conn.end()

  // Now run payroll for July 2026
  const payroll = await payrollService.calculatePayrollForEmployee(USER_ID, YEAR, MONTH, true)
  const p = payroll.toJSON ? payroll.toJSON() : payroll
  console.log('--- JULY 2026 PAYROLL (Lovkush) ---')
  console.log(JSON.stringify({
    monthlySalary: p.monthlySalary,
    totalWorkingDays: p.totalWorkingDays,
    fullDays: p.fullDays,
    halfDays: p.halfDays,
    absentDays: p.absentDays,
    payableDays: p.payableDays,
    lopDays: p.lopDays,
    perDaySalary: p.perDaySalary,
    finalSalary: p.finalSalary,
    status: p.status,
  }, null, 2))
  process.exit(0)
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
