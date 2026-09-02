'use strict'

/**
 * Adds attendance_records.status.
 *
 * Until now a day's status was always derived from the punch times: a check-in
 * before 10:15 is Present, after it Late, and a day with no records at all is
 * Absent. That works for anything that originates from a punch — the app, the
 * biometric terminal, a manual correction.
 *
 * It does not work for a monthly attendance report, which records a status per
 * day and no times whatsoever ('P', 'WOF', 'EL', …). Those days have to carry
 * their status explicitly or they read as Absent with 0h 00m.
 *
 * NULL is therefore meaningful and is the default: it means "derive from the
 * times", preserving the existing behaviour for every row already in the table
 * and every punch-based row written from here on.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('attendance_records')
    if (table.status) return

    await queryInterface.addColumn('attendance_records', 'status', {
      type: Sequelize.STRING(16),
      allowNull: true,
      comment:
        'Explicit day status when it cannot be derived from punch times. NULL = derive.',
    })
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('attendance_records')
    if (!table.status) return
    await queryInterface.removeColumn('attendance_records', 'status')
  },
}
