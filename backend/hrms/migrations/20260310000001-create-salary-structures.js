'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('salary_structures', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      total_earnings: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
      },
      total_deductions: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
      },
      total_salary: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'Published',
      },
      config: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      modified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
    await queryInterface.addIndex('salary_structures', ['name'], { name: 'idx_salary_structures_name' })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('salary_structures')
  },
}
