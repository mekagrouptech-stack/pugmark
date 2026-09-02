'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payrolls', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      payroll_month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Month (1-12)',
        validate: {
          min: 1,
          max: 12,
        },
      },
      payroll_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Year (e.g., 2024)',
      },
      monthly_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Monthly salary at the time of payroll calculation',
      },
      total_working_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Total working days in the month',
      },
      full_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of full days present',
      },
      half_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of half days',
      },
      absent_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of absent days',
      },
      payable_days: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Payable days (full_days + half_days * 0.5)',
      },
      lop_days: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Loss of Pay days (total_working_days - payable_days)',
      },
      per_day_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Per day salary (monthly_salary / total_working_days)',
      },
      final_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Final payable salary (payable_days * per_day_salary)',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSED', 'LOCKED', 'PAID'),
        allowNull: false,
        defaultValue: 'PROCESSED',
        comment: 'Payroll status',
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When payroll was processed',
      },
      paid_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date when salary was paid',
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional remarks or notes',
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
    await queryInterface.addIndex('payrolls', ['user_id'], {
      name: 'idx_payrolls_user_id',
    })
    await queryInterface.addIndex('payrolls', ['payroll_month', 'payroll_year'], {
      name: 'idx_payrolls_month_year',
    })
    await queryInterface.addIndex('payrolls', ['status'], {
      name: 'idx_payrolls_status',
    })
    // Unique constraint to prevent duplicate payroll for same user, month, year
    await queryInterface.addIndex('payrolls', ['user_id', 'payroll_month', 'payroll_year'], {
      unique: true,
      name: 'idx_payrolls_user_month_year_unique',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payrolls')
  },
}
