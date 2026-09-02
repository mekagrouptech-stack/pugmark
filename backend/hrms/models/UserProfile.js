module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define(
    'UserProfile',
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
      // Basic Information
      avatar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      yourViewsOnOrganization: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'your_views_on_organization',
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
      addressForPayslip: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'address_for_payslip',
      },
      // Personal Information
      fathersName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'fathers_name',
      },
      placeOfBirth: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'place_of_birth',
      },
      motherTongue: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'mother_tongue',
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
      // Contact Information
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
      // Educational Information
      graduation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      yearOfPassingGraduation: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'year_of_passing_graduation',
      },
      postGraduation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'post_graduation',
      },
      yearOfPassingPostGraduation: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'year_of_passing_post_graduation',
      },
      otherQualification: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'other_qualification',
      },
      yearOfPassingOtherQualification: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'year_of_passing_other_qualification',
      },
      certifications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      coCurricularActivitiesHobbies: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'co_curricular_activities_hobbies',
      },
      // Employment Information
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
      // Documents
      documents: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      tableName: 'user_profiles',
      timestamps: true,
      underscored: true,
    }
  )

  // Associations
  UserProfile.associate = (models) => {
    UserProfile.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
    UserProfile.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    })
  }

  return UserProfile
}
