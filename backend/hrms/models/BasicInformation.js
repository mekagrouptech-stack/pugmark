module.exports = (sequelize, DataTypes) => {
  const BasicInformation = sequelize.define(
    'BasicInformation',
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
      avatar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fullName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'full_name',
      },
      aboutMe: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'about_me',
      },
      gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'date_of_birth',
      },
      bloodGroup: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
        allowNull: true,
        field: 'blood_group',
      },
    },
    {
      tableName: 'basic_information',
      timestamps: true,
      underscored: true,
    }
  )

  BasicInformation.associate = (models) => {
    BasicInformation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
  }

  return BasicInformation
}
