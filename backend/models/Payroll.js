module.exports = (sequelize, DataTypes) => {
  const Payroll = sequelize.define(
    'Payroll',
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
        references: {
          model: 'users',
          key: 'id',
        },
      },
      payrollMonth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'payroll_month',
        validate: {
          min: 1,
          max: 12,
        },
      },
      payrollYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'payroll_year',
      },
      monthlySalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'monthly_salary',
      },
      totalWorkingDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'total_working_days',
      },
      fullDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'full_days',
      },
      halfDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'half_days',
      },
      absentDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'absent_days',
      },
      payableDays: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        field: 'payable_days',
      },
      lopDays: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        field: 'lop_days',
      },
      perDaySalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'per_day_salary',
      },
      finalSalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'final_salary',
      },

      // ---- Salary structure breakup for this pay period -------------------
      // Derived from utils/salaryStructure.js (the single source of truth for
      // the company CTC structure) and prorated by attendance. Stored on the
      // row so a payslip always reflects the structure as it was when run.
      pfEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'pf_enabled',
      },
      basic: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      hra: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      specialAllowance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'special_allowance',
      },
      cca: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      conveyance: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      education: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      bonus: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      grossEarned: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'gross_earned',
      },
      employeePF: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'employee_pf',
      },
      employerPF: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'employer_pf',
      },
      professionalTax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'professional_tax',
      },
      // Manual monthly TDS captured on the salary structure, stored per payroll
      // run so a payslip always shows the tax actually deducted that month.
      tds: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
      gratuity: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      totalDeductions: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'total_deductions',
      },
      netPayable: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'net_payable',
      },

      status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSED', 'LOCKED', 'PAID'),
        allowNull: false,
        defaultValue: 'PROCESSED',
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at',
      },
      paidDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_date',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'company_id',
        references: {
          model: 'companies',
          key: 'id',
        },
        comment: 'Foreign key to companies table',
      },
      companyName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'company_name',
        comment: 'Company name at time of payroll generation',
      },
      companyAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'company_address',
        comment: 'Company address at time of payroll generation',
      },
      companyLogoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'company_logo_url',
        comment: 'Company logo URL at time of payroll generation',
      },
      companyRegistrationNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'company_registration_number',
        comment: 'Company registration number at time of payroll generation',
      },
    },
    {
      tableName: 'payrolls',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['payroll_month', 'payroll_year'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['company_id'],
        },
        {
          unique: true,
          fields: ['user_id', 'payroll_month', 'payroll_year', 'company_id'],
          name: 'idx_payrolls_user_month_year_company_unique',
        },
      ],
    }
  )

  // Associations
  Payroll.associate = (models) => {
    Payroll.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })

    Payroll.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    })
  }

  return Payroll
}
