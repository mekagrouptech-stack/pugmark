module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define(
    'Leave',
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
      leaveType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'leave_type',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date',
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'end_date',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Pending_Manager', 'Pending_HR', 'Approved', 'Rejected', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending_Manager',
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
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      hrHeadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'hr_head_id',
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      managerApprovedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'manager_approved_by',
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      managerApprovedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'manager_approved_at',
      },
    },
    {
      tableName: 'leaves',
      timestamps: true,
      underscored: true,
    }
  )

  Leave.associate = (models) => {
    Leave.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    Leave.belongsTo(models.User, { foreignKey: 'reportingManagerId', as: 'reportingManager' })
    Leave.belongsTo(models.User, { foreignKey: 'hrHeadId', as: 'hrHead', required: false })
    Leave.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' })
    if (models.LeaveApproval) {
      Leave.hasMany(models.LeaveApproval, { foreignKey: 'leaveId', as: 'approvals' })
    }
  }

  return Leave
}
