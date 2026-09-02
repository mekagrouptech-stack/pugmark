const { User } = require('../models')

/**
 * Who a "My Team" screen is allowed to show.
 *
 * Two different jobs share the same menu. HR, Head HR and Admin oversee the
 * whole company, so their team screens are company-wide lists. A reporting
 * person's team is the people who actually report to them — anything wider is
 * not their team, it is the staff directory.
 *
 * Kept in one place because the members list, the attendance table and the
 * daily report all have to agree on the answer: a manager who sees ten people
 * on the roster and thirty on the attendance report has no way to tell which
 * screen is lying.
 */

// Roles whose remit is the whole company rather than a reporting line.
const COMPANY_WIDE_ROLES = ['ADMIN', 'HR', 'HEAD_HR']

const seesEveryone = (currentUser) =>
  COMPANY_WIDE_ROLES.includes(String(currentUser?.role || '').toUpperCase())

/**
 * The employee ids a user's team screens may cover.
 *
 * Returns `null` for the company-wide roles, meaning "apply no user filter" —
 * deliberately distinct from `[]`, which means "this manager has nobody
 * reporting to them" and must show an empty screen rather than everybody.
 */
const teamUserIdsFor = async (currentUser) => {
  if (seesEveryone(currentUser)) return null

  const team = await User.findAll({
    where: { reportingManagerId: currentUser.id, isActive: true },
    attributes: ['id'],
  })
  return team.map((u) => u.id)
}

module.exports = { COMPANY_WIDE_ROLES, seesEveryone, teamUserIdsFor }
