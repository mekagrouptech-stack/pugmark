'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Role name',
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

    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Department name',
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

    await queryInterface.addIndex('roles', ['name'], { name: 'idx_roles_name' })
    await queryInterface.addIndex('departments', ['name'], { name: 'idx_departments_name' })

    // Seed default roles
    const now = new Date()
    await queryInterface.bulkInsert('roles', [
      { name: 'EMPLOYEE', created_at: now, updated_at: now },
      { name: 'MANAGER', created_at: now, updated_at: now },
      { name: 'HR', created_at: now, updated_at: now },
      { name: 'HEAD_HR', created_at: now, updated_at: now },
      { name: 'HOD', created_at: now, updated_at: now },
      { name: 'ADMIN', created_at: now, updated_at: now },
    ])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('departments')
    await queryInterface.dropTable('roles')
  },
}
