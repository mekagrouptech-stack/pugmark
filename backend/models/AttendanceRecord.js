module.exports = (sequelize, DataTypes) => {
  const AttendanceRecord = sequelize.define(
    'AttendanceRecord',
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
      },
      officeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'offices',
          key: 'id',
        },
      },
      punchType: {
        type: DataTypes.ENUM('IN', 'OUT'),
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        validate: {
          min: -90,
          max: 90,
        },
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        validate: {
          min: -180,
          max: 180,
        },
      },
      distance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Distance from office in meters',
      },
      isWithinRadius: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Required when punching outside geofence',
      },
      accuracy: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'GPS accuracy in meters',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      checkInTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'check_in_time',
        comment: 'Explicit check-in time (IN punch)',
      },
      checkOutTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'check_out_time',
        comment: 'Explicit check-out time (OUT punch)',
      },
      totalHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'total_hours',
        comment: 'Total working hours for this attendance day (in hours, e.g. 7.50)',
      },
      source: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'manual',
        comment: "Origin of the record: 'manual' (admin punch) or 'biometric' (eSSL device logs)",
      },
      status: {
        type: DataTypes.STRING(16),
        allowNull: true,
        comment:
          'Explicit day status when it cannot be derived from punch times — set by ' +
          "monthly-report imports ('P', 'WOF', …). NULL means derive from check_in_time, " +
          'which is what every punch-based record does.',
      },
    },
    {
      tableName: 'attendance_records',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id', 'created_at'],
        },
        {
          fields: ['office_id'],
        },
        {
          fields: ['punch_type'],
        },
        {
          fields: ['created_at'],
        },
        {
          fields: ['is_within_radius'],
        },
        {
          unique: false,
          fields: ['user_id', 'created_at', 'punch_type'],
          name: 'user_date_punch_index',
        },
      ],
    }
  )

  // Associations
  AttendanceRecord.associate = (models) => {
    AttendanceRecord.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })

    AttendanceRecord.belongsTo(models.Office, {
      foreignKey: 'officeId',
      as: 'office',
    })
  }

  return AttendanceRecord
}
