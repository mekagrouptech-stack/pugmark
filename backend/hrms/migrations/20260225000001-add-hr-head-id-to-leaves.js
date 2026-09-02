'use strict'

/**
 * Safely add hr_head_id and related columns to leaves table.
 * Idempotent - skips if columns already exist.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('leaves')
    const hasHrHeadId = !!tableInfo.hr_head_id
    const hasManagerApprovedBy = !!tableInfo.manager_approved_by
    const hasManagerApprovedAt = !!tableInfo.manager_approved_at

    if (!hasHrHeadId) {
      await queryInterface.addColumn('leaves', 'hr_head_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      })
      await queryInterface.addIndex('leaves', ['hr_head_id'], { name: 'idx_leaves_hr_head_id' })
    }
    if (!hasManagerApprovedBy) {
      await queryInterface.addColumn('leaves', 'manager_approved_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      })
    }
    if (!hasManagerApprovedAt) {
      await queryInterface.addColumn('leaves', 'manager_approved_at', {
        type: Sequelize.DATE,
        allowNull: true,
      })
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('leaves')
    if (tableInfo.hr_head_id) {
      await queryInterface.removeIndex('leaves', 'idx_leaves_hr_head_id')
      await queryInterface.removeColumn('leaves', 'hr_head_id')
    }
    if (tableInfo.manager_approved_by) {
      await queryInterface.removeColumn('leaves', 'manager_approved_by')
    }
    if (tableInfo.manager_approved_at) {
      await queryInterface.removeColumn('leaves', 'manager_approved_at')
    }
  },
}
