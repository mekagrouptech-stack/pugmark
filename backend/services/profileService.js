const {
  User,
  BasicInformation,
  PersonalInformation,
  ContactInformation,
  EducationalInformation,
  EmploymentInformation,
  Document,
  Company,
} = require('../models')
const { NotFoundError, BadRequestError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Profile Service
 * Handles all profile-related business logic with separate tables
 */
class ProfileService {
  /**
   * Get user profile from all tables
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Profile data
   */
  async getProfile(userId) {
    try {
      // Fetch user with all related profile tables
      const user = await User.findOne({
        where: { id: userId },
        attributes: ['id', 'name', 'email', 'employeeCode', 'department', 'designation', 'role'],
        include: [
          {
            model: BasicInformation,
            as: 'basicInformation',
            required: false,
          },
          {
            model: PersonalInformation,
            as: 'personalInformation',
            required: false,
          },
          {
            model: ContactInformation,
            as: 'contactInformation',
            required: false,
          },
          {
            model: EducationalInformation,
            as: 'educationalInformation',
            required: false,
          },
          {
            model: EmploymentInformation,
            as: 'employmentInformation',
            required: false,
            include: [
              {
                model: Company,
                as: 'company',
                required: false,
                attributes: ['id', 'companyName', 'companyCode'],
              },
            ],
          },
          {
            model: Document,
            as: 'documents',
            required: false,
          },
        ],
      })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      // Transform to frontend-friendly format
      const profileData = this.transformProfileData(user)

      return profileData
    } catch (error) {
      logger.error('Error fetching profile:', error)
      throw error
    }
  }

  /**
   * Update a single profile field
   * @param {number} userId - User ID
   * @param {string} group - Profile group (basicInformation, personalInformation, etc.)
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {Promise<Object>} Updated profile data
   */
  async updateField(userId, group, field, value) {
    try {
      // Map frontend field names to database column names
      const fieldMapping = this.getFieldMapping()
      const dbField = fieldMapping[field]

      if (!dbField) {
        throw new BadRequestError(`Invalid field: ${field}`)
      }

      // Handle date fields
      if (value && (field.includes('Date') || field.includes('date'))) {
        value = new Date(value)
      }

      // Handle companyId field - convert to integer
      if (field === 'companyId') {
        value = value ? parseInt(value) : null
      }

      // Handle documents group separately
      if (group === 'documents') {
        await this.updateDocument(userId, field, value)
      } else {
        // Route by field name so merged UI sections can span several tables
        const Model = this.getModelForField(field) || this.getModelForGroup(group)
        if (!Model) {
          throw new BadRequestError(`Invalid group: ${group}`)
        }

        // Find or create the record
        let record = await Model.findOne({ where: { userId } })
        if (!record) {
          record = await Model.create({ userId })
        }

        // Update the field
        await record.update({ [dbField]: value })
      }

      // Fetch updated profile
      const profile = await this.getProfile(userId)

      return {
        group,
        field,
        value,
        profile,
      }
    } catch (error) {
      logger.error('Error updating profile field:', error)
      throw error
    }
  }

  /**
   * Update an entire profile group
   * @param {number} userId - User ID
   * @param {string} group - Profile group
   * @param {Object} data - Group data
   * @returns {Promise<Object>} Updated profile data
   */
  async updateGroup(userId, group, data) {
    try {
      const fieldMapping = this.getFieldMapping()

      // Handle documents group separately
      if (group === 'documents') {
        // Update each document field
        for (const [field, value] of Object.entries(data)) {
          await this.updateDocument(userId, field, value)
        }
      } else {
        // A section can mix fields from several tables (Personal Information
        // shows contact fields too), so bucket the payload by owning model.
        const buckets = new Map()

        Object.keys(data).forEach((field) => {
          const dbField = fieldMapping[field]
          if (!dbField) return

          const Model = this.getModelForField(field) || this.getModelForGroup(group)
          if (!Model) return

          if (!buckets.has(Model)) {
            buckets.set(Model, {})
          }

          // Handle date fields
          if (data[field] && (field.includes('Date') || field.includes('date'))) {
            buckets.get(Model)[dbField] = new Date(data[field])
          } else {
            buckets.get(Model)[dbField] = data[field]
          }
        })

        if (!buckets.size && !this.getModelForGroup(group)) {
          throw new BadRequestError(`Invalid group: ${group}`)
        }

        for (const [Model, updateData] of buckets.entries()) {
          // Find or create the record
          let record = await Model.findOne({ where: { userId } })
          if (!record) {
            record = await Model.create({ userId })
          }

          // Update all fields belonging to this table
          await record.update(updateData)
        }
      }

      // Fetch updated profile
      const profile = await this.getProfile(userId)

      return {
        group,
        data,
        profile,
      }
    } catch (error) {
      logger.error('Error updating profile group:', error)
      throw error
    }
  }

  /**
   * Update document
   * @param {number} userId - User ID
   * @param {string} field - Document field name
   * @param {any} value - Document URL or array of URLs
   * @returns {Promise<void>}
   */
  async updateDocument(userId, field, value) {
    // Map field names to document types
    const fieldToType = {
      panCard: 'panCard',
      aadhaarCard: 'aadhaarCard',
      cancelCheque: 'cancelCheque',
      photo: 'photo',
      passportPhotoPage: 'passportPhotoPage',
      passportAddressPage: 'passportAddressPage',
      passportBackSide: 'passportBackSide',
      latestMarksheet: 'latestMarksheet',
    }

    const documentType = fieldToType[field]
    if (!documentType) {
      throw new BadRequestError(`Invalid document field: ${field}`)
    }

    // Every document slot holds a single file - replace whatever is there
    await Document.destroy({
      where: {
        userId,
        documentType,
      },
    })

    // Create new document record if value is provided
    if (value) {
      await Document.create({
        userId,
        documentType,
        fileUrl: value,
      })
    }
  }

  /**
   * Get model for a profile group
   * @param {string} group - Profile group name
   * @returns {Model|null} Sequelize model
   */
  getModelForGroup(group) {
    const groupToModel = {
      basicInformation: BasicInformation,
      personalInformation: PersonalInformation,
      contactInformation: ContactInformation,
      emergencyContact: ContactInformation,
      educationalInformation: EducationalInformation,
      employmentInformation: EmploymentInformation,
    }
    return groupToModel[group] || null
  }

  /**
   * Get the model that owns a given field.
   * The UI merges fields from several tables into one section (e.g. Personal
   * Information now shows contact fields too), so writes are routed by field
   * name rather than by the section the field was displayed in.
   * @param {string} field - Frontend field name
   * @returns {Object|null} Sequelize model
   */
  getModelForField(field) {
    const fieldToModel = {
      BasicInformation: [
        'avatar',
        'fullName',
        'aboutMe',
        'gender',
        'dateOfBirth',
        'bloodGroup',
      ],
      PersonalInformation: [
        'fathersName',
        'mothersName',
        'spouseName',
        'placeOfBirth',
        'maritalStatus',
        'dateOfMarriage',
        'passportNumber',
        'aadhaarNumber',
        'panNumber',
      ],
      ContactInformation: [
        'mobileNo',
        'officialMobileNo',
        'personalEmailId',
        'address',
        'cityTown',
        'pinCode',
        'state',
        'country',
        'permanentAddress',
        'emergencyContactPerson',
        'relation',
        'emergencyContactMobileNo',
      ],
      EducationalInformation: ['highestQualification', 'qualificationName', 'yearOfPassing', 'certifications'],
      EmploymentInformation: [
        'dateOfJoining',
        'confirmationDate',
        'employmentStatus',
        'noticePeriod',
        'stateTax',
        'compOffOvertime',
        'workLocation',
        'companyId',
        'lastWorkingDate',
      ],
    }

    const models = {
      BasicInformation,
      PersonalInformation,
      ContactInformation,
      EducationalInformation,
      EmploymentInformation,
    }

    const owner = Object.keys(fieldToModel).find((name) => fieldToModel[name].includes(field))
    return owner ? models[owner] : null
  }

  /**
   * Transform database profile to frontend format
   * @param {Object} user - User object with all related data
   * @returns {Object} Transformed profile data
   */
  transformProfileData(user) {
    const userData = user.toJSON ? user.toJSON() : user
    const basicInfo = userData.basicInformation || {}
    const personalInfo = userData.personalInformation || {}
    const contactInfo = userData.contactInformation || {}
    const educationalInfo = userData.educationalInformation || {}
    const employmentInfo = userData.employmentInformation || {}
    const documents = userData.documents || []

    // Group documents by type
    const documentsByType = {}
    documents.forEach((doc) => {
      documentsByType[doc.documentType] = doc.fileUrl
    })

    return {
      basicInformation: {
        avatar: basicInfo.avatar || '',
        fullName: basicInfo.fullName || userData.name || '',
        aboutMe: basicInfo.aboutMe || '',
        gender: basicInfo.gender || '',
        dateOfBirth: basicInfo.dateOfBirth || null,
        bloodGroup: basicInfo.bloodGroup || '',
        // Contact fields are shown inside Basic Information in the UI.
        // They still live in contact_information; writes route by field name.
        mobileNo: contactInfo.mobileNo || '',
        officialMobileNo: contactInfo.officialMobileNo || '',
        personalEmailId: contactInfo.personalEmailId || '',
        address: contactInfo.address || '',
        cityTown: contactInfo.cityTown || '',
        pinCode: contactInfo.pinCode || '',
        state: contactInfo.state || '',
        country: contactInfo.country || '',
        permanentAddress: contactInfo.permanentAddress || '',
      },
      // Shown as its own section in the UI; still stored in contact_information
      emergencyContact: {
        emergencyContactPerson: contactInfo.emergencyContactPerson || '',
        relation: contactInfo.relation || '',
        emergencyContactMobileNo: contactInfo.emergencyContactMobileNo || '',
      },
      personalInformation: {
        fathersName: personalInfo.fathersName || '',
        mothersName: personalInfo.mothersName || '',
        spouseName: personalInfo.spouseName || '',
        placeOfBirth: personalInfo.placeOfBirth || '',
        maritalStatus: personalInfo.maritalStatus || '',
        dateOfMarriage: personalInfo.dateOfMarriage || null,
        passportNumber: personalInfo.passportNumber || '',
        aadhaarNumber: personalInfo.aadhaarNumber || '',
        panNumber: personalInfo.panNumber || '',
      },
      contactInformation: {
        mobileNo: contactInfo.mobileNo || '',
        officialMobileNo: contactInfo.officialMobileNo || '',
        personalEmailId: contactInfo.personalEmailId || '',
        address: contactInfo.address || '',
        cityTown: contactInfo.cityTown || '',
        pinCode: contactInfo.pinCode || '',
        state: contactInfo.state || '',
        country: contactInfo.country || '',
        permanentAddress: contactInfo.permanentAddress || '',
        emergencyContactPerson: contactInfo.emergencyContactPerson || '',
        relation: contactInfo.relation || '',
        emergencyContactMobileNo: contactInfo.emergencyContactMobileNo || '',
      },
      educationalInformation: {
        highestQualification: educationalInfo.highestQualification || '',
        qualificationName: educationalInfo.qualificationName || '',
        yearOfPassing: educationalInfo.yearOfPassing || null,
        certifications: educationalInfo.certifications || '',
      },
      employmentInformation: {
        dateOfJoining: employmentInfo.dateOfJoining || null,
        confirmationDate: employmentInfo.confirmationDate || null,
        employmentStatus: employmentInfo.employmentStatus || '',
        employeeCode: userData.employeeCode || '',
        noticePeriod: employmentInfo.noticePeriod || null,
        stateTax: employmentInfo.stateTax || '',
        compOffOvertime: employmentInfo.compOffOvertime || '',
        department: userData.department || '',
        workLocation: employmentInfo.workLocation || '',
        companyId: employmentInfo.companyId || null,
        company: employmentInfo.company?.companyName || '',
        lastWorkingDate: employmentInfo.lastWorkingDate || null,
      },
      documents: {
        panCard: documentsByType.panCard || '',
        aadhaarCard: documentsByType.aadhaarCard || '',
        cancelCheque: documentsByType.cancelCheque || '',
        photo: documentsByType.photo || '',
        passportPhotoPage: documentsByType.passportPhotoPage || '',
        passportAddressPage: documentsByType.passportAddressPage || '',
        passportBackSide: documentsByType.passportBackSide || '',
        latestMarksheet: documentsByType.latestMarksheet || '',
      },
    }
  }

  /**
   * Get field mapping from frontend names to database column names
   * @returns {Object} Field mapping
   */
  getFieldMapping() {
    return {
      // Basic Information
      avatar: 'avatar',
      fullName: 'fullName',
      aboutMe: 'aboutMe',
      gender: 'gender',
      dateOfBirth: 'dateOfBirth',
      bloodGroup: 'bloodGroup',
      // Personal Information
      fathersName: 'fathersName',
      mothersName: 'mothersName',
      spouseName: 'spouseName',
      placeOfBirth: 'placeOfBirth',
      maritalStatus: 'maritalStatus',
      dateOfMarriage: 'dateOfMarriage',
      passportNumber: 'passportNumber',
      aadhaarNumber: 'aadhaarNumber',
      panNumber: 'panNumber',
      // Contact Information
      mobileNo: 'mobileNo',
      officialMobileNo: 'officialMobileNo',
      personalEmailId: 'personalEmailId',
      address: 'address',
      cityTown: 'cityTown',
      pinCode: 'pinCode',
      state: 'state',
      country: 'country',
      permanentAddress: 'permanentAddress',
      emergencyContactPerson: 'emergencyContactPerson',
      relation: 'relation',
      emergencyContactMobileNo: 'emergencyContactMobileNo',
      // Educational Information
      highestQualification: 'highestQualification',
      qualificationName: 'qualificationName',
      yearOfPassing: 'yearOfPassing',
      certifications: 'certifications',
      // Employment Information
      dateOfJoining: 'dateOfJoining',
      confirmationDate: 'confirmationDate',
      employmentStatus: 'employmentStatus',
      noticePeriod: 'noticePeriod',
      stateTax: 'stateTax',
      compOffOvertime: 'compOffOvertime',
      workLocation: 'workLocation',
      companyId: 'companyId',
      lastWorkingDate: 'lastWorkingDate',
      // Documents (handled separately)
      panCard: 'panCard',
      aadhaarCard: 'aadhaarCard',
      cancelCheque: 'cancelCheque',
      photo: 'photo',
      passportPhotoPage: 'passportPhotoPage',
      passportAddressPage: 'passportAddressPage',
      passportBackSide: 'passportBackSide',
      latestMarksheet: 'latestMarksheet',
    }
  }
}

module.exports = new ProfileService()
