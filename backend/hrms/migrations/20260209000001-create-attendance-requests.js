'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Attendance date this request is for',
      },
      request_type: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'Late Mark, Absent Regularization',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      check_in: {
        type: Sequelize.STRING(32),
        allowNull: true,
        comment: 'Check-in time e.g. 10:00 AM (for Late Mark)',
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      reporting_manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rejected_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      rejected_at: {
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

    await queryInterface.addIndex('attendance_requests', ['user_id'], { name: 'idx_attendance_requests_user_id' })
    await queryInterface.addIndex('attendance_requests', ['status'], { name: 'idx_attendance_requests_status' })
    await queryInterface.addIndex('attendance_requests', ['reporting_manager_id'], {
      name: 'idx_attendance_requests_reporting_manager_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance_requests')
  },
}
