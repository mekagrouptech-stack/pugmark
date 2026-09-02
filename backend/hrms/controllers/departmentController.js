const { Department } = require('../models')
const { BadRequestError, NotFoundError } = require('../utils/errors')
const { Op } = require('sequelize')

const getAllDepartments = async (req, res, next) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) where.name = { [Op.like]: `%${search}%` }
    const departments = await Department.findAll({
      where,
      order: [['name', 'ASC']],
    })
    res.status(200).json({ success: true, data: departments, count: departments.length })
  } catch (error) {
    next(error)
  }
}

const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id)
    if (!department) throw new NotFoundError('Department not found')
    res.status(200).json({ success: true, data: department })
  } catch (error) {
    next(error)
  }
}

const createDepartment = async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name || !String(name).trim()) throw new BadRequestError('Name is required')
    const existing = await Department.findOne({ where: { name: String(name).trim() } })
    if (existing) throw new BadRequestError('Department with this name already exists')
    const department = await Department.create({ name: String(name).trim() })
    res.status(201).json({ success: true, message: 'Department created successfully', data: department })
  } catch (error) {
    next(error)
  }
}

const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id)
    if (!department) throw new NotFoundError('Department not found')
    const { name } = req.body
    if (!name || !String(name).trim()) throw new BadRequestError('Name is required')
    const existing = await Department.findOne({ where: { name: String(name).trim() } })
    if (existing && existing.id !== department.id) throw new BadRequestError('Department with this name already exists')
    await department.update({ name: String(name).trim() })
    res.status(200).json({ success: true, message: 'Department updated successfully', data: department })
  } catch (error) {
    next(error)
  }
}

const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id)
    if (!department) throw new NotFoundError('Department not found')
    await department.destroy()
    res.status(200).json({ success: true, message: 'Department deleted successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
}
