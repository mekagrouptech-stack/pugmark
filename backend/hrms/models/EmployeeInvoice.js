module.exports = (sequelize, DataTypes) => {
  /**
   * One invoice raised by an Invoice Employee (see InvoiceEmployee).
   *
   * The layout mirrors the paper invoice these workers submit:
   *   line 1 — base charges : monthly gross x work days
   *   line 2 — overtime     : hourly rate  x overtime hours
   *   total  — base + overtime, printed in words above the bank details
   */
  const EmployeeInvoice = sequelize.define(
    'EmployeeInvoice',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      invoiceEmployeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'invoice_employee_id',
        references: { model: 'invoice_employees', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'company_id',
        references: { model: 'companies', key: 'id' },
        comment: 'Which of our companies this invoice is billed to (the bill-to party)',
      },
      invoiceNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'invoice_number',
        comment: "The worker's own invoice number, e.g. ARE/2025-26/07",
      },
      invoiceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'invoice_date',
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
      periodFrom: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'period_from',
      },
      periodTo: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'period_to',
      },
      particulars: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description printed on line 1 of the invoice',
      },
      vehicleNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'vehicle_no',
      },
      // ── Line 1: base charges ──────────────────────────────
      monthlyGross: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'monthly_gross',
      },
      workDays: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'work_days',
      },
      baseAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'base_amount',
      },
      // ── Line 2: overtime ──────────────────────────────────
      overtimeRate: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'overtime_rate',
      },
      overtimeHours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'overtime_hours',
      },
      overtimeAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'overtime_amount',
      },
      currency: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: 'QAR',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      paidOn: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'paid_on',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
      },
    },
    {
      tableName: 'employee_invoices',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['invoice_employee_id'] },
        { fields: ['company_id'] },
        { fields: ['year', 'month'] },
        // The same number may legitimately recur across two different workers,
        // so the pair is what has to be unique.
        { unique: true, fields: ['invoice_employee_id', 'invoice_number'] },
      ],
    }
  )

  EmployeeInvoice.associate = (models) => {
    EmployeeInvoice.belongsTo(models.InvoiceEmployee, {
      foreignKey: 'invoiceEmployeeId',
      as: 'invoiceEmployee',
    })
    EmployeeInvoice.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    })
  }

  return EmployeeInvoice
}
