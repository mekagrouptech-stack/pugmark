module.exports = (sequelize, DataTypes) => {
  const ContactInformation = sequelize.define(
    'ContactInformation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'user_id',
      },
      mobileNo: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'mobile_no',
      },
      officialMobileNo: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'official_mobile_no',
      },
      personalEmailId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'personal_email_id',
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cityTown: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'city_town',
      },
      pinCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'pin_code',
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      permanentAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'permanent_address',
      },
      emergencyContactPerson: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'emergency_contact_person',
      },
      relation: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      emergencyContactMobileNo: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'emergency_contact_mobile_no',
      },
    },
    {
      tableName: 'contact_information',
      timestamps: true,
      underscored: true,
    }
  )

  ContactInformation.associate = (models) => {
    ContactInformation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
  }

  return ContactInformation
}
