module.exports = (sequelize, DataTypes) => {
  const Office = sequelize.define(
    'Office',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
        validate: {
          min: -90,
          max: 90,
        },
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
        validate: {
          min: -180,
          max: 180,
        },
      },
      radius: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
          min: 10,
          max: 10000,
        },
        comment: 'Allowed radius in meters',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      strictGeofencing: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'If true, employees cannot punch outside radius',
      },
      timezone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'UTC',
      },
    },
    {
      tableName: 'offices',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['is_active'],
        },
        {
          fields: ['country'],
        },
        {
          fields: ['latitude', 'longitude'],
        },
      ],
    }
  )

  // Associations
  Office.associate = (models) => {
    Office.belongsToMany(models.User, {
      through: models.UserOffice,
      foreignKey: 'officeId',
      as: 'users',
    })

    Office.hasMany(models.AttendanceRecord, {
      foreignKey: 'officeId',
      as: 'attendanceRecords',
    })
  }

  return Office
}
