const { MaintenanceTask, User } = require('../models')
const { BadRequestError, NotFoundError } = require('../utils/errors')
const logger = require('../utils/logger')

class MaintenanceController {
  async getAll(req, res, next) {
    try {
      const { status, priority } = req.query
      const where = {}
      if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) where.status = status
      if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) where.priority = priority

      const rows = await MaintenanceTask.findAll({
        where,
        include: [
          { model: User, as: 'assignedUser', attributes: ['id', 'name', 'employeeCode'], required: false },
          { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
        ],
        order: [['createdAt', 'DESC']],
      })

      const data = rows.map((r) => {
        const plain = r.get ? r.get({ plain: true }) : r
        return {
          id: plain.id,
          title: plain.title,
          description: plain.description,
          status: plain.status,
          priority: plain.priority,
          dueDate: plain.dueDate,
          assignedTo: plain.assignedTo,
          assignedUser: plain.assignedUser?.name || '-',
          createdBy: plain.createdBy,
          createdByName: plain.creator?.name || '-',
          createdAt: plain.createdAt,
          updatedAt: plain.updatedAt,
        }
      })

      res.status(200).json({ success: true, message: 'Maintenance tasks retrieved', data })
    } catch (error) {
      logger.error('Error in getAll maintenance:', error)
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const row = await MaintenanceTask.findByPk(id, {
        include: [
          { model: User, as: 'assignedUser', attributes: ['id', 'name', 'employeeCode'], required: false },
          { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
        ],
      })
      if (!row) throw new NotFoundError('Maintenance task not found')
      const plain = row.get({ plain: true })
      res.status(200).json({
        success: true,
        data: {
          id: plain.id,
          title: plain.title,
          description: plain.description,
          status: plain.status,
          priority: plain.priority,
          dueDate: plain.dueDate,
          assignedTo: plain.assignedTo,
          assignedUser: plain.assignedUser?.name || '-',
          createdBy: plain.createdBy,
          createdByName: plain.creator?.name || '-',
          createdAt: plain.createdAt,
          updatedAt: plain.updatedAt,
        },
      })
    } catch (error) {
      logger.error('Error in getById maintenance:', error)
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const { title, description, status, priority, dueDate, assignedTo } = req.body
      if (!title || !title.trim()) throw new BadRequestError('Title is required')

      const row = await MaintenanceTask.create({
        title: title.trim(),
        description: description?.trim() || null,
        status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status) ? status : 'PENDING',
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority) ? priority : 'MEDIUM',
        dueDate: dueDate || null,
        assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
        createdBy: req.user?.id || null,
      })

      const created = await MaintenanceTask.findByPk(row.id, {
        include: [
          { model: User, as: 'assignedUser', attributes: ['id', 'name'], required: false },
          { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
        ],
      })
      const plain = created.get({ plain: true })

      res.status(201).json({
        success: true,
        message: 'Maintenance task created',
        data: {
          id: plain.id,
          title: plain.title,
          description: plain.description,
          status: plain.status,
          priority: plain.priority,
          dueDate: plain.dueDate,
          assignedTo: plain.assignedTo,
          assignedUser: plain.assignedUser?.name || '-',
          createdByName: plain.creator?.name || '-',
          createdAt: plain.createdAt,
        },
      })
    } catch (error) {
      logger.error('Error in create maintenance:', error)
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const { title, description, status, priority, dueDate, assignedTo } = req.body

      const row = await MaintenanceTask.findByPk(id)
      if (!row) throw new NotFoundError('Maintenance task not found')

      const updates = {}
      if (title != null) updates.title = String(title).trim()
      if (description !== undefined) updates.description = description?.trim() || null
      if (status != null && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) updates.status = status
      if (priority != null && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) updates.priority = priority
      if (dueDate !== undefined) updates.dueDate = dueDate || null
      if (assignedTo !== undefined) updates.assignedTo = assignedTo ? parseInt(assignedTo, 10) : null

      await row.update(updates)

      const updated = await MaintenanceTask.findByPk(id, {
        include: [
          { model: User, as: 'assignedUser', attributes: ['id', 'name'], required: false },
          { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
        ],
      })
      const plain = updated.get({ plain: true })

      res.status(200).json({
        success: true,
        message: 'Maintenance task updated',
        data: {
          id: plain.id,
          title: plain.title,
          description: plain.description,
          status: plain.status,
          priority: plain.priority,
          dueDate: plain.dueDate,
          assignedTo: plain.assignedTo,
          assignedUser: plain.assignedUser?.name || '-',
          updatedAt: plain.updatedAt,
        },
      })
    } catch (error) {
      logger.error('Error in update maintenance:', error)
      next(error)
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params
      const row = await MaintenanceTask.findByPk(id)
      if (!row) throw new NotFoundError('Maintenance task not found')
      await row.destroy()
      res.status(200).json({ success: true, message: 'Maintenance task deleted' })
    } catch (error) {
      logger.error('Error in delete maintenance:', error)
      next(error)
    }
  }
}

module.exports = new MaintenanceController()
