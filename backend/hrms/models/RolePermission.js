module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define(
    'RolePermission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      permission: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: 'role_permissions',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['role'] },
        { fields: ['permission'] },
        {
          unique: true,
          fields: ['role', 'permission'],
          name: 'role_permissions_role_permission_unique',
        },
      ],
    }
  )

  return RolePermission
}

