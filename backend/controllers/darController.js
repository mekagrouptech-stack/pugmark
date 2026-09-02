const { DAR, User, DarProject, DarClient } = require('../models')
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors')
const { Op, fn, col } = require('sequelize')
const logger = require('../utils/logger')

/**
 * DAR Controller
 * Handles Daily Activity Report operations
 */
class DARController {
  /**
   * Get my DARs (for employee)
   * GET /api/dar/my
   */
  async getMyDARs(req, res, next) {
    try {
      const userId = req.user.id
      const { page = 1, limit = 20, status, startDate, endDate, search } = req.query

      const whereClause = { userId }
      
      if (status && status !== 'ALL') {
        whereClause.status = status
      }
      
      if (startDate || endDate) {
        whereClause.date = {}
        if (startDate) {
          whereClause.date[Op.gte] = startDate
        }
        if (endDate) {
          whereClause.date[Op.lte] = endDate
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit)

      const { count, rows } = await DAR.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode', 'department', 'designation'],
          },
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      })

      // Filter by search query if provided
      let filteredRows = rows
      if (search) {
        const searchLower = search.toLowerCase()
        filteredRows = rows.filter((dar) => {
          return (
            dar.activityDescription?.toLowerCase().includes(searchLower) ||
            dar.projectName?.toLowerCase().includes(searchLower) ||
            dar.workLocation?.toLowerCase().includes(searchLower) ||
            dar.user?.name?.toLowerCase().includes(searchLower)
          )
        })
      }

      const formattedDARs = filteredRows.map((dar) => formatDarForCreateOrUpdate(dar))

      res.status(200).json({
        success: true,
        message: 'DARs retrieved successfully',
        data: formattedDARs,
        total: search ? filteredRows.length : count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((search ? filteredRows.length : count) / parseInt(limit)),
      })
    } catch (error) {
      logger.error('Error in getMyDARs:', error)
      next(error)
    }
  }

  /**
   * Create DAR for current user
   * POST /api/dar/my or POST /api/dar
   */
  async createMyDAR(req, res, next) {
    try {
      const userId = req.user?.id
      if (!userId) {
        throw new BadRequestError('User not authenticated')
      }

      const {
        date,
        project,
        activities = [],
        remarks,
        totalHours,
        status,
      } = req.body

      if (!date) throw new BadRequestError('Date is required')

      // Normalize date to YYYY-MM-DD
      const dateStr = typeof date === 'string' ? date.split('T')[0] : (date && date.toISOString ? date.toISOString().split('T')[0] : null)
      if (!dateStr) throw new BadRequestError('Invalid date format')

      // Basic summary fields from activities
      let activityDescription = ''
      let taskCategory = 'OTHER'
      let startTime = null
      let endTime = null
      let total = Number(totalHours) || 0

      if (Array.isArray(activities) && activities.length > 0) {
        activityDescription = activities
          .map((a) => `${a.taskTitle || 'Task'}: ${a.description || ''}`)
          .join('\n')

        // Map frontend category to backend enum (fallback to OTHER)
        const cat = (activities[0].category || '').toUpperCase()
        const allowedCats = ['EXECUTION', 'PLANNING', 'MEETING', 'INSPECTION', 'DOCUMENTATION', 'OTHER']
        taskCategory = allowedCats.includes(cat) ? cat : 'OTHER'

        const starts = activities
          .map((a) => (a.startTime && typeof a.startTime === 'string' ? a.startTime : null))
          .filter(Boolean)
        const ends = activities
          .map((a) => (a.endTime && typeof a.endTime === 'string' ? a.endTime : null))
          .filter(Boolean)
        if (starts.length) startTime = starts.sort()[0]
        if (ends.length) endTime = ends.sort()[ends.length - 1]

        if (!total) {
          total = activities.reduce((sum, a) => sum + (Number(a.hoursSpent) || 0), 0)
        }
      }

      if (!activityDescription) {
        activityDescription = remarks || 'Daily activities'
      }

      const dbStatus = (status || 'Draft').toUpperCase()
      const allowedStatus = ['DRAFT', 'SUBMITTED']
      const finalStatus = allowedStatus.includes(dbStatus) ? dbStatus : 'DRAFT'

      // Ensure TIME format is HH:mm or HH:mm:ss for MySQL
      const normalizeTime = (t) => {
        if (!t) return '09:00:00'
        const s = String(t).trim()
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 5 ? `${s}:00` : s
        return '09:00:00'
      }

      const dar = await DAR.create({
        userId: Number(userId),
        date: dateStr,
        projectName: project || null,
        workLocation: null,
        workLocationLatitude: null,
        workLocationLongitude: null,
        activityDescription,
        taskCategory,
        startTime: normalizeTime(startTime || '09:00'),
        endTime: normalizeTime(endTime || '18:00'),
        totalHours: total || 0,
        remarks: remarks || null,
        issuesFaced: null,
        status: finalStatus,
        submittedAt: finalStatus === 'SUBMITTED' ? new Date() : null,
      })

      const formatted = formatDarForCreateOrUpdate(dar)

      logger.info('DAR created successfully', { darId: dar.id, userId, date: dateStr })

      res.status(201).json({
        success: true,
        message: 'DAR created successfully',
        data: formatted,
      })
    } catch (error) {
      logger.error('Error in createMyDAR:', error)
      next(error)
    }
  }

  /**
   * Get DAR by ID (current user or admin/manager)
   * GET /api/dar/:id
   */
  async getDarById(req, res, next) {
    try {
      const { id } = req.params
      const currentUser = req.user

      const dar = await DAR.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode', 'department', 'designation', 'reportingManagerId'],
          },
        ],
      })

      if (!dar) throw new NotFoundError('DAR not found')

      const user = dar.user
      // Ensure we compare IDs as numbers to avoid string/number mismatch
      const isOwner = Number(dar.userId) === Number(currentUser.id)
      const isManager =
        user && user.reportingManagerId && user.reportingManagerId === currentUser.id
      const isAdminLike = ['ADMIN', 'HR', 'HEAD_HR', 'HOD'].includes(currentUser.role)

      if (!isOwner && !isManager && !isAdminLike) {
        throw new ForbiddenError('You are not allowed to view this DAR')
      }

      const formatted = formatDarForCreateOrUpdate(dar)

      res.status(200).json({
        success: true,
        message: 'DAR retrieved successfully',
        data: formatted,
      })
    } catch (error) {
      logger.error('Error in getDarById:', error)
      next(error)
    }
  }

  /**
   * Update DAR (current user)
   * PUT /api/dar/:id
   */
  async updateMyDAR(req, res, next) {
    try {
      const { id } = req.params
      const currentUser = req.user
      const {
        date,
        project,
        activities = [],
        remarks,
        totalHours,
        status,
      } = req.body

      const dar = await DAR.findByPk(id)
      if (!dar) throw new NotFoundError('DAR not found')
      if (dar.userId !== currentUser.id) {
        throw new ForbiddenError('You can only update your own DAR')
      }
      if (dar.status !== 'DRAFT' && dar.status !== 'REJECTED') {
        throw new BadRequestError('Only DRAFT or REJECTED DARs can be updated')
      }

      let activityDescription = dar.activityDescription
      let taskCategory = dar.taskCategory
      let startTime = dar.startTime
      let endTime = dar.endTime
      let total = totalHours != null ? Number(totalHours) : Number(dar.totalHours) || 0

      if (Array.isArray(activities) && activities.length > 0) {
        activityDescription = activities
          .map((a) => `${a.taskTitle || 'Task'}: ${a.description || ''}`)
          .join('\n')

        const cat = (activities[0].category || '').toUpperCase()
        const allowedCats = ['EXECUTION', 'PLANNING', 'MEETING', 'INSPECTION', 'DOCUMENTATION', 'OTHER']
        taskCategory = allowedCats.includes(cat) ? cat : 'OTHER'

        const starts = activities
          .map((a) => a.startTime)
          .filter(Boolean)
        const ends = activities
          .map((a) => a.endTime)
          .filter(Boolean)
        if (starts.length) startTime = starts.sort()[0]
        if (ends.length) endTime = ends.sort()[ends.length - 1]

        total = activities.reduce((sum, a) => sum + (Number(a.hoursSpent) || 0), 0)
      }

      const dbStatus = (status || dar.status || 'DRAFT').toUpperCase()
      const allowedStatus = ['DRAFT', 'SUBMITTED', 'REJECTED']
      const finalStatus = allowedStatus.includes(dbStatus) ? dbStatus : dar.status

      await dar.update({
        date: date || dar.date,
        projectName: project || dar.projectName,
        activityDescription,
        taskCategory,
        startTime,
        endTime,
        totalHours: total,
        remarks: remarks != null ? remarks : dar.remarks,
        status: finalStatus,
        submittedAt: finalStatus === 'SUBMITTED' ? new Date() : dar.submittedAt,
      })

      const formatted = formatDarForCreateOrUpdate(dar)

      res.status(200).json({
        success: true,
        message: 'DAR updated successfully',
        data: formatted,
      })
    } catch (error) {
      logger.error('Error in updateMyDAR:', error)
      next(error)
    }
  }

  /**
   * Submit DAR (current user)
   * POST /api/dar/:id/submit
   */
  async submitMyDAR(req, res, next) {
    try {
      const { id } = req.params
      const currentUser = req.user

      const dar = await DAR.findByPk(id)
      if (!dar) throw new NotFoundError('DAR not found')
      if (Number(dar.userId) !== Number(currentUser.id)) {
        throw new ForbiddenError('You can only submit your own DAR')
      }
      const status = String(dar.status || '').toUpperCase()
      if (status !== 'DRAFT' && status !== 'REJECTED') {
        throw new BadRequestError(
          `Only DRAFT or REJECTED DARs can be submitted. Current status: ${status || 'unknown'}`
        )
      }

      await dar.update({
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })

      // Notify reporting person and admins that DAR was submitted
      try {
        const user = await User.findByPk(dar.userId, {
          attributes: ['id', 'name', 'employeeCode', 'reportingManagerId'],
        })
        const io = req.app.get('io')
        if (io && user) {
          const payload = {
            type: 'dar_submitted',
            darId: dar.id,
            employeeName: user.name || currentUser.name,
            employeeCode: user.employeeCode || null,
            date: dar.date,
            projectName: dar.projectName || null,
            totalHours: dar.totalHours ? Number(dar.totalHours) : 0,
            status: dar.status,
            timestamp: new Date().toISOString(),
          }

          // Notify all admins
          io.to('admin_notifications').emit('dar_submitted', payload)

          // Notify reporting manager, if any
          if (user.reportingManagerId) {
            io.to('user_' + user.reportingManagerId).emit('dar_submitted', payload)
          }
        }
      } catch (notifyErr) {
        logger.error('Error emitting dar_submitted notification:', notifyErr)
      }

      const formatted = formatDarForCreateOrUpdate(dar)

      res.status(200).json({
        success: true,
        message: 'DAR submitted successfully',
        data: formatted,
      })
    } catch (error) {
      logger.error('Error in submitMyDAR:', error)
      next(error)
    }
  }

  /**
   * Approve DAR (responsible person: reporting manager, HR, Admin)
   * POST /api/dar/:id/approve
   */
  async approveDar(req, res, next) {
    try {
      const { id } = req.params
      const currentUser = req.user
      const { comments } = req.body || {}

      const dar = await DAR.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode', 'reportingManagerId'],
          },
        ],
      })
      if (!dar) throw new NotFoundError('DAR not found')

      const status = String(dar.status || '').toUpperCase()
      if (status !== 'SUBMITTED') {
        throw new BadRequestError(`Only SUBMITTED DARs can be approved. Current status: ${status || 'unknown'}`)
      }

      const user = dar.user
      const isManager = user?.reportingManagerId && Number(user.reportingManagerId) === Number(currentUser.id)
      const isAdminLike = ['ADMIN', 'HR', 'HEAD_HR', 'HOD'].includes(currentUser.role)

      if (!isManager && !isAdminLike) {
        throw new ForbiddenError('Only the responsible person (reporting manager) or HR/Admin can approve this DAR')
      }

      await dar.update({
        status: 'APPROVED',
        approvedBy: currentUser.id,
        approvedAt: new Date(),
        managerComments: comments?.trim() || null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      })

      const formatted = formatDarForCreateOrUpdate(dar)
      logger.info('DAR approved', { darId: dar.id, approvedBy: currentUser.id })

      res.status(200).json({
        success: true,
        message: 'DAR approved successfully',
        data: formatted,
      })
    } catch (error) {
      logger.error('Error in approveDar:', error)
      next(error)
    }
  }

  /**
   * Reject DAR (responsible person: reporting manager, HR, Admin)
   * POST /api/dar/:id/reject
   */
  async rejectDar(req, res, next) {
    try {
      const { id } = req.params
      const currentUser = req.user
      const { reason, comments } = req.body || {}

      const dar = await DAR.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode', 'reportingManagerId'],
          },
        ],
      })
      if (!dar) throw new NotFoundError('DAR not found')

      const status = String(dar.status || '').toUpperCase()
      if (status !== 'SUBMITTED') {
        throw new BadRequestError(`Only SUBMITTED DARs can be rejected. Current status: ${status || 'unknown'}`)
      }

      const user = dar.user
      const isManager = user?.reportingManagerId && Number(user.reportingManagerId) === Number(currentUser.id)
      const isAdminLike = ['ADMIN', 'HR', 'HEAD_HR', 'HOD'].includes(currentUser.role)

      if (!isManager && !isAdminLike) {
        throw new ForbiddenError('Only the responsible person (reporting manager) or HR/Admin can reject this DAR')
      }

      await dar.update({
        status: 'REJECTED',
        rejectedBy: currentUser.id,
        rejectedAt: new Date(),
        rejectionReason: reason?.trim() || comments?.trim() || 'Rejected by approver',
        managerComments: comments?.trim() || null,
        approvedBy: null,
        approvedAt: null,
      })

      const formatted = formatDarForCreateOrUpdate(dar)
      logger.info('DAR rejected', { darId: dar.id, rejectedBy: currentUser.id })

      res.status(200).json({
        success: true,
        message: 'DAR rejected successfully',
        data: formatted,
      })
    } catch (error) {
      logger.error('Error in rejectDar:', error)
      next(error)
    }
  }

  /**
   * Get DAR stats for current user (dashboard)
   * GET /api/dar/my/stats
   * Query: dateFrom, dateTo, project (optional project name filter)
   */
  async getMyStats(req, res, next) {
    try {
      const userId = req.user.id
      const { dateFrom, dateTo, project } = req.query

      const whereClause = { userId }
      if (project && project.trim()) {
        whereClause.projectName = project.trim()
      }

      const startDate = dateFrom || new Date().toISOString().slice(0, 10)
      const endDate = dateTo || startDate
      whereClause.date = { [Op.gte]: startDate, [Op.lte]: endDate }

      const rows = await DAR.findAll({
        where: whereClause,
        attributes: ['date', 'totalHours', 'status'],
      })

      const todayStr = new Date().toISOString().slice(0, 10)
      const today = new Date(todayStr)
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekStartStr = weekStart.toISOString().slice(0, 10)
      const weekEndStr = weekEnd.toISOString().slice(0, 10)

      let todayHours = 0
      let weekHours = 0
      let monthHours = 0
      const counts = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0 }

      rows.forEach((row) => {
        const plain = row.get ? row.get({ plain: true }) : row
        const hrs = Number(plain.totalHours || 0)
        const d = plain.date

        monthHours += hrs
        if (d === todayStr) todayHours += hrs
        if (d >= weekStartStr && d <= weekEndStr) weekHours += hrs

        const st = (plain.status || 'DRAFT').toUpperCase()
        if (counts[st] !== undefined) counts[st] += 1
      })

      res.status(200).json({
        success: true,
        message: 'Stats retrieved successfully',
        data: {
          todayHours: Math.round(todayHours * 100) / 100,
          weekHours: Math.round(weekHours * 100) / 100,
          monthHours: Math.round(monthHours * 100) / 100,
          submittedCount: counts.SUBMITTED,
          approvedCount: counts.APPROVED,
          draftCount: counts.DRAFT,
          rejectedCount: counts.REJECTED,
        },
      })
    } catch (error) {
      logger.error('Error in getMyStats:', error)
      next(error)
    }
  }

  /**
   * Get DAR stats for a specific user (manager/HR/admin view)
   * GET /api/dar/user/:userId/stats
   * Query: dateFrom, dateTo, project
   * Allowed: own userId, or manager viewing team member, or HR/HEAD_HR/ADMIN/HOD
   */
  async getUserStats(req, res, next) {
    try {
      const currentUser = req.user
      const targetUserId = parseInt(req.params.userId, 10)
      const { dateFrom, dateTo, project } = req.query

      if (isNaN(targetUserId)) {
        throw new BadRequestError('Invalid user ID')
      }

      const isOwn = Number(currentUser.id) === targetUserId
      const isManager =
        currentUser.role === 'MANAGER' || currentUser.role === 'HOD'
      const isAdminLike = ['ADMIN', 'HR', 'HEAD_HR', 'HOD'].includes(currentUser.role)

      let canView = isOwn
      if (!canView && isManager) {
        const targetUser = await User.findByPk(targetUserId, {
          attributes: ['id', 'reportingManagerId'],
        })
        if (!targetUser) throw new NotFoundError('User not found')
        canView = Number(targetUser.reportingManagerId) === Number(currentUser.id)
      } else if (!canView && isAdminLike) {
        canView = true
      }

      if (!canView) {
        throw new ForbiddenError('You cannot view this user\'s DAR stats')
      }

      const whereClause = { userId: targetUserId }
      if (project && project.trim()) {
        whereClause.projectName = project.trim()
      }

      const startDate = dateFrom || new Date().toISOString().slice(0, 10)
      const endDate = dateTo || startDate
      whereClause.date = { [Op.gte]: startDate, [Op.lte]: endDate }

      const rows = await DAR.findAll({
        where: whereClause,
        attributes: ['date', 'totalHours', 'status'],
      })

      const todayStr = new Date().toISOString().slice(0, 10)
      const today = new Date(todayStr)
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekStartStr = weekStart.toISOString().slice(0, 10)
      const weekEndStr = weekEnd.toISOString().slice(0, 10)

      let todayHours = 0
      let weekHours = 0
      let monthHours = 0
      const counts = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0 }

      rows.forEach((row) => {
        const plain = row.get ? row.get({ plain: true }) : row
        const hrs = Number(plain.totalHours || 0)
        const d = plain.date

        monthHours += hrs
        if (d === todayStr) todayHours += hrs
        if (d >= weekStartStr && d <= weekEndStr) weekHours += hrs

        const st = (plain.status || 'DRAFT').toUpperCase()
        if (counts[st] !== undefined) counts[st] += 1
      })

      res.status(200).json({
        success: true,
        message: 'Stats retrieved successfully',
        data: {
          todayHours: Math.round(todayHours * 100) / 100,
          weekHours: Math.round(weekHours * 100) / 100,
          monthHours: Math.round(monthHours * 100) / 100,
          submittedCount: counts.SUBMITTED,
          approvedCount: counts.APPROVED,
          draftCount: counts.DRAFT,
          rejectedCount: counts.REJECTED,
        },
      })
    } catch (error) {
      logger.error('Error in getUserStats:', error)
      next(error)
    }
  }

  /**
   * Get project summary for a specific user
   * GET /api/dar/user/:userId/projects-summary
   * Query: startDate, endDate
   */
  async getUserProjectSummary(req, res, next) {
    try {
      const currentUser = req.user
      const targetUserId = parseInt(req.params.userId, 10)
      const { startDate, endDate } = req.query

      if (isNaN(targetUserId)) {
        throw new BadRequestError('Invalid user ID')
      }

      const isOwn = Number(currentUser.id) === targetUserId
      const isManager = currentUser.role === 'MANAGER' || currentUser.role === 'HOD'
      const isAdminLike = ['ADMIN', 'HR', 'HEAD_HR', 'HOD'].includes(currentUser.role)

      let canView = isOwn
      if (!canView && isManager) {
        const targetUser = await User.findByPk(targetUserId, {
          attributes: ['id', 'reportingManagerId'],
        })
        if (!targetUser) throw new NotFoundError('User not found')
        canView = Number(targetUser.reportingManagerId) === Number(currentUser.id)
      } else if (!canView && isAdminLike) {
        canView = true
      }

      if (!canView) {
        throw new ForbiddenError('You cannot view this user\'s project summary')
      }

      const whereClause = { userId: targetUserId }
      if (startDate || endDate) {
        whereClause.date = {}
        if (startDate) whereClause.date[Op.gte] = startDate
        if (endDate) whereClause.date[Op.lte] = endDate
      }

      const rows = await DAR.findAll({
        where: whereClause,
        attributes: [
          'projectName',
          'status',
          [fn('COUNT', col('id')), 'darCount'],
          [fn('SUM', col('total_hours')), 'totalHours'],
        ],
        group: ['projectName', 'status'],
        order: [['projectName', 'ASC']],
      })

      const byProject = {}
      rows.forEach((row) => {
        const plain = row.get ? row.get({ plain: true }) : row
        const projectName = plain.projectName || 'Unassigned'
        if (!byProject[projectName]) {
          byProject[projectName] = { projectName, darCount: 0, approvedCount: 0, totalHours: 0 }
        }
        byProject[projectName].darCount += Number(plain.darCount || 0)
        byProject[projectName].totalHours += Number(plain.totalHours || 0)
        if ((plain.status || '').toUpperCase() === 'APPROVED') {
          byProject[projectName].approvedCount += Number(plain.darCount || 0)
        }
      })

      const data = Object.values(byProject).map((p) => {
        const totalH = Number(p.totalHours || 0)
        const darC = Number(p.darCount || 0)
        const approvedC = Number(p.approvedCount || 0)
        return {
          projectName: p.projectName,
          darCount: darC,
          approvedCount: approvedC,
          totalHours: totalH,
          averageHoursPerDay: darC > 0 ? Math.round((totalH / darC) * 100) / 100 : 0,
          completionPercent: darC > 0 ? Math.round((approvedC / darC) * 100) : 0,
        }
      })

      res.status(200).json({
        success: true,
        message: 'Project summary retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getUserProjectSummary:', error)
      next(error)
    }
  }

  /**
   * Get users that current user can view DAR stats for (for Single User Dashboard)
   * GET /api/dar/viewable-users
   * Managers/HOD: direct reports; HR/Admin/HeadHR: all active employees
   */
  async getViewableUsers(req, res, next) {
    try {
      const currentUser = req.user
      const isManager = currentUser.role === 'MANAGER' || currentUser.role === 'HOD'
      const isAdminLike = ['ADMIN', 'HR', 'HEAD_HR'].includes(currentUser.role)

      if (!isManager && !isAdminLike) {
        return res.status(200).json({
          success: true,
          message: 'Viewable users retrieved successfully',
          data: [{ id: currentUser.id, name: currentUser.name, employeeCode: currentUser.employeeCode || '', department: currentUser.department || '', designation: currentUser.designation || '' }],
        })
      }

      const where = { isActive: true }
      if (isManager) {
        where.reportingManagerId = currentUser.id
      } else {
        where.role = 'EMPLOYEE'
        if (currentUser.companyId) {
          where.companyId = currentUser.companyId
        }
      }

      const users = await User.findAll({
        where,
        attributes: ['id', 'name', 'employeeCode', 'department', 'designation'],
        order: [['name', 'ASC']],
      })

      const data = users.map((u) => {
        const plain = u.get ? u.get({ plain: true }) : u
        return {
          id: plain.id,
          name: plain.name || 'Unknown',
          employeeCode: plain.employeeCode || '',
          department: plain.department || '',
          designation: plain.designation || '',
        }
      })

      res.status(200).json({
        success: true,
        message: 'Viewable users retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getViewableUsers:', error)
      next(error)
    }
  }

  /**
   * Get per-project summary for current user
   * GET /api/dar/my/projects-summary
   * Optional query: startDate, endDate
   */
  async getMyProjectSummary(req, res, next) {
    try {
      const userId = req.user.id
      const { startDate, endDate, project } = req.query

      const whereClause = { userId }
      if (project && String(project).trim()) {
        whereClause.projectName = String(project).trim()
      }
      if (startDate || endDate) {
        whereClause.date = {}
        if (startDate) {
          whereClause.date[Op.gte] = startDate
        }
        if (endDate) {
          whereClause.date[Op.lte] = endDate
        }
      }

      const rows = await DAR.findAll({
        where: whereClause,
        attributes: [
          'projectName',
          'status',
          [fn('COUNT', col('id')), 'darCount'],
          [fn('SUM', col('total_hours')), 'totalHours'],
        ],
        group: ['projectName', 'status'],
        order: [['projectName', 'ASC']],
      })

      const byProject = {}
      rows.forEach((row) => {
        const plain = row.get ? row.get({ plain: true }) : row
        const projectName = plain.projectName || 'Unassigned'
        if (!byProject[projectName]) {
          byProject[projectName] = { projectName, darCount: 0, approvedCount: 0, totalHours: 0 }
        }
        byProject[projectName].darCount += Number(plain.darCount || 0)
        byProject[projectName].totalHours += Number(plain.totalHours || 0)
        if ((plain.status || '').toUpperCase() === 'APPROVED') {
          byProject[projectName].approvedCount += Number(plain.darCount || 0)
        }
      })

      const data = Object.values(byProject).map((p) => {
        const totalH = Number(p.totalHours || 0)
        const darC = Number(p.darCount || 0)
        const approvedC = Number(p.approvedCount || 0)
        return {
          projectName: p.projectName,
          darCount: darC,
          approvedCount: approvedC,
          totalHours: totalH,
          averageHoursPerDay: darC > 0 ? Math.round((totalH / darC) * 100) / 100 : 0,
          completionPercent: darC > 0 ? Math.round((approvedC / darC) * 100) : 0,
        }
      })

      res.status(200).json({
        success: true,
        message: 'Project summary retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getMyProjectSummary:', error)
      next(error)
    }
  }

  /**
   * List DAR projects (master)
   * GET /api/dar/projects
   */
  async getProjects(req, res, next) {
    try {
      const projects = await DarProject.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']],
      })
      const data = projects.map((p) => {
        const plain = p.get ? p.get({ plain: true }) : p
        return {
          id: plain.id,
          name: plain.name,
          description: plain.description || '',
        }
      })
      res.status(200).json({
        success: true,
        message: 'Projects retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getProjects:', error)
      next(error)
    }
  }

  /**
   * Create DAR project (master)
   * POST /api/dar/projects
   * Allowed roles: ADMIN, HR, HEAD_HR, MANAGER, HOD
   */
  async createProject(req, res, next) {
    try {
      const currentUser = req.user
      const allowedRoles = ['ADMIN', 'HR', 'HEAD_HR', 'MANAGER', 'HOD']
      if (!allowedRoles.includes(currentUser.role)) {
        throw new ForbiddenError('You are not allowed to create projects')
      }

      const { name, description } = req.body
      if (!name || !name.trim()) {
        throw new BadRequestError('Project name is required')
      }

      const existing = await DarProject.findOne({ where: { name: name.trim() } })
      if (existing) {
        throw new BadRequestError('Project with this name already exists')
      }

      const project = await DarProject.create({
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true,
      })

      const plain = project.get ? project.get({ plain: true }) : project

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          id: plain.id,
          name: plain.name,
          description: plain.description || '',
        },
      })
    } catch (error) {
      logger.error('Error in createProject:', error)
      next(error)
    }
  }

  /**
   * List DAR clients (master)
   * GET /api/dar/clients
   */
  async getClients(req, res, next) {
    try {
      const clients = await DarClient.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']],
      })
      const data = clients.map((c) => {
        const plain = c.get ? c.get({ plain: true }) : c
        return {
          id: plain.id,
          name: plain.name,
          contactName: plain.contactName || '',
          email: plain.email || '',
          phone: plain.phone || '',
          description: plain.description || '',
        }
      })
      res.status(200).json({
        success: true,
        message: 'Clients retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getClients:', error)
      next(error)
    }
  }

  /**
   * Create DAR client (master)
   * POST /api/dar/clients
   * Allowed roles: ADMIN, HR, HEAD_HR, MANAGER, HOD
   */
  async createClient(req, res, next) {
    try {
      const currentUser = req.user
      const allowedRoles = ['ADMIN', 'HR', 'HEAD_HR', 'MANAGER', 'HOD']
      if (!allowedRoles.includes(currentUser.role)) {
        throw new ForbiddenError('You are not allowed to create clients')
      }

      const { name, contactName, email, phone, description } = req.body
      if (!name || !name.trim()) {
        throw new BadRequestError('Client name is required')
      }

      const existing = await DarClient.findOne({ where: { name: name.trim() } })
      if (existing) {
        throw new BadRequestError('Client with this name already exists')
      }

      const client = await DarClient.create({
        name: name.trim(),
        contactName: contactName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        description: description?.trim() || null,
        isActive: true,
      })

      const plain = client.get ? client.get({ plain: true }) : client

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: {
          id: plain.id,
          name: plain.name,
          contactName: plain.contactName || '',
          email: plain.email || '',
          phone: plain.phone || '',
          description: plain.description || '',
        },
      })
    } catch (error) {
      logger.error('Error in createClient:', error)
      next(error)
    }
  }

  /**
   * Get team DARs (for manager)
   * GET /api/dar/team
   */
  async getTeamDARs(req, res, next) {
    try {
      const managerId = req.user.id
      const { page = 1, limit = 20, status, startDate, endDate, search } = req.query

      // Get all users reporting to this manager
      const teamMembers = await User.findAll({
        where: {
          reportingManagerId: managerId,
          isActive: true,
        },
        attributes: ['id'],
      })

      const teamMemberIds = teamMembers.map((member) => member.id)

      if (teamMemberIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No team members found',
          data: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        })
      }

      const whereClause = {
        userId: { [Op.in]: teamMemberIds },
      }

      if (status && status !== 'ALL') {
        whereClause.status = status
      }

      if (startDate || endDate) {
        whereClause.date = {}
        if (startDate) {
          whereClause.date[Op.gte] = startDate
        }
        if (endDate) {
          whereClause.date[Op.lte] = endDate
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit)

      const { count, rows } = await DAR.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode', 'department', 'designation'],
          },
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      })

      // Filter by search query if provided
      let filteredRows = rows
      if (search) {
        const searchLower = search.toLowerCase()
        filteredRows = rows.filter((dar) => {
          return (
            dar.activityDescription?.toLowerCase().includes(searchLower) ||
            dar.projectName?.toLowerCase().includes(searchLower) ||
            dar.workLocation?.toLowerCase().includes(searchLower) ||
            dar.user?.name?.toLowerCase().includes(searchLower)
          )
        })
      }

      const formattedDARs = filteredRows.map((dar) => formatDarForCreateOrUpdate(dar))

      res.status(200).json({
        success: true,
        message: 'Team DARs retrieved successfully',
        data: formattedDARs,
        total: search ? filteredRows.length : count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((search ? filteredRows.length : count) / parseInt(limit)),
      })
    } catch (error) {
      logger.error('Error in getTeamDARs:', error)
      next(error)
    }
  }

  /**
   * Get all DARs (for HR/Admin)
   * GET /api/dar/all
   */
  async getAllDARs(req, res, next) {
    try {
      const { page = 1, limit = 20, status, startDate, endDate, userId, search } = req.query

      const whereClause = {}

      if (userId) {
        whereClause.userId = parseInt(userId)
      }

      if (status && status !== 'ALL') {
        whereClause.status = status
      }

      if (startDate || endDate) {
        whereClause.date = {}
        if (startDate) {
          whereClause.date[Op.gte] = startDate
        }
        if (endDate) {
          whereClause.date[Op.lte] = endDate
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit)

      const { count, rows } = await DAR.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode', 'department', 'designation'],
          },
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      })

      // Filter by search query if provided
      let filteredRows = rows
      if (search) {
        const searchLower = search.toLowerCase()
        filteredRows = rows.filter((dar) => {
          return (
            dar.activityDescription?.toLowerCase().includes(searchLower) ||
            dar.projectName?.toLowerCase().includes(searchLower) ||
            dar.workLocation?.toLowerCase().includes(searchLower) ||
            dar.user?.name?.toLowerCase().includes(searchLower)
          )
        })
      }

      const formattedDARs = filteredRows.map((dar) => formatDarForCreateOrUpdate(dar))

      res.status(200).json({
        success: true,
        message: 'All DARs retrieved successfully',
        data: formattedDARs,
        total: search ? filteredRows.length : count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((search ? filteredRows.length : count) / parseInt(limit)),
      })
    } catch (error) {
      logger.error('Error in getAllDARs:', error)
      next(error)
    }
  }

  /**
   * Format DAR for frontend
   */
  formatDAR(dar) {
    const user = dar.user || {}
    return {
      id: dar.id.toString(),
      userId: dar.userId.toString(),
      employeeId: user.employeeCode || dar.userId.toString(),
      employeeName: user.name || 'Unknown',
      department: user.department || null,
      designation: user.designation || null,
      reportingManagerId: user.reportingManagerId?.toString() || null,
      reportingManagerName: null, // TODO: Populate if needed
      date: dar.date,
      projectName: dar.projectName || null,
      workLocation: dar.workLocation || null,
      workLocationLatitude: dar.workLocationLatitude ? parseFloat(dar.workLocationLatitude) : null,
      workLocationLongitude: dar.workLocationLongitude ? parseFloat(dar.workLocationLongitude) : null,
      activityDescription: dar.activityDescription,
      taskCategory: dar.taskCategory,
      startTime: dar.startTime,
      endTime: dar.endTime,
      totalHours: dar.totalHours ? parseFloat(dar.totalHours) : 0,
      remarks: dar.remarks || null,
      issuesFaced: dar.issuesFaced || null,
      attachments: [], // TODO: Implement attachments
      status: dar.status,
      submittedAt: toIsoString(dar.submittedAt),
      approvedBy: dar.approvedBy?.toString() || null,
      approvedAt: toIsoString(dar.approvedAt),
      rejectedBy: dar.rejectedBy?.toString() || null,
      rejectedAt: toIsoString(dar.rejectedAt),
      rejectionReason: dar.rejectionReason || null,
      managerComments: dar.managerComments || null,
      createdAt: toIsoString(dar.createdAt),
      updatedAt: toIsoString(dar.updatedAt),
    }
  }
}

/** Safely convert date (Date or string from DB) to ISO string */
function toIsoString(val) {
  if (val == null) return null
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'string') return new Date(val).toISOString()
  return null
}

function formatDarForCreateOrUpdate(dar) {
  const plain = dar.get ? dar.get({ plain: true }) : dar
  return {
    id: plain.id.toString(),
    userId: plain.userId?.toString?.() || String(plain.userId),
    employeeId: plain.userId?.toString?.() || String(plain.userId),
    employeeName: plain.user?.name || undefined,
    department: plain.user?.department || null,
    designation: plain.user?.designation || null,
    reportingManagerId: plain.user?.reportingManagerId
      ? String(plain.user.reportingManagerId)
      : null,
    reportingManagerName: null,
    date: plain.date,
    projectName: plain.projectName || null,
    workLocation: plain.workLocation || null,
    workLocationLatitude: plain.workLocationLatitude
      ? parseFloat(plain.workLocationLatitude)
      : null,
    workLocationLongitude: plain.workLocationLongitude
      ? parseFloat(plain.workLocationLongitude)
      : null,
    activityDescription: plain.activityDescription,
    taskCategory: plain.taskCategory,
    startTime: plain.startTime,
    endTime: plain.endTime,
    totalHours: plain.totalHours ? parseFloat(plain.totalHours) : 0,
    remarks: plain.remarks || null,
    issuesFaced: plain.issuesFaced || null,
    attachments: [],
    status: plain.status,
    submittedAt: toIsoString(plain.submittedAt),
    approvedBy: plain.approvedBy ? String(plain.approvedBy) : null,
    approvedAt: toIsoString(plain.approvedAt),
    rejectedBy: plain.rejectedBy ? String(plain.rejectedBy) : null,
    rejectedAt: toIsoString(plain.rejectedAt),
    rejectionReason: plain.rejectionReason || null,
    managerComments: plain.managerComments || null,
    createdAt: toIsoString(plain.createdAt),
    updatedAt: toIsoString(plain.updatedAt),
  }
}

module.exports = new DARController()
