'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_records', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      office_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'offices',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      punch_type: {
        type: Sequelize.ENUM('IN', 'OUT'),
        allowNull: false,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
      },
      distance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Distance from office in meters',
      },
      is_within_radius: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Required when punching outside geofence',
      },
      accuracy: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: 'GPS accuracy in meters',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
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

    // Add indexes
    await queryInterface.addIndex('attendance_records', ['user_id', 'created_at'], {
      name: 'idx_attendance_user_date',
    })
    await queryInterface.addIndex('attendance_records', ['office_id'], { name: 'idx_attendance_office_id' })
    await queryInterface.addIndex('attendance_records', ['punch_type'], { name: 'idx_attendance_punch_type' })
    await queryInterface.addIndex('attendance_records', ['created_at'], { name: 'idx_attendance_created_at' })
    await queryInterface.addIndex('attendance_records', ['is_within_radius'], {
      name: 'idx_attendance_is_within_radius',
    })
    await queryInterface.addIndex('attendance_records', ['user_id', 'created_at', 'punch_type'], {
      name: 'user_date_punch_index',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance_records')
  },
}
