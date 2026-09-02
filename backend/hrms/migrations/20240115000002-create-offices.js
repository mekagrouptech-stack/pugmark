'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('offices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
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
      radius: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: 'Allowed radius in meters',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      strict_geofencing: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'If true, employees cannot punch outside radius',
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'UTC',
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
    await queryInterface.addIndex('offices', ['is_active'], { name: 'idx_offices_is_active' })
    await queryInterface.addIndex('offices', ['country'], { name: 'idx_offices_country' })
    await queryInterface.addIndex('offices', ['latitude', 'longitude'], { name: 'idx_offices_location' })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('offices')
  },
}
