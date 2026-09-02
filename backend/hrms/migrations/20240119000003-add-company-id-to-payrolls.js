'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add company_id column to payrolls table
    await queryInterface.addColumn('payrolls', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null initially for backward compatibility
      references: {
        model: 'companies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Foreign key to companies table',
    })

    // Add company branding fields
    await queryInterface.addColumn('payrolls', 'company_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Company name at time of payroll generation',
    })

    await queryInterface.addColumn('payrolls', 'company_address', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Company address at time of payroll generation',
    })

    await queryInterface.addColumn('payrolls', 'company_logo_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Company logo URL at time of payroll generation',
    })

    await queryInterface.addColumn('payrolls', 'company_registration_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Company registration number at time of payroll generation',
    })

    // Add index for company_id
    await queryInterface.addIndex('payrolls', ['company_id'], {
      name: 'idx_payrolls_company_id',
    })

    // Update unique constraint to include company_id
    await queryInterface.removeIndex('payrolls', 'idx_payrolls_user_month_year_unique')
    await queryInterface.addIndex('payrolls', ['user_id', 'payroll_month', 'payroll_year', 'company_id'], {
      unique: true,
      name: 'idx_payrolls_user_month_year_company_unique',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('payrolls', 'idx_payrolls_user_month_year_company_unique')
    await queryInterface.removeIndex('payrolls', 'idx_payrolls_company_id')
    await queryInterface.removeColumn('payrolls', 'company_registration_number')
    await queryInterface.removeColumn('payrolls', 'company_logo_url')
    await queryInterface.removeColumn('payrolls', 'company_address')
    await queryInterface.removeColumn('payrolls', 'company_name')
    await queryInterface.removeColumn('payrolls', 'company_id')
    // Restore original unique constraint
    await queryInterface.addIndex('payrolls', ['user_id', 'payroll_month', 'payroll_year'], {
      unique: true,
      name: 'idx_payrolls_user_month_year_unique',
    })
  },
}
