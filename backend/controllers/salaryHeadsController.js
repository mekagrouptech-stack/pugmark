const { SalaryHead } = require('../models')
const { BadRequestError, NotFoundError } = require('../utils/errors')
const logger = require('../utils/logger')

class SalaryHeadsController {
  async getAll(req, res, next) {
    try {
      const { status } = req.query
      const where = {}
      if (status && ['Active', 'Inactive'].includes(status)) where.status = status

      const rows = await SalaryHead.findAll({
        where,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      })

      const data = rows.map((r) => {
        const plain = r.get ? r.get({ plain: true }) : r
        return {
          id: plain.id,
          head: plain.name,
          name: plain.name,
          type: plain.type,
          status: plain.status,
          sortOrder: plain.sortOrder,
        }
      })

      res.status(200).json({
        success: true,
        message: 'Salary heads retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getAll salary heads:', error)
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const { name, type, status } = req.body

      if (!name || !name.trim()) {
        throw new BadRequestError('Salary head name is required')
      }

      const existing = await SalaryHead.findOne({ where: { name: name.trim() } })
      if (existing) throw new BadRequestError('A salary head with this name already exists')

      const row = await SalaryHead.create({
        name: name.trim(),
        type: type === 'DEDUCTION' ? 'DEDUCTION' : 'EARNING',
        status: status === 'Inactive' ? 'Inactive' : 'Active',
      })

      const plain = row.get ? row.get({ plain: true }) : row
      res.status(201).json({
        success: true,
        message: 'Salary head created successfully',
        data: {
          id: plain.id,
          head: plain.name,
          name: plain.name,
          type: plain.type,
          status: plain.status,
        },
      })
    } catch (error) {
      logger.error('Error in create salary head:', error)
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params
      const { name, type, status } = req.body

      const row = await SalaryHead.findByPk(id)
      if (!row) throw new NotFoundError('Salary head not found')

      const updates = {}
      if (name != null && name.trim()) {
        const existing = await SalaryHead.findOne({ where: { name: name.trim() } })
        if (existing && existing.id !== parseInt(id)) {
          throw new BadRequestError('A salary head with this name already exists')
        }
        updates.name = name.trim()
      }
      if (type != null) updates.type = type === 'DEDUCTION' ? 'DEDUCTION' : 'EARNING'
      if (status != null) updates.status = status === 'Inactive' ? 'Inactive' : 'Active'

      await row.update(updates)

      const plain = row.get ? row.get({ plain: true }) : row
      res.status(200).json({
        success: true,
        message: 'Salary head updated successfully',
        data: {
          id: plain.id,
          head: plain.name,
          name: plain.name,
          type: plain.type,
          status: plain.status,
        },
      })
    } catch (error) {
      logger.error('Error in update salary head:', error)
      next(error)
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params
      const row = await SalaryHead.findByPk(id)
      if (!row) throw new NotFoundError('Salary head not found')

      await row.destroy()
      res.status(200).json({
        success: true,
        message: 'Salary head deleted successfully',
      })
    } catch (error) {
      logger.error('Error in delete salary head:', error)
      next(error)
    }
  }
}

module.exports = new SalaryHeadsController()
