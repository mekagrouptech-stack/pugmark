module.exports = (sequelize, DataTypes) => {
  const ReimbursementExpenseItem = sequelize.define(
    'ReimbursementExpenseItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reimbursementRequestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'reimbursement_request_id',
        references: { model: 'reimbursement_requests', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      expenseDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'expense_date',
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      proofUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'proof_url',
      },
    },
    {
      tableName: 'reimbursement_expense_items',
      timestamps: true,
      underscored: true,
    }
  )

  ReimbursementExpenseItem.associate = (models) => {
    ReimbursementExpenseItem.belongsTo(models.ReimbursementRequest, {
      foreignKey: 'reimbursementRequestId',
      as: 'reimbursementRequest',
    })
  }

  return ReimbursementExpenseItem
}
