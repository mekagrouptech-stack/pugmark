'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'reporting_manager_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    await queryInterface.addIndex('users', ['reporting_manager_id'], {
      name: 'idx_users_reporting_manager_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_reporting_manager_id')
    await queryInterface.removeColumn('users', 'reporting_manager_id')
  },
}
