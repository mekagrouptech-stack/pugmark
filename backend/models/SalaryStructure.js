module.exports = (sequelize, DataTypes) => {
  const SalaryStructure = sequelize.define(
    'SalaryStructure',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      totalEarnings: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
        field: 'total_earnings',
      },
      totalDeductions: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
        field: 'total_deductions',
      },
      totalSalary: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
        field: 'total_salary',
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'Published',
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'company_id',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'modified_by',
      },
    },
    {
      tableName: 'salary_structures',
      timestamps: true,
      underscored: true,
    }
  )

  SalaryStructure.associate = (models) => {
    SalaryStructure.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' })
    SalaryStructure.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' })
    SalaryStructure.belongsTo(models.User, { foreignKey: 'modifiedBy', as: 'modifier' })
  }

  return SalaryStructure
}
