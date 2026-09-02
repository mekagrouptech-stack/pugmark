const { RolePermission } = require('../models')
const { DEFAULT_PERMISSIONS, PERMISSION_KEYS, ALL_ROLES } = require('../utils/permissions')
const { BadRequestError } = require('../utils/errors')
const logger = require('../utils/logger')

const buildPermissionsMap = async () => {
  const rows = await RolePermission.findAll()
  if (!rows || rows.length === 0) {
    return DEFAULT_PERMISSIONS
  }

  const map = {}
  for (const row of rows) {
    const role = String(row.role).toLowerCase()
    if (!map[role]) {
      map[role] = []
    }
    map[role].push(row.permission)
  }

  // Ensure all known roles exist in the map (fallback to defaults if missing)
  ALL_ROLES.forEach((role) => {
    if (!map[role]) {
      map[role] = DEFAULT_PERMISSIONS[role] || []
    }
  })

  return map
}

class PermissionController {
  /**
   * Get current permissions matrix for all roles.
   * GET /api/permissions
   */
  async getPermissions(req, res, next) {
    try {
      // If table does not exist yet, return defaults (server may not have run migration)
      let count = 0
      try {
        count = await RolePermission.count()
      } catch (tableErr) {
        logger.warn('role_permissions table not ready, returning defaults:', tableErr.message)
        return res.status(200).json({
          success: true,
          message: 'Permissions loaded (defaults)',
          data: DEFAULT_PERMISSIONS,
        })
      }

      // Seed from defaults if table is empty
      if (count === 0) {
        const bulk = []
        Object.entries(DEFAULT_PERMISSIONS).forEach(([role, perms]) => {
          perms.forEach((perm) => {
            bulk.push({ role, permission: perm })
          })
        })
        if (bulk.length) {
          await RolePermission.bulkCreate(bulk, { ignoreDuplicates: true })
        }
      }

      const permissions = await buildPermissionsMap()

      res.status(200).json({
        success: true,
        message: 'Permissions loaded successfully',
        data: permissions,
      })
    } catch (error) {
      logger.error('Error in getPermissions:', error)
      next(error)
    }
  }

  /**
   * Update a single permission for a role.
   * POST /api/permissions/update
   * Body: { role, permission, enabled }
   */
  async updateRolePermission(req, res, next) {
    try {
      const { role, permission, enabled } = req.body || {}

      if (!role || !permission || typeof enabled !== 'boolean') {
        throw new BadRequestError('role, permission and enabled (boolean) are required')
      }

      const normalizedRole = String(role).toLowerCase()
      if (!ALL_ROLES.includes(normalizedRole)) {
        throw new BadRequestError(`Invalid role: ${role}`)
      }

      const validPermissions = Object.values(PERMISSION_KEYS)
      if (!validPermissions.includes(permission)) {
        throw new BadRequestError(`Invalid permission: ${permission}`)
      }

      if (enabled) {
        await RolePermission.findOrCreate({
          where: { role: normalizedRole, permission },
          defaults: { role: normalizedRole, permission },
        })
      } else {
        await RolePermission.destroy({
          where: { role: normalizedRole, permission },
        })
      }

      const permissions = await buildPermissionsMap()

      res.status(200).json({
        success: true,
        message: `Permission ${enabled ? 'enabled' : 'disabled'} for ${normalizedRole}`,
        data: permissions,
      })
    } catch (error) {
      logger.error('Error in updateRolePermission:', error)
      next(error)
    }
  }

  /**
   * Reset permissions for a role back to defaults.
   * POST /api/permissions/reset
   * Body: { role }
   */
  async resetRolePermissions(req, res, next) {
    try {
      const { role } = req.body || {}
      if (!role) {
        throw new BadRequestError('role is required')
      }

      const normalizedRole = String(role).toLowerCase()
      if (!ALL_ROLES.includes(normalizedRole)) {
        throw new BadRequestError(`Invalid role: ${role}`)
      }

      const defaultPerms = DEFAULT_PERMISSIONS[normalizedRole] || []

      await RolePermission.destroy({ where: { role: normalizedRole } })

      if (defaultPerms.length) {
        await RolePermission.bulkCreate(
          defaultPerms.map((perm) => ({ role: normalizedRole, permission: perm }))
        )
      }

      const permissions = await buildPermissionsMap()

      res.status(200).json({
        success: true,
        message: `Permissions reset for ${normalizedRole}`,
        data: permissions,
      })
    } catch (error) {
      logger.error('Error in resetRolePermissions:', error)
      next(error)
    }
  }
}

module.exports = new PermissionController()

