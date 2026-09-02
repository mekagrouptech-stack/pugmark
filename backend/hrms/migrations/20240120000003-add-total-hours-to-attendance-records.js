'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add total_hours column to attendance_records
    await queryInterface.addColumn('attendance_records', 'total_hours', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Total working hours for this attendance day (in hours, e.g. 7.50)',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('attendance_records', 'total_hours')
  },
}

