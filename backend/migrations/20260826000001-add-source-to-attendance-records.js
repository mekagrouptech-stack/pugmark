'use strict'

/**
 * Adds attendance_records.source.
 *
 * The column has existed on the model since biometric punches were introduced,
 * but never had a migration — it only appeared on databases where someone ran
 * sequelize.sync({alter:true}) by hand. On a migration-built database its
 * absence silently breaks biometric attendance: every sync scopes its reads and
 * deletes by source, so each run throws "Unknown column 'source'", rolls back,
 * and employees show as Absent even though their punches are visible on the
 * Biometric Attendance page.
 *
 * 'manual' is the correct default for rows that already exist — they all came
 * from the GPS/app punch flow, which predates the device integration.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('attendance_records')
    if (table.source) return

    await queryInterface.addColumn('attendance_records', 'source', {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: 'manual',
      comment:
        "Origin of the record: 'manual' (app/admin punch) or 'biometric' (eSSL device logs)",
    })
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('attendance_records')
    if (!table.source) return
    await queryInterface.removeColumn('attendance_records', 'source')
  },
}
