module.exports = (sequelize, DataTypes) => {
  /**
   * Invoice Employee — a daily-wage worker or contractor who works for the
   * company but is NOT registered as an HRMS user. They have no login, no
   * employee code and no CTC; they raise an invoice for the days they worked
   * and are paid against it.
   *
   * Everything needed to print their invoice lives here: their address block,
   * their default rates, and their bank details.
   */
  const InvoiceEmployee = sequelize.define(
    'InvoiceEmployee',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Printed as the "from" block at the top of their invoice',
      },
      phone: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      workType: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'work_type',
        comment: 'e.g. "Driver Charges (Qatar Site)"',
      },
      projectName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'project_name',
        comment: 'e.g. "NFXP project trenching and Backfilling"',
      },
      vehicleNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'vehicle_no',
      },
      currency: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: 'QAR',
        comment: 'QAR for the Qatar site, INR for India',
      },
      monthlyGross: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'monthly_gross',
        comment: 'Default monthly gross rate, pre-filled on new invoices',
      },
      overtimeRate: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'overtime_rate',
        comment: 'Default per-hour overtime rate, pre-filled on new invoices',
      },
      bankName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'bank_name',
      },
      bankSwift: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'bank_swift',
      },
      accountNo: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'account_no',
      },
      iban: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'invoice_employees',
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ['is_active'] }],
    }
  )

  InvoiceEmployee.associate = (models) => {
    InvoiceEmployee.hasMany(models.EmployeeInvoice, {
      foreignKey: 'invoiceEmployeeId',
      as: 'invoices',
    })
  }

  return InvoiceEmployee
}
