const {
  sequelize,
  User,
  ContactInformation,
  EmploymentInformation,
  Company,
  AttendanceRecord,
  AttendanceRequest,
  Leave,
  LeaveApproval,
  ExtraEarning,
  ReimbursementRequest,
  ReimbursementExpenseItem,
  DAR,
  ChatMessage,
  Payroll,
  Document,
  UserProfile,
  BasicInformation,
  PersonalInformation,
  EducationalInformation,
  UserOffice,
  SalaryStructure,
} = require('../models')
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors')
const logger = require('../utils/logger')
const { sendEmail } = require('../utils/emailSender')
const { sendCredentialsEmail, generatePassword } = require('../utils/credentialsEmail')
const { computeProfileCompletion } = require('../utils/profileCompletion')

/**
 * User Controller
 * Handles user management operations (Admin only)
 */
class UserController {
  /**
   * Get all users
   * GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      const { role, department, isActive, search, companyId, reportingManagerId } = req.query
      const currentUser = req.user // From authentication middleware

      const where = {}
      if (role) where.role = role
      if (department) where.department = department
      if (isActive !== undefined) where.isActive = isActive === 'true'

      // Reached this route purely by having direct reports, so the staff-wide
      // list is not theirs to read — pin it to their own team whatever the query
      // string asked for.
      if (req.viaReportingPerson) {
        where.reportingManagerId = currentUser.id
      } else if (reportingManagerId) {
        if (reportingManagerId === 'me') {
          where.reportingManagerId = currentUser.id
        } else {
          const managerId = parseInt(reportingManagerId, 10)
          if (!Number.isInteger(managerId)) {
            throw new BadRequestError('Invalid reporting manager')
          }
          where.reportingManagerId = managerId
        }
      }

      // Filter by company if provided or if user is not admin
      if (companyId) {
        where.companyId = parseInt(companyId)
      } else if (currentUser.role !== 'ADMIN' && currentUser.role !== 'HEAD_HR' && currentUser.role !== 'HR') {
        // Managers and employees can only see users from their company
        if (currentUser.companyId) {
          where.companyId = currentUser.companyId
        }
      }

      const options = {
        where,
        attributes: { exclude: ['password'] },
        include: [
          // The profile sections below feed the profile-completion score. Only
          // the scored columns are selected so the list payload stays small.
          {
            model: ContactInformation,
            as: 'contactInformation',
            required: false,
            attributes: [
              'mobileNo',
              'officialMobileNo',
              'personalEmailId',
              'address',
              'cityTown',
              'pinCode',
              'state',
              'emergencyContactPerson',
              'emergencyContactMobileNo',
            ],
          },
          {
            model: EmploymentInformation,
            as: 'employmentInformation',
            required: false,
            attributes: ['dateOfJoining', 'employmentStatus', 'workLocation', 'noticePeriod'],
          },
          {
            model: BasicInformation,
            as: 'basicInformation',
            required: false,
            attributes: ['avatar', 'gender', 'dateOfBirth', 'bloodGroup'],
          },
          {
            model: PersonalInformation,
            as: 'personalInformation',
            required: false,
            attributes: [
              'fathersName',
              'mothersName',
              'placeOfBirth',
              'maritalStatus',
              'aadhaarNumber',
              'panNumber',
            ],
          },
          {
            model: EducationalInformation,
            as: 'educationalInformation',
            required: false,
            attributes: ['highestQualification', 'qualificationName', 'yearOfPassing'],
          },
          {
            model: Company,
            as: 'company',
            required: false,
            attributes: ['id', 'companyName'],
          },
          { model: User, as: 'reportingManager', required: false, attributes: ['id', 'name'] },
        ],
        order: [['created_at', 'DESC']],
      }

      // Add search filter
      if (search) {
        const { Op } = require('sequelize')
        options.where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { employeeCode: { [Op.like]: `%${search}%` } },
        ]
      }

      const users = await User.findAll(options)

      // Document counts come from one grouped query rather than a hasMany
      // include, which would multiply the joined profile rows per document.
      const docCounts = new Map()
      if (users.length > 0) {
        const counts = await Document.findAll({
          attributes: ['userId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
          where: { userId: users.map((u) => u.id) },
          group: ['userId'],
          raw: true,
        })
        counts.forEach((row) => docCounts.set(Number(row.userId), Number(row.total)))
      }

      // Attach the completion summary. The scored sections are dropped from the
      // payload afterwards — only contact/employment are consumed by the UI.
      const data = users.map((user) => {
        const plain = user.get({ plain: true })
        plain.documentCount = docCounts.get(plain.id) || 0
        const profileCompletion = computeProfileCompletion(plain)

        delete plain.basicInformation
        delete plain.personalInformation
        delete plain.educationalInformation

        return { ...plain, profileCompletion }
      })

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data,
        count: data.length,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [{ model: User, as: 'reportingManager', required: false, attributes: ['id', 'name'] }],
      })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create new user
   * POST /api/users
   */
  async createUser(req, res, next) {
    try {
      const { email, companyEmail, password, name, employeeCode, role, department, designation, isActive, companyId, joinDate, reportingManagerId, punchInLatitude, punchInLongitude, punchInRadius, devicePin } = req.body

      // Validate required fields
      if (!email || !password || !name) {
        throw new BadRequestError('Email, password, and name are required')
      }

      // Normalize biometric device PIN (eSSL/ZKTeco terminal User ID)
      const normalizedDevicePin =
        devicePin === '' || devicePin === null || devicePin === undefined ? null : String(devicePin).trim()
      if (normalizedDevicePin) {
        const pinTaken = await User.findOne({ where: { devicePin: normalizedDevicePin } })
        if (pinTaken) {
          throw new BadRequestError(`Device PIN ${normalizedDevicePin} is already assigned to another employee`)
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new BadRequestError('Invalid email format')
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } })
      if (existingUser) {
        throw new BadRequestError('User with this email already exists')
      }

      // Company assignment for the new employee.
      const effectiveCompanyId =
        companyId !== undefined && companyId !== null && companyId !== ''
          ? parseInt(companyId, 10)
          : req.user?.companyId || null

      // Employee code is entered MANUALLY — required and must be unique.
      const finalEmployeeCode = employeeCode ? String(employeeCode).trim() : ''
      if (!finalEmployeeCode) {
        throw new BadRequestError('Employee code is required')
      }
      const existingCode = await User.findOne({ where: { employeeCode: finalEmployeeCode } })
      if (existingCode) {
        throw new BadRequestError(`Employee code "${finalEmployeeCode}" already exists`)
      }

      // Create user
      const userData = {
        email,
        companyEmail: companyEmail && companyEmail.trim() ? companyEmail.trim() : null,
        password, // Will be hashed by model hook
        name,
        employeeCode: finalEmployeeCode,
        companyId: effectiveCompanyId,
        role: role || 'EMPLOYEE',
        department: department || null,
        designation: designation || null,
        isActive: isActive !== undefined ? isActive : true,
        reportingManagerId: reportingManagerId === '' || reportingManagerId === null || reportingManagerId === undefined
          ? null
          : parseInt(reportingManagerId, 10),
        punchInLatitude: punchInLatitude === '' || punchInLatitude === null || punchInLatitude === undefined
          ? null
          : parseFloat(punchInLatitude),
        punchInLongitude: punchInLongitude === '' || punchInLongitude === null || punchInLongitude === undefined
          ? null
          : parseFloat(punchInLongitude),
        punchInRadius: punchInRadius === '' || punchInRadius === null || punchInRadius === undefined
          ? 100
          : parseInt(punchInRadius, 10),
        devicePin: normalizedDevicePin,
      }

      const user = await User.create(userData)

      // Persist joining date (stored on employment_information)
      if (joinDate) {
        try {
          await EmploymentInformation.create({ userId: user.id, dateOfJoining: joinDate })
        } catch (e) {
          logger.warn(`Could not set joining date for user ${user.id}: ${e.message}`)
        }
      }

      logger.info('User created', { userId: user.id, email: user.email, createdBy: req.user.id })

      // Email the login credentials to the new employee. Best-effort: a mail
      // failure must NOT fail user creation, so it is caught and reported via a
      // flag rather than thrown. `password` is the plaintext entered on the form
      // (the stored copy is hashed by the model hook).
      let emailSent = false
      try {
        const result = await sendCredentialsEmail({ user, password })
        emailSent = result.sent
        logger.info('Welcome email dispatched', { userId: user.id, to: user.email, emailSent })
      } catch (e) {
        logger.warn(`Could not send welcome email to ${user.email}: ${e.message}`)
      }

      // Return user without password
      const userResponse = user.toJSON()
      delete userResponse.password

      res.status(201).json({
        success: true,
        message: emailSent
          ? 'User created successfully. Login credentials emailed to the employee.'
          : 'User created successfully. (Could not send the credentials email — check SMTP settings.)',
        emailSent,
        data: userResponse,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params
      const { email, companyEmail, password, name, employeeCode, role, department, designation, isActive, companyId, phone, joinDate, monthlySalary, pfEnabled, monthlyTds, reportingManagerId, punchInLatitude, punchInLongitude, punchInRadius, devicePin } = req.body

      const user = await User.findByPk(id, {
        include: [
          {
            model: ContactInformation,
            as: 'contactInformation',
            required: false,
          },
          {
            model: EmploymentInformation,
            as: 'employmentInformation',
            required: false,
          },
        ],
      })
      if (!user) {
        throw new NotFoundError('User not found')
      }

      // Check if email is being changed and already exists
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } })
        if (existingUser) {
          throw new BadRequestError('User with this email already exists')
        }
      }

      // Employee code cannot be changed after creation (auto-generated)
      // If provided, ignore it to prevent changes
      // Comment: Employee codes are auto-generated and should not be modified

      // Update user
      const updateData = {}
      if (email) updateData.email = email
      if (companyEmail !== undefined) {
        // Blank clears it (falls back to personal email for notices)
        updateData.companyEmail = companyEmail && companyEmail.trim() ? companyEmail.trim() : null
      }
      if (password) updateData.password = password // Will be hashed by model hook
      if (name) updateData.name = name
      // Employee code is auto-generated and cannot be changed
      if (role) updateData.role = role
      if (department !== undefined) updateData.department = department
      if (designation !== undefined) updateData.designation = designation
      if (isActive !== undefined) updateData.isActive = isActive
      if (companyId !== undefined) updateData.companyId = companyId
      if (monthlySalary !== undefined && monthlySalary !== null) {
        // Allow setting monthly salary to 0 or positive number
        updateData.monthlySalary = parseFloat(monthlySalary)
      }
      // Drives the with-PF vs without-PF salary structure
      // (see utils/salaryStructure.js)
      if (pfEnabled !== undefined) {
        updateData.pfEnabled = pfEnabled === true || pfEnabled === 'true' || pfEnabled === 1
      }
      // Manual monthly TDS deducted from take-home. Negative values are clamped
      // to 0 — TDS can only ever reduce the payout.
      if (monthlyTds !== undefined && monthlyTds !== null) {
        const parsedTds = parseFloat(monthlyTds)
        updateData.monthlyTds = Number.isFinite(parsedTds) && parsedTds > 0 ? parsedTds : 0
      }
      if (reportingManagerId !== undefined) {
        updateData.reportingManagerId = reportingManagerId === '' || reportingManagerId === null ? null : parseInt(reportingManagerId, 10)
      }
      if (punchInLatitude !== undefined) {
        updateData.punchInLatitude = punchInLatitude === '' || punchInLatitude === null ? null : parseFloat(punchInLatitude)
      }
      if (punchInLongitude !== undefined) {
        updateData.punchInLongitude = punchInLongitude === '' || punchInLongitude === null ? null : parseFloat(punchInLongitude)
      }
      if (punchInRadius !== undefined) {
        updateData.punchInRadius = punchInRadius === '' || punchInRadius === null ? null : parseInt(punchInRadius, 10)
      }
      if (devicePin !== undefined) {
        const normalizedDevicePin =
          devicePin === '' || devicePin === null ? null : String(devicePin).trim()
        // Prevent assigning a PIN already used by a different employee
        if (normalizedDevicePin) {
          const pinTaken = await User.findOne({ where: { devicePin: normalizedDevicePin } })
          if (pinTaken && String(pinTaken.id) !== String(id)) {
            throw new BadRequestError(`Device PIN ${normalizedDevicePin} is already assigned to another employee`)
          }
        }
        updateData.devicePin = normalizedDevicePin
      }

      await user.update(updateData)

      // Update ContactInformation (phone)
      if (phone !== undefined) {
        if (user.contactInformation) {
          await user.contactInformation.update({ mobileNo: phone })
        } else {
          await ContactInformation.create({
            userId: user.id,
            mobileNo: phone,
          })
        }
      }

      // Update EmploymentInformation (joinDate)
      if (joinDate !== undefined && joinDate !== null) {
        if (user.employmentInformation) {
          await user.employmentInformation.update({ dateOfJoining: joinDate })
        } else {
          await EmploymentInformation.create({
            userId: user.id,
            dateOfJoining: joinDate,
          })
        }
      }

      logger.info('User updated', { userId: user.id, updatedBy: req.user.id })

      // Reload user with all associations
      await user.reload({
        include: [
          {
            model: ContactInformation,
            as: 'contactInformation',
            required: false,
            attributes: ['mobileNo', 'officialMobileNo'],
          },
          {
            model: EmploymentInformation,
            as: 'employmentInformation',
            required: false,
            attributes: ['dateOfJoining'],
          },
          {
            model: Company,
            as: 'company',
            required: false,
            attributes: ['id', 'companyName'],
          },
        ],
      })

      // Return user without password
      const userResponse = user.toJSON()
      delete userResponse.password

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: userResponse,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete user (soft delete - set isActive to false)
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params

      const user = await User.findByPk(id)
      if (!user) {
        throw new NotFoundError('User not found')
      }

      // Soft delete - set isActive to false
      await user.update({ isActive: false })

      logger.info('User deactivated', { userId: user.id, deactivatedBy: req.user.id })

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Re-send an employee's login credentials by email.
   * POST /api/users/:id/send-credentials
   *
   * Stored passwords are hashed, so the original plaintext cannot be recovered.
   * A new password is therefore generated (or taken from the optional
   * `password` in the body), saved, and mailed out. The password is echoed back
   * in the response ONLY when the mail could not be sent, so the admin can pass
   * it on manually instead of leaving the employee locked out.
   */
  async sendCredentials(req, res, next) {
    try {
      const { id } = req.params
      const { password: customPassword } = req.body || {}

      const user = await User.findByPk(id)
      if (!user) {
        throw new NotFoundError('User not found')
      }
      if (!user.email) {
        throw new BadRequestError('This employee has no email address on file')
      }

      const newPassword = customPassword && String(customPassword).trim()
        ? String(customPassword).trim()
        : generatePassword()

      if (newPassword.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters')
      }

      // Hashed by the model's beforeUpdate hook
      user.password = newPassword
      await user.save()

      let emailSent = false
      try {
        const result = await sendCredentialsEmail({ user, password: newPassword, isReissue: true })
        emailSent = result.sent
      } catch (e) {
        logger.warn(`Could not re-send credentials to ${user.email}: ${e.message}`)
      }

      logger.info('Credentials re-sent', {
        userId: user.id,
        to: user.email,
        emailSent,
        by: req.user?.id,
      })

      res.json({
        success: true,
        message: emailSent
          ? `Login credentials emailed to ${user.email}`
          : 'Password was reset, but the email could not be sent — check SMTP settings.',
        emailSent,
        // Only exposed on failure so the admin can hand over the new password
        ...(emailSent ? {} : { password: newPassword }),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Permanently delete an employee and ALL related records.
   * DELETE /api/users/:id/permanent
   *
   * Restricted to System Admin (ADMIN) only — enforced again here in addition
   * to the route-level guard, because this is an irreversible cascade wipe.
   * Removes the employee together with every dependent row (attendance, leaves,
   * payroll, profile sections, documents, reimbursements, DARs, chat, offices)
   * inside a single transaction, and nulls out references where the employee
   * acted on OTHER people's records (as reporting manager / approver / creator)
   * so those records survive.
   */
  async permanentlyDeleteUser(req, res, next) {
    const t = await sequelize.transaction()
    try {
      // Belt-and-suspenders: only System Admin may permanently delete.
      if (!req.user || String(req.user.role).toUpperCase() !== 'ADMIN') {
        await t.rollback()
        return next(
          new ForbiddenError('Only a System Admin can permanently delete an employee')
        )
      }

      const { id } = req.params
      const targetId = parseInt(id, 10)

      if (!targetId || Number.isNaN(targetId)) {
        await t.rollback()
        throw new BadRequestError('Invalid employee id')
      }

      // An admin cannot permanently delete their own account.
      if (targetId === req.user.id) {
        await t.rollback()
        throw new BadRequestError('You cannot permanently delete your own account')
      }

      const user = await User.findByPk(targetId, { transaction: t })
      if (!user) {
        await t.rollback()
        throw new NotFoundError('Employee not found')
      }

      // Refuse to remove the last remaining System Admin so the tenant is never
      // left with no admin able to log in.
      if (String(user.role).toUpperCase() === 'ADMIN') {
        const adminCount = await User.count({ where: { role: 'ADMIN' }, transaction: t })
        if (adminCount <= 1) {
          await t.rollback()
          throw new BadRequestError('Cannot delete the last remaining System Admin')
        }
      }

      // Not every model in code has a materialized table in this database
      // (e.g. chat_messages may not be synced). Resolve which tables actually
      // exist so we can skip the missing ones instead of crashing the cascade.
      const rawTables = await sequelize.getQueryInterface().showAllTables()
      const existingTables = new Set(
        rawTables.map((tbl) =>
          String(typeof tbl === 'string' ? tbl : tbl.tableName || tbl).toLowerCase()
        )
      )
      const modelTable = (model) => {
        const tn = model.getTableName()
        return String(typeof tn === 'string' ? tn : tn.tableName).toLowerCase()
      }
      const exists = (model) => existingTables.has(modelTable(model))
      const safeDestroy = async (model, where) => {
        if (exists(model)) await model.destroy({ where, transaction: t })
      }
      const safeUpdate = async (model, values, where) => {
        if (exists(model)) await model.update(values, { where, transaction: t })
      }

      // 1) Null-out references where this employee acted on OTHERS' / shared
      //    records, so those records are preserved rather than deleted.
      await safeUpdate(User, { reportingManagerId: null }, { reportingManagerId: targetId })
      await safeUpdate(Leave, { reportingManagerId: null }, { reportingManagerId: targetId })
      await safeUpdate(
        AttendanceRequest,
        { reportingManagerId: null },
        { reportingManagerId: targetId }
      )
      // LeaveApproval.approvedBy is NOT NULL, so approval actions this user
      // performed (on any employee's leave) are removed rather than nulled.
      await safeDestroy(LeaveApproval, { approvedBy: targetId })
      await safeUpdate(DAR, { approvedBy: null }, { approvedBy: targetId })
      await safeUpdate(DAR, { rejectedBy: null }, { rejectedBy: targetId })
      await safeUpdate(ReimbursementRequest, { approvedBy: null }, { approvedBy: targetId })
      await safeUpdate(SalaryStructure, { createdBy: null }, { createdBy: targetId })
      await safeUpdate(SalaryStructure, { modifiedBy: null }, { modifiedBy: targetId })

      // 2) Delete this employee's OWN dependent records, children first.
      //    Leave approvals reference the employee's leaves, so remove them first.
      if (exists(Leave)) {
        const ownLeaves = await Leave.findAll({
          where: { userId: targetId },
          attributes: ['id'],
          transaction: t,
        })
        const ownLeaveIds = ownLeaves.map((l) => l.id)
        if (ownLeaveIds.length > 0) {
          await safeDestroy(LeaveApproval, { leaveId: ownLeaveIds })
        }
      }
      await safeDestroy(Leave, { userId: targetId })

      await safeDestroy(AttendanceRequest, { userId: targetId })
      await safeDestroy(AttendanceRecord, { userId: targetId })
      await safeDestroy(ExtraEarning, { userId: targetId })
      // Remove reimbursement expense items (children) before their requests, in
      // case the DB FK was not created with ON DELETE CASCADE.
      if (exists(ReimbursementRequest)) {
        const ownReimbursements = await ReimbursementRequest.findAll({
          where: { userId: targetId },
          attributes: ['id'],
          transaction: t,
        })
        const ownReimbursementIds = ownReimbursements.map((r) => r.id)
        if (ownReimbursementIds.length > 0) {
          await safeDestroy(ReimbursementExpenseItem, {
            reimbursementRequestId: ownReimbursementIds,
          })
        }
      }
      await safeDestroy(ReimbursementRequest, { userId: targetId })
      await safeDestroy(DAR, { userId: targetId })
      await safeDestroy(ChatMessage, { userId: targetId })
      await safeDestroy(Payroll, { userId: targetId })
      await safeDestroy(Document, { userId: targetId })
      await safeDestroy(UserProfile, { userId: targetId })
      await safeDestroy(BasicInformation, { userId: targetId })
      await safeDestroy(PersonalInformation, { userId: targetId })
      await safeDestroy(ContactInformation, { userId: targetId })
      await safeDestroy(EducationalInformation, { userId: targetId })
      await safeDestroy(EmploymentInformation, { userId: targetId })
      await safeDestroy(UserOffice, { userId: targetId })

      // 3) Finally remove the employee record itself.
      await user.destroy({ transaction: t })

      await t.commit()

      logger.warn('Employee permanently deleted', {
        deletedUserId: targetId,
        deletedBy: req.user.id,
      })

      res.status(200).json({
        success: true,
        message: 'Employee permanently deleted',
      })
    } catch (error) {
      if (t && !t.finished) {
        await t.rollback()
      }
      next(error)
    }
  }
}

module.exports = new UserController()
