module.exports = (sequelize, DataTypes) => {
  const EducationalInformation = sequelize.define(
    'EducationalInformation',
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
      highestQualification: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'highest_qualification',
      },
      qualificationName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'qualification_name',
      },
      yearOfPassing: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'year_of_passing',
      },
      certifications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'educational_information',
      timestamps: true,
      underscored: true,
    }
  )

  EducationalInformation.associate = (models) => {
    EducationalInformation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
  }

  return EducationalInformation
}
