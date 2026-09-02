module.exports = (sequelize, DataTypes) => {
  const LeaveBalanceAdjustment = sequelize.define(
    'LeaveBalanceAdjustment',
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
      },
      // Adjustments are scoped to a leave year so the balance page for 2025
      // never picks up a credit that was granted for 2026.
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Only the quota-bearing types are adjustable. LWP is a ceiling on unpaid
      // absence rather than an entitlement, so there is nothing to credit.
      leaveType: {
        type: DataTypes.ENUM('earned', 'compOff'),
        allowNull: false,
        field: 'leave_type',
      },
      // Signed on purpose: positive credits the employee (comp off earned,
      // opening balance carried forward), negative debits them (correcting an
      // over-grant). Storing one signed number keeps the sum a plain SUM().
      days: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
      },
      // Denormalised so the audit trail survives the granting HR user being
      // deleted, which the permanent-delete flow allows.
      createdByName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'created_by_name',
      },
    },
    {
      tableName: 'leave_balance_adjustments',
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ['user_id', 'year'] }],
    }
  )

  LeaveBalanceAdjustment.associate = (models) => {
    LeaveBalanceAdjustment.belongsTo(models.User, { foreignKey: 'userId', as: 'employee' })
    LeaveBalanceAdjustment.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' })
  }

  return LeaveBalanceAdjustment
}
