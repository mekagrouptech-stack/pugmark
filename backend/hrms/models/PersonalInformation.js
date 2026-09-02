module.exports = (sequelize, DataTypes) => {
  const PersonalInformation = sequelize.define(
    'PersonalInformation',
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
      fathersName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'fathers_name',
      },
      mothersName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'mothers_name',
      },
      spouseName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'spouse_name',
      },
      placeOfBirth: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'place_of_birth',
      },
      maritalStatus: {
        type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
        allowNull: true,
        field: 'marital_status',
      },
      dateOfMarriage: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'date_of_marriage',
      },
      passportNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'passport_number',
      },
      aadhaarNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'aadhaar_number',
      },
      panNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'pan_number',
      },
    },
    {
      tableName: 'personal_information',
      timestamps: true,
      underscored: true,
    }
  )

  PersonalInformation.associate = (models) => {
    PersonalInformation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
  }

  return PersonalInformation
}
