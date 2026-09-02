module.exports = (sequelize, DataTypes) => {
  const UserOffice = sequelize.define(
    'UserOffice',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      officeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'offices',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Primary office for the user',
      },
      assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_offices',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'office_id'],
          name: 'unique_user_office',
        },
        {
          fields: ['user_id'],
        },
        {
          fields: ['office_id'],
        },
      ],
    }
  )

  return UserOffice
}
