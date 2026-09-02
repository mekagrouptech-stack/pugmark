module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    'Document',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      documentType: {
        type: DataTypes.ENUM(
          'panCard',
          'aadhaarCard',
          'cancelCheque',
          'photo',
          'passportPhotoPage',
          'passportAddressPage',
          'passportBackSide',
          'latestMarksheet',
          // legacy types, kept so existing rows stay readable
          'passport',
          'markSheets',
          'otherDocuments'
        ),
        allowNull: false,
        field: 'document_type',
      },
      fileUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'file_url',
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'file_name',
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'file_size',
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'mime_type',
      },
    },
    {
      tableName: 'documents',
      timestamps: true,
      underscored: true,
    }
  )

  Document.associate = (models) => {
    Document.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
  }

  return Document
}
