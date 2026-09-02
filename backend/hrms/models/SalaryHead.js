module.exports = (sequelize, DataTypes) => {
  const SalaryHead = sequelize.define(
    'SalaryHead',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM('EARNING', 'DEDUCTION'),
        allowNull: false,
        defaultValue: 'EARNING',
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    {
      tableName: 'salary_heads',
      timestamps: true,
      underscored: true,
    }
  )

  return SalaryHead
}
