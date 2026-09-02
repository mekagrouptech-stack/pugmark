'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Basic Information
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      your_views_on_organization: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      about_me: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: true,
      },
      date_of_birth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      blood_group: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
        allowNull: true,
      },
      address_for_payslip: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Personal Information
      fathers_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      place_of_birth: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      mother_tongue: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      marital_status: {
        type: Sequelize.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
        allowNull: true,
      },
      date_of_marriage: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      passport_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      aadhaar_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      pan_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      // Contact Information
      mobile_no: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      official_mobile_no: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      personal_email_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city_town: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      pin_code: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      permanent_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergency_contact_person: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      relation: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      emergency_contact_mobile_no: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      // Educational Information
      graduation: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      year_of_passing_graduation: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      post_graduation: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      year_of_passing_post_graduation: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      other_qualification: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      year_of_passing_other_qualification: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      certifications: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      co_curricular_activities_hobbies: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Employment Information
      date_of_joining: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      confirmation_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      employment_status: {
        type: Sequelize.ENUM('Probation', 'Confirmed', 'Contract'),
        allowNull: true,
      },
      notice_period: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      state_tax: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      comp_off_overtime: {
        type: Sequelize.ENUM('Yes', 'No'),
        allowNull: true,
      },
      work_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      company: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_working_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Documents (stored as JSON)
      documents: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '{}',
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

    // Add indexes
    await queryInterface.addIndex('user_profiles', ['user_id'], {
      unique: true,
      name: 'idx_user_profiles_user_id',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_profiles')
  },
}
