'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add check_in_time and check_out_time columns to attendance_records
    await queryInterface.addColumn('attendance_records', 'check_in_time', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Explicit check-in time (for IN punches)',
    })

    await queryInterface.addColumn('attendance_records', 'check_out_time', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Explicit check-out time (for OUT punches)',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('attendance_records', 'check_in_time')
    await queryInterface.removeColumn('attendance_records', 'check_out_time')
  },
}

