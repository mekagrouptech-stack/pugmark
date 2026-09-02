'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employment_information', {
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
      date_of_joining: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      confirmation_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      employment_status: {
        type: Sequelize.ENUM('Probation', 'Confirmed', 'Contract'),
        allowNull: true,
      },
      notice_period: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      state_tax: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      comp_off_overtime: {
        type: Sequelize.ENUM('Yes', 'No'),
        allowNull: true,
      },
      work_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      company: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_working_date: {
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

    await queryInterface.addIndex('employment_information', ['user_id'], {
      unique: true,
      name: 'idx_employment_information_user_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employment_information')
  },
}
