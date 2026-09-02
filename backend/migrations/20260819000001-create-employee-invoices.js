'use strict'

/**
 * Invoice employees — daily-wage workers and contractors who are NOT registered
 * as HRMS users (no login, no employee code, no CTC). They submit an invoice
 * for the period worked and are paid against it.
 *
 *   invoice_employees  — the person: address, default rates, bank details
 *   employee_invoices  — one bill each, base line + overtime line
 */
// Adding an index that is already there is not an error worth failing on — it
// just means this migration is filling in a partially-created schema.
const addIndexIfMissing = async (queryInterface, table, fields, options) => {
  try {
    await queryInterface.addIndex(table, fields, options)
  } catch (err) {
    if (!/duplicate|exists/i.test(err.message)) throw err
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_employees', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: true },
      phone: { type: Sequelize.STRING(32), allowNull: true },
      email: { type: Sequelize.STRING(150), allowNull: true },
      work_type: { type: Sequelize.STRING(150), allowNull: true },
      project_name: { type: Sequelize.STRING(200), allowNull: true },
      vehicle_no: { type: Sequelize.STRING(50), allowNull: true },
      currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: 'QAR' },
      monthly_gross: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      overtime_rate: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      bank_name: { type: Sequelize.STRING(150), allowNull: true },
      bank_swift: { type: Sequelize.STRING(32), allowNull: true },
      account_no: { type: Sequelize.STRING(64), allowNull: true },
      iban: { type: Sequelize.STRING(64), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    await addIndexIfMissing(queryInterface, 'invoice_employees', ['is_active'], {
      name: 'invoice_employees_is_active',
    })

    await queryInterface.createTable('employee_invoices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      invoice_employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'invoice_employees', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      invoice_number: { type: Sequelize.STRING(64), allowNull: false },
      invoice_date: { type: Sequelize.DATEONLY, allowNull: false },
      month: { type: Sequelize.INTEGER, allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      period_from: { type: Sequelize.DATEONLY, allowNull: true },
      period_to: { type: Sequelize.DATEONLY, allowNull: true },
      particulars: { type: Sequelize.TEXT, allowNull: true },
      vehicle_no: { type: Sequelize.STRING(50), allowNull: true },
      monthly_gross: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      work_days: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      base_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      overtime_rate: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      overtime_hours: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
      overtime_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: 'QAR' },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      paid_on: { type: Sequelize.DATEONLY, allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    await addIndexIfMissing(queryInterface, 'employee_invoices', ['invoice_employee_id'], {
      name: 'employee_invoices_employee_id',
    })
    await addIndexIfMissing(queryInterface, 'employee_invoices', ['year', 'month'], {
      name: 'employee_invoices_year_month',
    })
    await addIndexIfMissing(
      queryInterface,
      'employee_invoices',
      ['invoice_employee_id', 'invoice_number'],
      { name: 'employee_invoices_employee_invoice_number', unique: true }
    )
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('employee_invoices')
    await queryInterface.dropTable('invoice_employees')
  },
}
