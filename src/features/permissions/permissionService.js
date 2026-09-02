import api from '../../services/api'

const PERMISSION_KEYS = {
  DASHBOARD: 'dashboard',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  APPROVALS: 'approvals',
  GANTT_CALENDAR: 'gantt_calendar',
  REPORTS: 'reports',
  WORKFLOW_DIAGRAM: 'workflow_diagram',
  ADMIN_SETTINGS: 'admin_settings',
  DAR: 'dar',
  LEAVES: 'leaves',
  ATTENDANCE: 'attendance',
  TIMESHEET: 'timesheet',
  SALARY: 'salary',
  REIMBURSEMENTS: 'reimbursements',
  RESIGNATION: 'resignation',
  HELPDESK: 'helpdesk',
  MY_TEAM: 'my_team',
}

export const DEFAULT_PERMISSIONS = {
  admin: [
    PERMISSION_KEYS.DASHBOARD,
    PERMISSION_KEYS.PROJECTS,
    PERMISSION_KEYS.TASKS,
    PERMISSION_KEYS.APPROVALS,
    PERMISSION_KEYS.GANTT_CALENDAR,
    PERMISSION_KEYS.REPORTS,
    PERMISSION_KEYS.WORKFLOW_DIAGRAM,
    PERMISSION_KEYS.ADMIN_SETTINGS,
    PERMISSION_KEYS.DAR,
    PERMISSION_KEYS.LEAVES,
    PERMISSION_KEYS.ATTENDANCE,
    PERMISSION_KEYS.TIMESHEET,
    PERMISSION_KEYS.SALARY,
    PERMISSION_KEYS.REIMBURSEMENTS,
    PERMISSION_KEYS.RESIGNATION,
    PERMISSION_KEYS.HELPDESK,
    PERMISSION_KEYS.MY_TEAM,
  ],
  head_hr: [
    PERMISSION_KEYS.DASHBOARD,
    PERMISSION_KEYS.PROJECTS,
    PERMISSION_KEYS.APPROVALS,
    PERMISSION_KEYS.REPORTS,
    PERMISSION_KEYS.GANTT_CALENDAR,
    PERMISSION_KEYS.DAR,
    PERMISSION_KEYS.LEAVES,
    PERMISSION_KEYS.ATTENDANCE,
    PERMISSION_KEYS.TIMESHEET,
    PERMISSION_KEYS.SALARY,
    PERMISSION_KEYS.REIMBURSEMENTS,
    PERMISSION_KEYS.RESIGNATION,
    PERMISSION_KEYS.HELPDESK,
  ],
  hr: [
    PERMISSION_KEYS.DASHBOARD,
    PERMISSION_KEYS.PROJECTS,
    PERMISSION_KEYS.TASKS,
    PERMISSION_KEYS.APPROVALS,
    PERMISSION_KEYS.DAR,
    PERMISSION_KEYS.LEAVES,
    PERMISSION_KEYS.ATTENDANCE,
    PERMISSION_KEYS.TIMESHEET,
    PERMISSION_KEYS.SALARY,
    PERMISSION_KEYS.REIMBURSEMENTS,
    PERMISSION_KEYS.RESIGNATION,
    PERMISSION_KEYS.HELPDESK,
    PERMISSION_KEYS.MY_TEAM,
  ],
  hod: [
    PERMISSION_KEYS.DASHBOARD,
    PERMISSION_KEYS.PROJECTS,
    PERMISSION_KEYS.TASKS,
    PERMISSION_KEYS.APPROVALS,
    PERMISSION_KEYS.DAR,
    PERMISSION_KEYS.LEAVES,
    PERMISSION_KEYS.ATTENDANCE,
    PERMISSION_KEYS.TIMESHEET,
    PERMISSION_KEYS.MY_TEAM,
  ],
  employee: [
    PERMISSION_KEYS.DASHBOARD,
    PERMISSION_KEYS.TASKS,
    PERMISSION_KEYS.DAR,
    PERMISSION_KEYS.LEAVES,
    PERMISSION_KEYS.ATTENDANCE,
    PERMISSION_KEYS.TIMESHEET,
    PERMISSION_KEYS.SALARY,
    PERMISSION_KEYS.REIMBURSEMENTS,
    PERMISSION_KEYS.RESIGNATION,
    PERMISSION_KEYS.HELPDESK,
  ],
  manager: [
    PERMISSION_KEYS.DASHBOARD,
    PERMISSION_KEYS.PROJECTS,
    PERMISSION_KEYS.TASKS,
    PERMISSION_KEYS.APPROVALS,
    PERMISSION_KEYS.DAR,
    PERMISSION_KEYS.LEAVES,
    PERMISSION_KEYS.ATTENDANCE,
    PERMISSION_KEYS.TIMESHEET,
    PERMISSION_KEYS.MY_TEAM,
  ],
}

const PERMISSION_LABELS = {
  [PERMISSION_KEYS.DASHBOARD]: 'Dashboard',
  [PERMISSION_KEYS.PROJECTS]: 'Projects',
  [PERMISSION_KEYS.TASKS]: 'Tasks',
  [PERMISSION_KEYS.APPROVALS]: 'Approvals',
  [PERMISSION_KEYS.GANTT_CALENDAR]: 'Gantt / Calendar',
  [PERMISSION_KEYS.REPORTS]: 'Reports',
  [PERMISSION_KEYS.WORKFLOW_DIAGRAM]: 'Workflow Diagram',
  [PERMISSION_KEYS.ADMIN_SETTINGS]: 'Admin Settings',
  [PERMISSION_KEYS.DAR]: 'DAR (Daily Activity Report)',
  [PERMISSION_KEYS.LEAVES]: 'Leaves',
  [PERMISSION_KEYS.ATTENDANCE]: 'Attendance',
  [PERMISSION_KEYS.TIMESHEET]: 'Timesheet',
  [PERMISSION_KEYS.SALARY]: 'Salary',
  [PERMISSION_KEYS.REIMBURSEMENTS]: 'Reimbursements',
  [PERMISSION_KEYS.RESIGNATION]: 'Resignation',
  [PERMISSION_KEYS.HELPDESK]: 'Helpdesk',
  [PERMISSION_KEYS.MY_TEAM]: 'My Team',
}

const permissionService = {
  /**
   * Get permissions from backend API (real data).
   * Falls back to defaults if API fails.
   */
  async fetchPermissionsFromServer() {
    try {
      const { data } = await api.get('/permissions')
      const perms = data?.data || data
      if (perms && typeof perms === 'object') {
        localStorage.setItem('hrms_permissions', JSON.stringify(perms))
        return perms
      }
      return DEFAULT_PERMISSIONS
    } catch (e) {
      // Fallback to cached or defaults on error
      const stored = localStorage.getItem('hrms_permissions')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          // ignore
        }
      }
      return DEFAULT_PERMISSIONS
    }
  },

  /**
   * Update a single permission via API and return the updated matrix.
   */
  async updateRolePermission(role, permission, enabled) {
    const { data } = await api.post('/permissions/update', {
      role,
      permission,
      enabled,
    })
    const perms = data?.data || data
    if (perms && typeof perms === 'object') {
      localStorage.setItem('hrms_permissions', JSON.stringify(perms))
    }
    return perms
  },

  /**
   * Reset permissions for a role via API and return the updated matrix.
   */
  async resetRolePermissions(role) {
    const { data } = await api.post('/permissions/reset', { role })
    const perms = data?.data || data
    if (perms && typeof perms === 'object') {
      localStorage.setItem('hrms_permissions', JSON.stringify(perms))
    }
    return perms
  },

  getPermissionForRole: (role) => {
    const permissions = permissionService.getPermissions()
    if (!role) return []
    const normalizedRole = String(role).toLowerCase()
    return permissions[normalizedRole] || permissions[role] || []
  },

  hasPermission: (role, permission) => {
    if (!role || !permission) return false
    const normalizedRole = String(role).toLowerCase()
    // Admin / Super Admin always has all permissions
    if (normalizedRole === 'admin') {
      return true
    }
    const rolePermissions = permissionService.getPermissionForRole(normalizedRole)
    return rolePermissions.includes(permission)
  },

  updateRolePermission: (role, permission, enabled) => {
    const permissions = permissionService.getPermissions()
    if (!permissions[role]) {
      permissions[role] = []
    }
    
    if (enabled) {
      if (!permissions[role].includes(permission)) {
        permissions[role].push(permission)
      }
    } else {
      permissions[role] = permissions[role].filter((p) => p !== permission)
    }
    
    return permissionService.savePermissions(permissions)
  },

  getAllPermissions: () => {
    return Object.values(PERMISSION_KEYS)
  },

  getPermissionLabels: () => {
    return PERMISSION_LABELS
  },

  getRoles: () => {
    return ['admin', 'head_hr', 'hr', 'hod', 'employee', 'manager']
  },
}

export default permissionService
export { PERMISSION_KEYS, PERMISSION_LABELS }
