'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert sample offices
    await queryInterface.bulkInsert('offices', [
      {
        name: 'Mumbai Office',
        country: 'India',
        address: '123 Business Park, Andheri East, Mumbai, Maharashtra 400069',
        latitude: 19.1136,
        longitude: 72.8697,
        radius: 100,
        is_active: true,
        strict_geofencing: true,
        timezone: 'Asia/Kolkata',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Dubai Office',
        country: 'UAE',
        address: 'Dubai Business Bay, Dubai, UAE',
        latitude: 25.2048,
        longitude: 55.2708,
        radius: 150,
        is_active: true,
        strict_geofencing: true,
        timezone: 'Asia/Dubai',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'New York Office',
        country: 'USA',
        address: '123 Broadway, New York, NY 10001',
        latitude: 40.7128,
        longitude: -74.006,
        radius: 200,
        is_active: true,
        strict_geofencing: false,
        timezone: 'America/New_York',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('offices', null, {})
  },
}
