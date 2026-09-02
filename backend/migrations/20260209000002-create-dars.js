'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dars', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date of the activity (YYYY-MM-DD)',
      },
      project_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      work_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      work_location_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      work_location_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      activity_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      task_category: {
        type: Sequelize.ENUM('EXECUTION', 'PLANNING', 'MEETING', 'INSPECTION', 'DOCUMENTATION', 'OTHER'),
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      total_hours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      issues_faced: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejected_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      rejected_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      manager_comments: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('dars', ['user_id', 'date'], { name: 'idx_dars_user_date' })
    await queryInterface.addIndex('dars', ['status'], { name: 'idx_dars_status' })
    await queryInterface.addIndex('dars', ['date'], { name: 'idx_dars_date' })
    await queryInterface.addIndex('dars', ['approved_by'], { name: 'idx_dars_approved_by' })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dars')
  },
}

