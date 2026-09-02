'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('salary_heads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'e.g. Basic Salary, HRA, PF',
      },
      type: {
        type: Sequelize.ENUM('EARNING', 'DEDUCTION'),
        allowNull: false,
        defaultValue: 'EARNING',
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active',
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    })

    await queryInterface.addIndex('salary_heads', ['type'], { name: 'idx_salary_heads_type' })
    await queryInterface.addIndex('salary_heads', ['status'], { name: 'idx_salary_heads_status' })

    // Seed default salary heads
    await queryInterface.bulkInsert('salary_heads', [
      { name: 'Basic Salary', type: 'EARNING', status: 'Active', sort_order: 1, created_at: new Date(), updated_at: new Date() },
      { name: 'HRA', type: 'EARNING', status: 'Active', sort_order: 2, created_at: new Date(), updated_at: new Date() },
    ])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('salary_heads')
  },
}
