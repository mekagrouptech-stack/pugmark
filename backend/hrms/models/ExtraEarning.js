module.exports = (sequelize, DataTypes) => {
  const ExtraEarning = sequelize.define(
    'ExtraEarning',
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
        onUpdate: 'CASCADE',
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Bonus, Overtime, Allowance, Deduction, Fine, Advance, etc.',
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Positive for earnings, negative for deductions',
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 12 },
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'extra_earnings_deductions',
      timestamps: true,
      underscored: true,
    }
  )

  ExtraEarning.associate = (models) => {
    ExtraEarning.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
  }

  return ExtraEarning
}
