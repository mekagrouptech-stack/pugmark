module.exports = (sequelize, DataTypes) => {
  const NoticeRecipient = sequelize.define(
    'NoticeRecipient',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      noticeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'notice_id',
        references: { model: 'notices', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'read_at',
      },
    },
    {
      tableName: 'notice_recipients',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['user_id', 'is_read'] },
        { unique: true, fields: ['notice_id', 'user_id'], name: 'uq_notice_user' },
      ],
    }
  )

  NoticeRecipient.associate = (models) => {
    NoticeRecipient.belongsTo(models.Notice, { foreignKey: 'noticeId', as: 'notice' })
    NoticeRecipient.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
  }

  return NoticeRecipient
}
