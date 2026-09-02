'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('personal_information', {
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
      fathers_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      place_of_birth: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      mother_tongue: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      marital_status: {
        type: Sequelize.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
        allowNull: true,
      },
      date_of_marriage: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      passport_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      aadhaar_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      pan_number: {
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

    await queryInterface.addIndex('personal_information', ['user_id'], {
      unique: true,
      name: 'idx_personal_information_user_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('personal_information')
  },
}
