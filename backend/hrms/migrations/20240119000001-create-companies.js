'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique company identifier code',
      },
      company_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Company name',
      },
      logo_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Company logo URL/path',
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Company address',
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'India',
        comment: 'Company country',
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
        comment: 'Company currency code (INR, USD, etc.)',
      },
      registration_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Company registration/tax ID',
      },
      tax_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Tax identification number',
      },
      working_days_config: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Working days configuration (e.g., {monday: true, tuesday: true, ...})',
      },
      payroll_cycle: {
        type: Sequelize.ENUM('MONTHLY', 'BIWEEKLY', 'WEEKLY'),
        allowNull: false,
        defaultValue: 'MONTHLY',
        comment: 'Payroll processing cycle',
      },
      payroll_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Day of month when payroll is processed (1-31)',
        validate: {
          min: 1,
          max: 31,
        },
      },
      payslip_template: {
        type: Sequelize.ENUM('STANDARD', 'COMPACT', 'DETAILED'),
        allowNull: false,
        defaultValue: 'STANDARD',
        comment: 'Payslip template type',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Company active status',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    })

    // Add indexes
    await queryInterface.addIndex('companies', ['company_code'], {
      unique: true,
      name: 'idx_companies_company_code',
    })
    await queryInterface.addIndex('companies', ['company_name'], {
      name: 'idx_companies_company_name',
    })
    await queryInterface.addIndex('companies', ['is_active'], {
      name: 'idx_companies_is_active',
    })
    await queryInterface.addIndex('companies', ['country'], {
      name: 'idx_companies_country',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('companies')
  },
}
