module.exports = (sequelize, DataTypes) => {
  const EmploymentInformation = sequelize.define(
    'EmploymentInformation',
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
      dateOfJoining: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'date_of_joining',
      },
      confirmationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'confirmation_date',
      },
      employmentStatus: {
        type: DataTypes.ENUM('Probation', 'Confirmed', 'Contract'),
        allowNull: true,
        field: 'employment_status',
      },
      noticePeriod: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'notice_period',
      },
      stateTax: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'state_tax',
      },
      compOffOvertime: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
        field: 'comp_off_overtime',
      },
      workLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'work_location',
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'company_id',
        references: {
          model: 'companies',
          key: 'id',
        },
        comment: 'Foreign key to companies table',
      },
      lastWorkingDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_working_date',
      },
    },
    {
      tableName: 'employment_information',
      timestamps: true,
      underscored: true,
    }
  )

  EmploymentInformation.associate = (models) => {
    EmploymentInformation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
    EmploymentInformation.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    })
  }

  return EmploymentInformation
}
