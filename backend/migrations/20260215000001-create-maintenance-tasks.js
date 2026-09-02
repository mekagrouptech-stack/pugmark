'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_tasks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('maintenance_tasks', ['status'], { name: 'idx_maintenance_tasks_status' })
    await queryInterface.addIndex('maintenance_tasks', ['assigned_to'], { name: 'idx_maintenance_tasks_assigned' })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('maintenance_tasks')
  },
}
