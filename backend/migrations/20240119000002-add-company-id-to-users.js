'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add company_id column to users table
    await queryInterface.addColumn('users', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null initially for backward compatibility
      references: {
        model: 'companies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Foreign key to companies table',
    })

    // Add index for company_id
    await queryInterface.addIndex('users', ['company_id'], {
      name: 'idx_users_company_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_company_id')
    await queryInterface.removeColumn('users', 'company_id')
  },
}
