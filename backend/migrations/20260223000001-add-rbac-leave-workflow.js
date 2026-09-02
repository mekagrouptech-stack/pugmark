'use strict'

/**
 * RBAC & Leave Approval Workflow Migration
 * - Adds hr_head_id to leaves for two-step approval
 * - Updates leave status enum: Pending_Manager, Pending_HR, Approved, Rejected, Cancelled
 * - Creates leave_approvals table for approval history
 * - Adds hr_head_id to users (optional - HR Head per company/department)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add hr_head_id to leaves table
    await queryInterface.addColumn('leaves', 'hr_head_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    await queryInterface.addIndex('leaves', ['hr_head_id'], { name: 'idx_leaves_hr_head_id' })

    // Add manager_approved_at and manager_approved_by for two-step workflow
    await queryInterface.addColumn('leaves', 'manager_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('leaves', 'manager_approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })

    // Migrate existing Pending to Pending_Manager (before enum change)
    await queryInterface.sequelize.query(
      "UPDATE leaves SET status = 'Pending_Manager' WHERE status = 'Pending'"
    )
    // Alter status enum - MySQL requires recreating the column
    await queryInterface.changeColumn('leaves', 'status', {
      type: Sequelize.ENUM('Pending_Manager', 'Pending_HR', 'Approved', 'Rejected', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending_Manager',
    })

    // Create leave_approvals table for approval history
    await queryInterface.createTable('leave_approvals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      leave_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'leaves', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      approval_level: {
        type: Sequelize.ENUM('manager', 'hr_head'),
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM('approved', 'rejected'),
        allowNull: false,
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
    await queryInterface.addIndex('leave_approvals', ['leave_id'])
    await queryInterface.addIndex('leave_approvals', ['approved_by'])

    // Add hr_head_id to users for department/company HR Head assignment
    await queryInterface.addColumn('users', 'hr_head_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'hr_head_id')
    await queryInterface.dropTable('leave_approvals')
    await queryInterface.removeColumn('leaves', 'manager_approved_by')
    await queryInterface.removeColumn('leaves', 'manager_approved_at')
    await queryInterface.removeColumn('leaves', 'hr_head_id')
    await queryInterface.changeColumn('leaves', 'status', {
      type: Sequelize.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending',
    })
  },
}
