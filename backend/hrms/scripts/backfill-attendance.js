/**
 * Backfill attendance_records from every punch already sitting in attendance_logs.
 *
 * The live paths (the /iclock push, the CSV importer, the eBioServer poller and
 * webhook) materialize punches as they arrive, and the nightly cron rebuilds the
 * current day. Neither helps punches that landed *before* those paths existed —
 * or that arrived while the device mapping was still missing. This script walks
 * the log history and materializes all of it.
 *
 * Why this exists alongside sync-device-pins.js: that script backfills a window
 * measured from today (default 30 days) and delegates to syncAllForRange, which
 * gives up after 92 days and does so silently. Neither is safe for "everything".
 *
 * Days come from DISTINCT DATE(punch_time), not from a calendar walk between the
 * first and last punch. Real deployments carry junk rows — a device with a dead
 * RTC stamps punches 1900-01-01 — and walking calendar days from there would mean
 * ~46,000 pointless queries. Iterating the dates that actually have punches costs
 * one query per real day.
 *
 * Usage:
 *   node scripts/backfill-attendance.js                  every day that has punches
 *   node scripts/backfill-attendance.js --dry-run        show the plan, change nothing
 *   node scripts/backfill-attendance.js --from=2026-08-01 --to=2026-08-31
 *   node scripts/backfill-attendance.js --include-invalid   process junk dates too
 *
 * Safe to re-run: syncAllForDate replaces a day's source='biometric' rows and
 * never touches manually-entered ones.
 */
require('dotenv').config()
const { sequelize } = require('../models')
const biometricSync = require('../services/biometricAttendanceSync')

const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const arg = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1].trim() : null
}

const DRY = has('--dry-run')
const INCLUDE_INVALID = has('--include-invalid')
const FROM = arg('from')
const TO = arg('to')

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/
// A punch older than this is a device clock fault, not history worth syncing.
const MIN_SANE_DATE = '2000-01-01'

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

if (FROM && !DATE_RX.test(FROM)) fail(`--from must be YYYY-MM-DD, got "${FROM}"`)
if (TO && !DATE_RX.test(TO)) fail(`--to must be YYYY-MM-DD, got "${TO}"`)
if (FROM && TO && FROM > TO) fail(`--from (${FROM}) is after --to (${TO})`)

/** Distinct IST days that have punches, with their punch/pin counts. */
async function punchDays() {
  const where = []
  const replacements = {}
  if (FROM) {
    where.push('DATE(punch_time) >= :from')
    replacements.from = FROM
  }
  if (TO) {
    where.push('DATE(punch_time) <= :to')
    replacements.to = TO
  }
  const [rows] = await sequelize.query(
    `SELECT DATE(punch_time) AS day, COUNT(*) AS punches,
            COUNT(DISTINCT device_pin) AS pins
       FROM attendance_logs
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY DATE(punch_time)
      ORDER BY day`,
    { replacements }
  )
  // MySQL hands DATE back as a string under dateStrings, as a Date otherwise.
  return rows.map((r) => ({
    day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10),
    punches: Number(r.punches),
    pins: Number(r.pins),
  }))
}

/**
 * Device PINs that punched but match no user. Their punches are silently dropped
 * by the sync, so surfacing them is the difference between "backfill worked" and
 * "backfill ran and quietly ignored half the workforce".
 */
async function unmappedPins(days) {
  if (days.length === 0) return []
  const [rows] = await sequelize.query(
    `SELECT DISTINCT al.device_pin AS pin
       FROM attendance_logs al
       LEFT JOIN users u
         ON u.device_pin = al.device_pin OR u.employee_code = al.device_pin
      WHERE u.id IS NULL AND DATE(punch_time) IN (:days)`,
    { replacements: { days } }
  )
  return rows.map((r) => String(r.pin))
}

async function run() {
  await sequelize.authenticate()
  console.log(`Connected to ${process.env.DB_NAME}\n`)

  const all = await punchDays()
  if (all.length === 0) {
    console.log('No punches found in attendance_logs for that range — nothing to backfill.')
    return
  }

  const invalid = all.filter((d) => d.day < MIN_SANE_DATE)
  const days = INCLUDE_INVALID ? all : all.filter((d) => d.day >= MIN_SANE_DATE)

  const totalPunches = all.reduce((n, d) => n + d.punches, 0)
  console.log(
    `Found ${totalPunches} punch(es) across ${all.length} day(s): ${all[0].day} … ${all[all.length - 1].day}`
  )
  if (invalid.length) {
    const label = INCLUDE_INVALID ? 'including' : 'skipping'
    console.log(
      `⚠️  ${label} ${invalid.length} implausible day(s) before ${MIN_SANE_DATE} ` +
        `(${invalid.map((d) => `${d.day}×${d.punches}`).join(', ')}) — device clock fault.` +
        (INCLUDE_INVALID ? '' : ' Use --include-invalid to process them anyway.')
    )
  }
  if (days.length === 0) {
    console.log('\nNothing left to process.')
    return
  }

  const orphans = await unmappedPins(days.map((d) => d.day))
  if (orphans.length) {
    console.log(
      `\n⚠️  ${orphans.length} device PIN(s) match no employee — their punches will be ignored:\n` +
        `    ${orphans.join(', ')}\n` +
        `    Map them first: node scripts/sync-device-pins.js --set <EMPLOYEE_CODE>=<PIN>`
    )
  }

  if (DRY) {
    console.log(`\n── Dry run — would backfill ${days.length} day(s) ──`)
    days.forEach((d) => console.log(`  ${d.day}  punches=${d.punches}  pins=${d.pins}`))
    console.log('\nNo changes made. Re-run without --dry-run to apply.')
    return
  }

  console.log(`\n── Backfilling ${days.length} day(s) ──`)
  let users = 0
  let failed = 0
  let lastError = null
  for (let i = 0; i < days.length; i++) {
    const { day, punches } = days[i]
    try {
      const res = await biometricSync.syncAllForDate(day)
      users += res.users || 0
      if (res.failed) {
        failed += res.failed
        lastError = res.lastError
      }
      console.log(
        `  [${i + 1}/${days.length}] ${day}  punches=${punches} → ${res.users || 0} user-day(s)` +
          (res.failed ? `  (${res.failed} failed)` : '')
      )
    } catch (e) {
      failed += 1
      lastError = e.message
      console.log(`  [${i + 1}/${days.length}] ${day}  FAILED: ${e.message}`)
    }
  }

  console.log(`\n✅ Backfilled ${users} user-day record set(s) across ${days.length} day(s).`)
  if (failed) console.log(`⚠️  ${failed} failure(s). Last error: ${lastError}`)
}

run()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('Failed:', e.message)
    await sequelize.close().catch(() => {})
    process.exit(1)
  })
