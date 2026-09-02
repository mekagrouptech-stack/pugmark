const { Role } = require('../models')
const { BadRequestError, NotFoundError } = require('../utils/errors')
const { Op } = require('sequelize')

const getAllRoles = async (req, res, next) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) where.name = { [Op.like]: `%${search}%` }
    const roles = await Role.findAll({
      where,
      order: [['name', 'ASC']],
    })
    res.status(200).json({ success: true, data: roles, count: roles.length })
  } catch (error) {
    next(error)
  }
}

const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id)
    if (!role) throw new NotFoundError('Role not found')
    res.status(200).json({ success: true, data: role })
  } catch (error) {
    next(error)
  }
}

const createRole = async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name || !String(name).trim()) throw new BadRequestError('Name is required')
    const existing = await Role.findOne({ where: { name: String(name).trim() } })
    if (existing) throw new BadRequestError('Role with this name already exists')
    const role = await Role.create({ name: String(name).trim() })
    res.status(201).json({ success: true, message: 'Role created successfully', data: role })
  } catch (error) {
    next(error)
  }
}

const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id)
    if (!role) throw new NotFoundError('Role not found')
    const { name } = req.body
    if (!name || !String(name).trim()) throw new BadRequestError('Name is required')
    const existing = await Role.findOne({ where: { name: String(name).trim() } })
    if (existing && existing.id !== role.id) throw new BadRequestError('Role with this name already exists')
    await role.update({ name: String(name).trim() })
    res.status(200).json({ success: true, message: 'Role updated successfully', data: role })
  } catch (error) {
    next(error)
  }
}

const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id)
    if (!role) throw new NotFoundError('Role not found')
    await role.destroy()
    res.status(200).json({ success: true, message: 'Role deleted successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
}
