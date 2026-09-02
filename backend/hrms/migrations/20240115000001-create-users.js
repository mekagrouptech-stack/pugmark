'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      employee_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
      },
      role: {
        type: Sequelize.ENUM('EMPLOYEE', 'MANAGER', 'HR', 'HEAD_HR', 'ADMIN', 'HOD'),
        allowNull: false,
        defaultValue: 'EMPLOYEE',
      },
      department: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      designation: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_login: {
        type: Sequelize.DATE,
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

    // Add indexes
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'idx_users_email' })
    await queryInterface.addIndex('users', ['employee_code'], { unique: true, name: 'idx_users_employee_code' })
    await queryInterface.addIndex('users', ['role'], { name: 'idx_users_role' })
    await queryInterface.addIndex('users', ['is_active'], { name: 'idx_users_is_active' })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users')
  },
}
