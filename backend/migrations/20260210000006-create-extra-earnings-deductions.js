'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('extra_earnings_deductions', {
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
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Bonus, Overtime, Allowance, Deduction, Fine, Advance, etc.',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Positive for earnings, negative for deductions',
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Month 1-12',
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Year e.g. 2024',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('extra_earnings_deductions', ['user_id'], {
      name: 'idx_extra_earnings_user_id',
    })
    await queryInterface.addIndex('extra_earnings_deductions', ['month', 'year'], {
      name: 'idx_extra_earnings_month_year',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('extra_earnings_deductions')
  },
}
