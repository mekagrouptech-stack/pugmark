'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      room: {
        type: Sequelize.ENUM('hr', 'admin', 'medical'),
        allowNull: false,
        comment: 'Chat room name',
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
      user_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'User name at time of message (for historical accuracy)',
      },
      user_role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'User role at time of message',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Message content',
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Message timestamp',
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

    // Add indexes for better query performance
    await queryInterface.addIndex('chat_messages', ['room', 'timestamp'], {
      name: 'idx_chat_messages_room_timestamp',
    })

    await queryInterface.addIndex('chat_messages', ['user_id'], {
      name: 'idx_chat_messages_user_id',
    })

    await queryInterface.addIndex('chat_messages', ['timestamp'], {
      name: 'idx_chat_messages_timestamp',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_messages')
  },
}
