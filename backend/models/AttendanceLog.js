module.exports = (sequelize, DataTypes) => {
  const AttendanceLog = sequelize.define(
    'AttendanceLog',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      deviceSerial: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'device_serial',
        comment: 'SN query param sent by the terminal',
      },
      devicePin: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: 'device_pin',
        comment: 'User ID enrolled on the device; joins to users.device_pin',
      },
      punchTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'punch_time',
        comment: 'Device local wall-clock time, stored verbatim (no TZ shift)',
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        comment: '0=in,1=out,2=break-out,3=break-in,4=OT-in,5=OT-out',
      },
      verifyMode: {
        type: DataTypes.TINYINT,
        allowNull: false,
        field: 'verify_mode',
        comment: '1=fingerprint,4=card,15=face',
      },
    },
    {
      tableName: 'attendance_logs',
      timestamps: true,
      updatedAt: false, // raw device punches are append-only, never edited
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['device_serial', 'device_pin', 'punch_time', 'status'],
          name: 'uq_punch',
        },
        {
          fields: ['device_pin', 'punch_time'],
          name: 'idx_pin_time',
        },
      ],
    }
  )

  // Association is by device_pin (a natural key), not by users.id, because the
  // terminal only ever knows the PIN. Employees with no device_pin populated
  // simply resolve to null here.
  AttendanceLog.associate = (models) => {
    AttendanceLog.belongsTo(models.User, {
      foreignKey: 'devicePin',
      targetKey: 'devicePin',
      as: 'user',
      constraints: false,
    })
  }

  return AttendanceLog
}
