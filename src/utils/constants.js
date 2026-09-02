export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR: 'hr',
  // Project Management Roles
  ADMIN: 'admin',
  HEAD_HR: 'head_hr',
  HOD: 'hod',
}

export const PROJECT_ROLES = {
  ADMIN: 'admin',
  HEAD_HR: 'head_hr',
  HR: 'hr',
  HOD: 'hod',
  EMPLOYEE: 'employee',
}

export const APPROVAL_HIERARCHY = [
  PROJECT_ROLES.EMPLOYEE,
  PROJECT_ROLES.HOD,
  PROJECT_ROLES.HR,
  PROJECT_ROLES.HEAD_HR,
  PROJECT_ROLES.ADMIN,
]

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  HOD_REVIEW: 'hod_review',
  HR_REVIEW: 'hr_review',
  HEAD_HR_REVIEW: 'head_hr_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  REVIEW: 'review',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  REOPENED: 'reopened',
}

export const APPROVAL_ACTION = {
  APPROVE: 'approve',
  REJECT: 'reject',
  SEND_BACK: 'send_back',
  ESCALATE: 'escalate',
}

// API base URL - uses env variable, falls back to local dev server
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

/** Base URL for storage/uploads - images served from backend */
export const STORAGE_BASE_URL =
  import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:5000'

/** Get company logo URL */
export const getCompanyLogoUrl = (companyId) => {
  if (!companyId) return null
  const base =
    (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api')
      .replace(/\/api\/?$/, '') || 'http://localhost:5000'
  return `${base}/api/companies/${companyId}/logo`
}

/** Convert storage path (e.g. /storage/companies/logos/x.png) to full URL for display */
export const getStorageUrl = (path) => {
  if (!path || typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  // If just filename (e.g. logo-xxx.png), assume company logo path
  const normalizedPath = trimmed.includes('/')
    ? (trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
    : `/storage/companies/logos/${trimmed}`
  return `${STORAGE_BASE_URL}${normalizedPath}`
}

export const STORAGE_KEYS = {
  TOKEN: 'hrms_token',
  USER: 'hrms_user',
}

export const DATE_FORMAT = 'DD/MM/YYYY'
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm:ss'
// ISO format for API calls (do not change)
export const DATE_FORMAT_API = 'YYYY-MM-DD'
