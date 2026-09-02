module.exports = (sequelize, DataTypes) => {
  const Notice = sequelize.define(
    'Notice',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('normal', 'important', 'urgent'),
        allowNull: false,
        defaultValue: 'important',
      },
      // 'all' = every active employee; 'specific' = only the linked recipients
      audience: {
        type: DataTypes.ENUM('all', 'specific'),
        allowNull: false,
        defaultValue: 'all',
      },
      // Relative storage path of the attached PDF, e.g. /storage/notices/xxx.pdf
      attachmentPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'attachment_path',
      },
      attachmentName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'attachment_name',
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'sender_id',
      },
      senderName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'sender_name',
      },
    },
    {
      tableName: 'notices',
      timestamps: true,
      underscored: true,
    }
  )

  Notice.associate = (models) => {
    Notice.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' })
    Notice.hasMany(models.NoticeRecipient, { foreignKey: 'noticeId', as: 'recipients' })
  }

  return Notice
}
