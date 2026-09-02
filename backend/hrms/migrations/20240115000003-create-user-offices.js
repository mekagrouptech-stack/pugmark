'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_offices', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Primary office for the user',
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    await queryInterface.addIndex('user_offices', ['user_id', 'office_id'], {
      unique: true,
      name: 'unique_user_office',
    })
    await queryInterface.addIndex('user_offices', ['user_id'], { name: 'idx_user_offices_user_id' })
    await queryInterface.addIndex('user_offices', ['office_id'], { name: 'idx_user_offices_office_id' })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_offices')
  },
}
