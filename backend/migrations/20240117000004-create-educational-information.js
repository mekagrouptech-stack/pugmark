'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('educational_information', {
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
      graduation: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      year_of_passing_graduation: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      post_graduation: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      year_of_passing_post_graduation: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      other_qualification: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      year_of_passing_other_qualification: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      certifications: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      co_curricular_activities_hobbies: {
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

    await queryInterface.addIndex('educational_information', ['user_id'], {
      unique: true,
      name: 'idx_educational_information_user_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('educational_information')
  },
}
