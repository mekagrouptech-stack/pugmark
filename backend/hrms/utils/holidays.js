/**
 * Company holiday calendar.
 *
 * Five holidays a year, each of which costs the employee one day of earned
 * leave (see `accruedEarnedDays` in leaveController).
 *
 * Four are fixed national holidays and can be derived for any year. Diwali is
 * lunar — it moves by two to three weeks year on year and cannot be calculated
 * from a rule — so it has to be listed explicitly. ADD EACH NEW YEAR BELOW: a
 * year missing from the table simply loses its Diwali deduction rather than
 * failing, so an omission shows up as a quietly generous balance.
 */

const FIXED_NATIONAL_HOLIDAYS = [
  { month: 1, day: 26, name: 'Republic Day' },
  { month: 5, day: 1, name: 'May Day' },
  { month: 8, day: 15, name: 'Independence Day' },
  { month: 10, day: 2, name: 'Gandhi Jayanti' },
]

// Lakshmi Puja / main Diwali day, as observed by the company.
const DIWALI_BY_YEAR = {
  2023: '2023-11-12',
  2024: '2024-11-01',
  2025: '2025-10-20',
  2026: '2026-11-08',
  2027: '2027-10-29',
  2028: '2028-10-17',
}

const pad = (n) => String(n).padStart(2, '0')

/**
 * Every company holiday in `year`, oldest first.
 * @returns {Array<{date: string, name: string}>} date is 'YYYY-MM-DD'
 */
const holidaysForYear = (year) => {
  const list = FIXED_NATIONAL_HOLIDAYS.map((h) => ({
    date: `${year}-${pad(h.month)}-${pad(h.day)}`,
    name: h.name,
  }))

  const diwali = DIWALI_BY_YEAR[year]
  if (diwali) list.push({ date: diwali, name: 'Diwali' })

  return list.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * How many holidays in `year` have already happened as of `todayStr`, counting
 * only those that fell while the employee was on roll.
 *
 * Both bounds matter: a holiday that has not arrived yet has not been taken, and
 * one that fell before the employee joined was never theirs to lose. A missing
 * joining date means "no record", so the whole year counts.
 *
 * @param {number} year
 * @param {string} todayStr      'YYYY-MM-DD'
 * @param {string} [joiningDate] 'YYYY-MM-DD'
 */
const holidaysTakenBy = (year, todayStr, joiningDate) =>
  holidaysForYear(year).filter(
    (h) => h.date <= todayStr && (!joiningDate || h.date >= joiningDate)
  )

module.exports = {
  FIXED_NATIONAL_HOLIDAYS,
  DIWALI_BY_YEAR,
  holidaysForYear,
  holidaysTakenBy,
}
