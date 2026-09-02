'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('basic_information', {
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
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      your_views_on_organization: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      about_me: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: true,
      },
      date_of_birth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      blood_group: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
        allowNull: true,
      },
      address_for_payslip: {
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

    await queryInterface.addIndex('basic_information', ['user_id'], {
      unique: true,
      name: 'idx_basic_information_user_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('basic_information')
  },
}
