/**
 * Map employees to their biometric device PINs, then materialize any punches
 * already sitting in attendance_logs into attendance_records.
 *
 * Device punches only become attendance when users.device_pin (or employee_code)
 * matches the User ID enrolled on the eSSL terminal. Until that mapping exists
 * the punches are stored but orphaned, so this script does the mapping first and
 * the backfill second.
 *
 * Usage:
 *   node scripts/sync-device-pins.js --dry-run            preview, change nothing
 *   node scripts/sync-device-pins.js                      map pins + backfill 30 days
 *   node scripts/sync-device-pins.js --days=90            wider backfill window
 *   node scripts/sync-device-pins.js --set MIPL92=92 --set MIPL45=45
 *   node scripts/sync-device-pins.js --no-auto            only --set pairs, no guessing
 *   node scripts/sync-device-pins.js --backfill-only      skip mapping entirely
 */
require('dotenv').config()
const moment = require('moment-timezone')
const { Op } = require('sequelize')
const { sequelize, User, AttendanceLog } = require('../models')
const biometricSync = require('../services/biometricAttendanceSync')

const IST = 'Asia/Kolkata'

const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const DRY = has('--dry-run')
const NO_AUTO = has('--no-auto')
const BACKFILL_ONLY = has('--backfill-only')
const DAYS = Number.parseInt((argv.find((a) => a.startsWith('--days=')) || '').split('=')[1], 10) || 30

// --set CODE=PIN pairs, applied verbatim and taking priority over any guess.
const explicit = new Map()
argv.forEach((a, i) => {
  if (a !== '--set') return
  const [code, pin] = String(argv[i + 1] || '').split('=')
  if (code && pin) explicit.set(code.trim(), pin.trim())
})

/**
 * Guess a PIN from an employee code by taking its trailing digits — the common
 * enrollment convention (MIPL92 → 92). Only used when the PIN actually appears
 * in attendance_logs, so a wrong guess cannot silently attach the wrong person.
 */
function guessPin(employeeCode) {
  const m = String(employeeCode || '').match(/(\d+)\s*$/)
  return m ? String(Number.parseInt(m[1], 10)) : null
}

async function mapPins(pinsSeen) {
  const users = await User.findAll({ attributes: ['id', 'employeeCode', 'name', 'devicePin'] })
  const taken = new Set(users.map((u) => u.devicePin).filter(Boolean).map(String))
  let updated = 0

  for (const u of users) {
    if (u.devicePin) continue // never overwrite a pin an admin already set

    const forced = explicit.get(u.employeeCode)
    let pin = forced || null

    if (!pin && !NO_AUTO) {
      const g = guessPin(u.employeeCode)
      // Only auto-map when that PIN really punched, so we never invent a mapping.
      if (g && pinsSeen.has(g)) pin = g
    }
    if (!pin) continue

    if (taken.has(pin)) {
      console.log(`  SKIP  ${u.employeeCode} → ${pin} (already used by another user)`)
      continue
    }

    console.log(`  ${DRY ? 'WOULD SET' : 'SET  '} ${u.employeeCode} (${u.name}) → device_pin=${pin}`)
    if (!DRY) await User.update({ devicePin: pin }, { where: { id: u.id } })
    taken.add(pin)
    updated += 1
  }
  return updated
}

async function run() {
  await sequelize.authenticate()
  console.log(`Connected to ${process.env.DB_NAME}\n`)

  const end = moment.tz(IST)
  const start = end.clone().subtract(DAYS - 1, 'days')
  const startStr = start.format('YYYY-MM-DD')
  const endStr = end.format('YYYY-MM-DD')

  // Distinct PINs that actually punched in the window — the ground truth we
  // map against.
  const rows = await AttendanceLog.findAll({
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('device_pin')), 'devicePin']],
    where: sequelize.where(sequelize.fn('DATE', sequelize.col('punch_time')), {
      [Op.between]: [startStr, endStr],
    }),
    raw: true,
  })
  const pinsSeen = new Set(rows.map((r) => String(r.devicePin)).filter(Boolean))
  console.log(`Punched PINs in ${startStr}..${endStr}: ${pinsSeen.size ? [...pinsSeen].join(', ') : '(none)'}\n`)

  if (!BACKFILL_ONLY) {
    console.log('── Mapping device pins ──')
    const updated = await mapPins(pinsSeen)
    console.log(`${updated} user(s) ${DRY ? 'would be' : ''} mapped.\n`)
  }

  // Report PINs that punched but still match nobody — these are the punches
  // that will keep being dropped until someone maps them by hand.
  const mapped = await User.findAll({
    where: {
      [Op.or]: [
        { devicePin: { [Op.in]: [...pinsSeen] } },
        { employeeCode: { [Op.in]: [...pinsSeen] } },
      ],
    },
    attributes: ['devicePin', 'employeeCode'],
    raw: true,
  })
  const resolved = new Set(mapped.flatMap((u) => [u.devicePin, u.employeeCode].filter(Boolean).map(String)))
  const orphans = [...pinsSeen].filter((p) => !resolved.has(p))
  if (orphans.length) {
    console.log(`⚠️  Unmapped PINs (punches will be ignored): ${orphans.join(', ')}`)
    console.log('    Fix with: --set <EMPLOYEE_CODE>=<PIN>\n')
  }

  if (DRY) {
    console.log('Dry run — no backfill performed.')
    return
  }

  console.log(`── Backfilling attendance_records ${startStr}..${endStr} ──`)
  const res = await biometricSync.syncAllForRange(startStr, endStr)
  console.log(`Done: ${res.users} user-day record set(s) written across ${res.days} day(s).`)
}

run()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('Failed:', e.message)
    await sequelize.close().catch(() => {})
    process.exit(1)
  })
