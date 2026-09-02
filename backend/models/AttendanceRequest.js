module.exports = (sequelize, DataTypes) => {
  const AttendanceRequest = sequelize.define(
    'AttendanceRequest',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'date',
      },
      requestType: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'request_type',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      checkIn: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'check_in',
      },
      checkOut: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'check_out',
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      reportingManagerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reporting_manager_id',
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      approvalNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'approval_note',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      rejectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'rejected_by',
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'rejected_at',
      },
    },
    {
      tableName: 'attendance_requests',
      timestamps: true,
      underscored: true,
    }
  )

  AttendanceRequest.associate = (models) => {
    AttendanceRequest.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    AttendanceRequest.belongsTo(models.User, { foreignKey: 'reportingManagerId', as: 'reportingManager' })
    AttendanceRequest.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' })
    AttendanceRequest.belongsTo(models.User, { foreignKey: 'rejectedBy', as: 'rejector' })
  }

  return AttendanceRequest
}
