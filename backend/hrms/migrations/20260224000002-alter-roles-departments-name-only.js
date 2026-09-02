'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // If tables have extra columns (code, description, is_active), remove them
    const dialect = queryInterface.sequelize.getDialect()
    if (dialect === 'mysql') {
      try {
        const [rolesCols] = await queryInterface.sequelize.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'code'"
        )
        if (rolesCols && rolesCols.length > 0) {
          await queryInterface.removeColumn('roles', 'code')
          await queryInterface.removeColumn('roles', 'description')
          await queryInterface.removeColumn('roles', 'is_active')
        }
      } catch (e) {
        // Ignore - columns may not exist
      }
      try {
        const [deptCols] = await queryInterface.sequelize.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments' AND COLUMN_NAME = 'code'"
        )
        if (deptCols && deptCols.length > 0) {
          await queryInterface.removeColumn('departments', 'code')
          await queryInterface.removeColumn('departments', 'description')
          await queryInterface.removeColumn('departments', 'is_active')
        }
      } catch (e) {
        // Ignore
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Cannot easily restore removed columns
  },
}
