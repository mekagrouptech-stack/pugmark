module.exports = (sequelize, DataTypes) => {
  const DarClient = sequelize.define(
    'DarClient',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      contactName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'contact_name',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'dar_clients',
      timestamps: true,
      underscored: true,
    }
  )

  return DarClient
}

