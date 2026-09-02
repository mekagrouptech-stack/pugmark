'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add explicit check-in time for IN punches
    await queryInterface.addColumn('attendance_records', 'check_in_time', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Explicit check-in time (IN punch)',
    })

    // Add explicit check-out time for OUT punches
    await queryInterface.addColumn('attendance_records', 'check_out_time', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Explicit check-out time (OUT punch)',
    })

    // Add total working hours for the day
    await queryInterface.addColumn('attendance_records', 'total_hours', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Total working hours for this attendance day (in hours, e.g. 7.50)',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('attendance_records', 'check_in_time')
    await queryInterface.removeColumn('attendance_records', 'check_out_time')
    await queryInterface.removeColumn('attendance_records', 'total_hours')
  },
}

