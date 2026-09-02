'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_information', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      mobile_no: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      official_mobile_no: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      personal_email_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city_town: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      pin_code: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      permanent_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergency_contact_person: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      relation: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      emergency_contact_mobile_no: {
        type: Sequelize.STRING(20),
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

    await queryInterface.addIndex('contact_information', ['user_id'], {
      unique: true,
      name: 'idx_contact_information_user_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contact_information')
  },
}
