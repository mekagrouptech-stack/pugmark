const { ExtraEarning, User } = require('../models')
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors')
const logger = require('../utils/logger')

class ExtraEarningsController {
  /**
   * Get all extra earnings/deductions
   * GET /api/extra-earnings?userId=&month=&year=&status=
   */
  async getAll(req, res, next) {
    try {
      const { userId, month, year, status } = req.query
      const where = {}
      if (userId) where.userId = parseInt(userId)
      if (month) where.month = parseInt(month)
      if (year) where.year = parseInt(year)
      if (status && ['PENDING', 'PROCESSED'].includes(status)) where.status = status

      const rows = await ExtraEarning.findAll({
        where,
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employeeCode', 'department'] }],
        order: [['year', 'DESC'], ['month', 'DESC'], ['createdAt', 'DESC']],
      })

      const data = rows.map((r) => {
        const plain = r.get ? r.get({ plain: true }) : r
        const amt = Number(plain.amount || 0)
        return {
          id: plain.id,
          userId: plain.userId,
          employee: plain.user?.name || 'Unknown',
          employeeCode: plain.user?.employeeCode || '',
          type: plain.type,
          amount: amt,
          month: plain.month,
          year: plain.year,
          monthYear: `${getMonthName(plain.month)} ${plain.year}`,
          status: plain.status,
          remarks: plain.remarks,
          createdAt: plain.createdAt,
        }
      })

      res.status(200).json({
        success: true,
        message: 'Extra earnings/deductions retrieved successfully',
        data,
      })
    } catch (error) {
      logger.error('Error in getAll extra earnings:', error)
      next(error)
    }
  }

  /**
   * Create extra earning/deduction
   * POST /api/extra-earnings
   */
  async create(req, res, next) {
    try {
      const { userId, type, amount, month, year, status, remarks } = req.body

      if (!userId || !type || amount == null || !month || !year) {
        throw new BadRequestError('userId, type, amount, month, and year are required')
      }

      const m = parseInt(month, 10)
      const y = parseInt(year, 10)
      if (m < 1 || m > 12) throw new BadRequestError('Month must be 1-12')
      if (y < 2000 || y > 2100) throw new BadRequestError('Invalid year')

      const amt = parseFloat(amount)
      if (isNaN(amt)) throw new BadRequestError('Invalid amount')

      const user = await User.findByPk(userId)
      if (!user) throw new NotFoundError('User not found')

      const row = await ExtraEarning.create({
        userId,
        type: String(type).trim(),
        amount: amt,
        month: m,
        year: y,
        status: status === 'PROCESSED' ? 'PROCESSED' : 'PENDING',
        remarks: remarks || null,
      })

      const created = await ExtraEarning.findByPk(row.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employeeCode'] }],
      })
      const plain = created.get({ plain: true })

      res.status(201).json({
        success: true,
        message: 'Extra earning/deduction created successfully',
        data: {
          id: plain.id,
          userId: plain.userId,
          employee: plain.user?.name || 'Unknown',
          type: plain.type,
          amount: Number(plain.amount),
          month: plain.month,
          year: plain.year,
          monthYear: `${getMonthName(plain.month)} ${plain.year}`,
          status: plain.status,
          remarks: plain.remarks,
        },
      })
    } catch (error) {
      logger.error('Error in create extra earning:', error)
      next(error)
    }
  }

  /**
   * Update extra earning/deduction
   * PUT /api/extra-earnings/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params
      const { type, amount, month, year, status, remarks } = req.body

      const row = await ExtraEarning.findByPk(id)
      if (!row) throw new NotFoundError('Entry not found')

      const updates = {}
      if (type != null) updates.type = String(type).trim()
      if (amount != null) {
        const amt = parseFloat(amount)
        if (isNaN(amt)) throw new BadRequestError('Invalid amount')
        updates.amount = amt
      }
      if (month != null) {
        const m = parseInt(month, 10)
        if (m < 1 || m > 12) throw new BadRequestError('Month must be 1-12')
        updates.month = m
      }
      if (year != null) {
        const y = parseInt(year, 10)
        if (y < 2000 || y > 2100) throw new BadRequestError('Invalid year')
        updates.year = y
      }
      if (status != null) updates.status = status === 'PROCESSED' ? 'PROCESSED' : 'PENDING'
      if (remarks !== undefined) updates.remarks = remarks || null

      await row.update(updates)

      const updated = await ExtraEarning.findByPk(id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employeeCode'] }],
      })
      const plain = updated.get ? updated.get({ plain: true }) : updated

      res.status(200).json({
        success: true,
        message: 'Entry updated successfully',
        data: {
          id: plain.id,
          userId: plain.userId,
          employee: plain.user?.name || 'Unknown',
          type: plain.type,
          amount: Number(plain.amount),
          month: plain.month,
          year: plain.year,
          monthYear: `${getMonthName(plain.month)} ${plain.year}`,
          status: plain.status,
          remarks: plain.remarks,
        },
      })
    } catch (error) {
      logger.error('Error in update extra earning:', error)
      next(error)
    }
  }

  /**
   * Delete extra earning/deduction
   * DELETE /api/extra-earnings/:id
   */
  async remove(req, res, next) {
    try {
      const { id } = req.params
      const row = await ExtraEarning.findByPk(id)
      if (!row) throw new NotFoundError('Entry not found')

      await row.destroy()
      res.status(200).json({
        success: true,
        message: 'Entry deleted successfully',
      })
    } catch (error) {
      logger.error('Error in delete extra earning:', error)
      next(error)
    }
  }
}

function getMonthName(m) {
  const names = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return names[parseInt(m, 10)] || ''
}

module.exports = new ExtraEarningsController()
