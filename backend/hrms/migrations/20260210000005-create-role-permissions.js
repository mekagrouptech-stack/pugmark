'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      permission: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    })

    await queryInterface.addIndex('role_permissions', ['role'])
    await queryInterface.addIndex('role_permissions', ['permission'])
    await queryInterface.addIndex('role_permissions', ['role', 'permission'], {
      unique: true,
      name: 'role_permissions_role_permission_unique',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_permissions')
  },
}

