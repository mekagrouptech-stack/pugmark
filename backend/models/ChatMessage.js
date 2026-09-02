module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define(
    'ChatMessage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      room: {
        type: DataTypes.ENUM('hr', 'admin', 'medical'),
        allowNull: false,
        comment: 'Chat room name',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      userName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'user_name',
        comment: 'User name at time of message (for historical accuracy)',
      },
      userRole: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'user_role',
        comment: 'User role at time of message',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Message content',
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Message timestamp',
      },
    },
    {
      tableName: 'chat_messages',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['room', 'timestamp'],
        },
        {
          fields: ['user_id'],
        },
        {
          fields: ['timestamp'],
        },
      ],
    }
  )

  // Associations
  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
  }

  return ChatMessage
}
