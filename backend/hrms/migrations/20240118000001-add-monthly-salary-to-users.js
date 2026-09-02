'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'monthly_salary', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Monthly salary in INR',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'monthly_salary')
  },
}
