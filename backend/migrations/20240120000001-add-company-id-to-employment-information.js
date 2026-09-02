'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add company_id column to employment_information table
    await queryInterface.addColumn('employment_information', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Foreign key to companies table',
    })

    // Add index for company_id
    await queryInterface.addIndex('employment_information', ['company_id'], {
      name: 'idx_employment_information_company_id',
    })

    // Migrate existing company string data to company_id if possible
    // This will try to match company names to company IDs
    const [results] = await queryInterface.sequelize.query(`
      SELECT DISTINCT company 
      FROM employment_information 
      WHERE company IS NOT NULL AND company != ''
    `)

    for (const row of results) {
      const companyName = row.company
      if (companyName) {
        // Try to find matching company
        const [companies] = await queryInterface.sequelize.query(`
          SELECT id FROM companies WHERE company_name = :companyName LIMIT 1
        `, {
          replacements: { companyName }
        })

        if (companies.length > 0) {
          const companyId = companies[0].id
          // Update employment_information with matching company_id
          await queryInterface.sequelize.query(`
            UPDATE employment_information 
            SET company_id = :companyId 
            WHERE company = :companyName
          `, {
            replacements: { companyId, companyName }
          })
        }
      }
    }

    // Remove the old company string column after migration
    await queryInterface.removeColumn('employment_information', 'company')
  },

  async down(queryInterface, Sequelize) {
    // Add back company column
    await queryInterface.addColumn('employment_information', 'company', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })

    // Migrate company_id back to company string
    await queryInterface.sequelize.query(`
      UPDATE employment_information ei
      INNER JOIN companies c ON ei.company_id = c.id
      SET ei.company = c.company_name
      WHERE ei.company_id IS NOT NULL
    `)

    // Remove company_id column
    await queryInterface.removeIndex('employment_information', 'idx_employment_information_company_id')
    await queryInterface.removeColumn('employment_information', 'company_id')
  },
}
