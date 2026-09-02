'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reimbursement_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      request_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      period_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_to: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
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

    await queryInterface.addIndex('reimbursement_requests', ['user_id'], { name: 'idx_reimbursement_requests_user_id' })
    await queryInterface.addIndex('reimbursement_requests', ['status'], { name: 'idx_reimbursement_requests_status' })

    await queryInterface.createTable('reimbursement_expense_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reimbursement_request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'reimbursement_requests', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      expense_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      proof_url: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('reimbursement_expense_items', ['reimbursement_request_id'], {
      name: 'idx_reimbursement_expense_items_request_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reimbursement_expense_items')
    await queryInterface.dropTable('reimbursement_requests')
  },
}
