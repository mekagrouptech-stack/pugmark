'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
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
      document_type: {
        type: Sequelize.ENUM('panCard', 'aadhaarCard', 'passport', 'markSheets', 'otherDocuments'),
        allowNull: false,
      },
      file_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      mime_type: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex('documents', ['user_id'], {
      name: 'idx_documents_user_id',
    })
    await queryInterface.addIndex('documents', ['user_id', 'document_type'], {
      name: 'idx_documents_user_type',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('documents')
  },
}
