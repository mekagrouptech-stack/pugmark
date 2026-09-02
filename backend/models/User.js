const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      // Official company email. Notices (and other official mail) go here when
      // set; otherwise the system falls back to the personal `email` above.
      companyEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'company_email',
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      employeeCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      devicePin: {
        type: DataTypes.STRING(32),
        allowNull: true,
        unique: true,
        field: 'device_pin',
        comment: 'Biometric terminal User ID (enrolled on the eSSL device)',
      },
      role: {
        type: DataTypes.ENUM('EMPLOYEE', 'MANAGER', 'HR', 'HEAD_HR', 'ADMIN', 'HOD'),
        allowNull: false,
        defaultValue: 'EMPLOYEE',
      },
      department: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      designation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      monthlySalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'monthly_salary',
        comment: 'Monthly CTC (Total Cost to Company) in INR',
      },
      pfEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'pf_enabled',
        comment: 'Whether Provident Fund applies (with-PF vs without-PF salary structure)',
      },
      monthlyTds: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'monthly_tds',
        comment: 'Manually entered monthly TDS (income tax) deducted from take-home',
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
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reportingManagerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reporting_manager_id',
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      hrHeadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'hr_head_id',
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      punchInLatitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        field: 'punch_in_latitude',
        comment: 'Allowed punch-in latitude for this user',
      },
      punchInLongitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        field: 'punch_in_longitude',
        comment: 'Allowed punch-in longitude for this user',
      },
      punchInRadius: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 100,
        field: 'punch_in_radius',
        comment: 'Allowed punch-in radius in meters',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10)
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10)
          }
        },
      },
    }
  )

  // Instance methods
  User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
  }

  User.prototype.toJSON = function () {
    const values = { ...this.get() }
    delete values.password
    return values
  }

  // Associations
  User.associate = (models) => {
    User.belongsToMany(models.Office, {
      through: models.UserOffice,
      foreignKey: 'userId',
      as: 'offices',
    })

    User.hasMany(models.AttendanceRecord, {
      foreignKey: 'userId',
      as: 'attendanceRecords',
    })

    User.hasOne(models.UserProfile, {
      foreignKey: 'userId',
      as: 'profile',
    })

    User.hasOne(models.BasicInformation, {
      foreignKey: 'userId',
      as: 'basicInformation',
    })

    User.hasOne(models.PersonalInformation, {
      foreignKey: 'userId',
      as: 'personalInformation',
    })

    User.hasOne(models.ContactInformation, {
      foreignKey: 'userId',
      as: 'contactInformation',
    })

    User.hasOne(models.EducationalInformation, {
      foreignKey: 'userId',
      as: 'educationalInformation',
    })

    User.hasOne(models.EmploymentInformation, {
      foreignKey: 'userId',
      as: 'employmentInformation',
    })

    User.hasMany(models.Document, {
      foreignKey: 'userId',
      as: 'documents',
    })

    User.hasMany(models.Payroll, {
      foreignKey: 'userId',
      as: 'payrolls',
    })

    User.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    })

    User.belongsTo(models.User, {
      foreignKey: 'reportingManagerId',
      as: 'reportingManager',
    })
  }

  return User
}
