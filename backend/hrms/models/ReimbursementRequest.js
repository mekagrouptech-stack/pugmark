module.exports = (sequelize, DataTypes) => {
  const ReimbursementRequest = sequelize.define(
    'ReimbursementRequest',
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
      },
      requestType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'request_type',
      },
      periodFrom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'period_from',
      },
      periodTo: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'period_to',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: { model: 'users', key: 'id' },
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
    },
    {
      tableName: 'reimbursement_requests',
      timestamps: true,
      underscored: true,
    }
  )

  ReimbursementRequest.associate = (models) => {
    ReimbursementRequest.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
    ReimbursementRequest.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    })
    ReimbursementRequest.hasMany(models.ReimbursementExpenseItem, {
      foreignKey: 'reimbursementRequestId',
      as: 'expenseDetails',
    })
  }

  return ReimbursementRequest
}
