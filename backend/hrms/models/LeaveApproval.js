module.exports = (sequelize, DataTypes) => {
  const LeaveApproval = sequelize.define(
    'LeaveApproval',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      leaveId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'leave_id',
        references: { model: 'leaves', key: 'id' },
        onDelete: 'CASCADE',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'approved_by',
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      approvalLevel: {
        type: DataTypes.ENUM('manager', 'hr_head'),
        allowNull: false,
        field: 'approval_level',
      },
      action: {
        type: DataTypes.ENUM('approved', 'rejected'),
        allowNull: false,
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'leave_approvals',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  )

  LeaveApproval.associate = (models) => {
    LeaveApproval.belongsTo(models.Leave, { foreignKey: 'leaveId', as: 'leave' })
    LeaveApproval.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' })
  }

  return LeaveApproval
}
