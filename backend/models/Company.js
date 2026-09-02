module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define(
    'Company',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'company_code',
      },
      companyName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'company_name',
      },
      logoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'logo_url',
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
      },
      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'postal_code',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
      },
      registrationNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'registration_number',
      },
      taxId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'tax_id',
      },
      employeeCodePrefix: {
        type: DataTypes.STRING(16),
        allowNull: true,
        field: 'employee_code_prefix',
        comment: 'Prefix for auto-generated employee codes, e.g. AMPL -> AMPL1, AMPL2',
      },
      workingDaysConfig: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'working_days_config',
        defaultValue: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
      },
      payrollCycle: {
        type: DataTypes.ENUM('MONTHLY', 'BIWEEKLY', 'WEEKLY'),
        allowNull: false,
        defaultValue: 'MONTHLY',
        field: 'payroll_cycle',
      },
      payrollDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'payroll_day',
        validate: {
          min: 1,
          max: 31,
        },
      },
      payslipTemplate: {
        type: DataTypes.ENUM('STANDARD', 'COMPACT', 'DETAILED'),
        allowNull: false,
        defaultValue: 'STANDARD',
        field: 'payslip_template',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'companies',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['company_code'],
          name: 'idx_companies_company_code',
        },
        {
          fields: ['company_name'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['country'],
        },
      ],
    }
  )

  // Associations
  Company.associate = (models) => {
    Company.hasMany(models.User, {
      foreignKey: 'companyId',
      as: 'employees',
    })

    Company.hasMany(models.Payroll, {
      foreignKey: 'companyId',
      as: 'payrolls',
    })
  }

  return Company
}
