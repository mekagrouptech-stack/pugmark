const { SalaryStructure, User } = require('../models')
const { Op } = require('sequelize')
const { asyncHandler } = require('../utils/asyncHandler')
const logger = require('../utils/logger')

const toRecord = (row, creator, modifier) => {
  const r = row.toJSON ? row.toJSON() : row
  return {
    id: r.id,
    name: r.name,
    totalEarnings: Number(r.totalEarnings ?? r.total_earnings ?? 0),
    totalDeductions: Number(r.totalDeductions ?? r.total_deductions ?? 0),
    totalSalary: Number(r.totalSalary ?? r.total_salary ?? 0),
    status: r.status || 'Published',
    config: r.config,
    companyId: r.companyId ?? r.company_id,
    createdBy: r.createdBy ?? r.created_by,
    createdOn: r.createdAt ?? r.created_at,
    modifiedBy: r.modifiedBy ?? r.modified_by,
    modifiedOn: r.updatedAt ?? r.updated_at,
    createdByName: creator?.name || 'NA',
    modifiedByName: modifier?.name || 'NA',
  }
}

/**
 * GET /api/salary/structures
 */
const getAll = asyncHandler(async (req, res) => {
  const { search, companyId } = req.query
  const where = {}
  if (companyId) where.companyId = companyId
  if (search) {
    where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }]
  }
  const rows = await SalaryStructure.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
      { model: User, as: 'modifier', attributes: ['id', 'name'], required: false },
    ],
  })
  const data = rows.map((r) => toRecord(r, r.creator, r.modifier))
  res.json({ success: true, data })
})

/**
 * GET /api/salary/structures/:id
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const row = await SalaryStructure.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
      { model: User, as: 'modifier', attributes: ['id', 'name'], required: false },
    ],
  })
  if (!row) {
    return res.status(404).json({ success: false, message: 'Salary structure not found' })
  }
  res.json({ success: true, data: toRecord(row, row.creator, row.modifier) })
})

/**
 * POST /api/salary/structures
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { name, totalEarnings, totalDeductions, totalSalary, status, config, companyId } = req.body
  const row = await SalaryStructure.create({
    name: name || 'Untitled Structure',
    totalEarnings: totalEarnings ?? 0,
    totalDeductions: totalDeductions ?? 0,
    totalSalary: totalSalary ?? 0,
    status: status || 'Published',
    config: config || null,
    companyId: companyId || null,
    createdBy: userId,
    modifiedBy: null,
  })
  const creator = await User.findByPk(userId, { attributes: ['name'] }).catch(() => null)
  res.status(201).json({ success: true, data: toRecord(row, creator, null) })
})

/**
 * PUT /api/salary/structures/:id
 */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const row = await SalaryStructure.findByPk(id)
  if (!row) {
    return res.status(404).json({ success: false, message: 'Salary structure not found' })
  }
  const { name, totalEarnings, totalDeductions, totalSalary, status, config, companyId } = req.body
  const updates = {}
  if (name != null) updates.name = name
  if (totalEarnings != null) updates.totalEarnings = totalEarnings
  if (totalDeductions != null) updates.totalDeductions = totalDeductions
  if (totalSalary != null) updates.totalSalary = totalSalary
  if (status != null) updates.status = status
  if (config != null) updates.config = config
  if (companyId != null) updates.companyId = companyId
  updates.modifiedBy = userId
  await row.update(updates)
  const [creator, modifier] = await Promise.all([
    User.findByPk(row.createdBy).catch(() => null),
    User.findByPk(userId).catch(() => null),
  ])
  res.json({ success: true, data: toRecord(row, creator, modifier) })
})

/**
 * DELETE /api/salary/structures/:id
 */
const remove = asyncHandler(async (req, res) => {
  const { id } = req.params
  const row = await SalaryStructure.findByPk(id)
  if (!row) {
    return res.status(404).json({ success: false, message: 'Salary structure not found' })
  }
  await row.destroy()
  res.json({ success: true, message: 'Deleted' })
})

/**
 * POST /api/salary/structures/:id/duplicate
 */
const duplicate = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const src = await SalaryStructure.findByPk(id)
  if (!src) {
    return res.status(404).json({ success: false, message: 'Salary structure not found' })
  }
  const row = await SalaryStructure.create({
    name: `${src.name} - Copy`,
    totalEarnings: src.totalEarnings ?? 0,
    totalDeductions: src.totalDeductions ?? 0,
    totalSalary: src.totalSalary ?? 0,
    status: src.status || 'Published',
    config: src.config,
    companyId: src.companyId,
    createdBy: userId,
    modifiedBy: null,
  })
  const creator = await User.findByPk(userId, { attributes: ['name'] }).catch(() => null)
  res.status(201).json({ success: true, data: toRecord(row, creator, null) })
})

/**
 * DELETE /api/salary/structures/bulk
 */
const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'ids array required' })
  }
  const deleted = await SalaryStructure.destroy({ where: { id: ids } })
  res.json({ success: true, message: `Deleted ${deleted} structure(s)`, count: deleted })
})

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  duplicate,
  bulkDelete,
}
