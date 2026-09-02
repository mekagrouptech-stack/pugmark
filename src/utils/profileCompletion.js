/**
 * Profile completeness helpers used by the My Profile page.
 *
 * Completion is measured only over the fields the signed-in user can actually
 * fill in, so the number stays actionable:
 *  - Employment Information is HR-owned data, so the whole group is skipped.
 *  - Any field rendered read-only (config.disabled) is skipped as well.
 *  - Marriage details only count once the employee is marked as Married.
 */

export const COMPLETION_EXCLUDED_GROUPS = ['employmentInformation']
export const MARRIED_ONLY_FIELDS = ['spouseName', 'dateOfMarriage']

export const isFieldFilled = (value) => {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim() !== ''
  return true
}

const countableFields = (fields, { maritalStatus, fieldConfigs }) =>
  fields.filter((field) => {
    if (fieldConfigs?.[field]?.disabled) return false
    if (maritalStatus !== 'Married' && MARRIED_ONLY_FIELDS.includes(field)) return false
    return true
  })

/**
 * @param {Object} profileData grouped profile payload from the API
 * @param {Array}  groups      the same group descriptors the page renders
 * @param {Object} fieldConfigs field config map, used to skip read-only fields
 * @returns {{filled: number, total: number, percent: number, perGroup: Object}}
 */
export const computeProfileCompletion = (profileData, groups, fieldConfigs = {}) => {
  const data = profileData || {}
  const maritalStatus = data.personalInformation?.maritalStatus
  const perGroup = {}
  let filled = 0
  let total = 0

  groups.forEach((group) => {
    if (COMPLETION_EXCLUDED_GROUPS.includes(group.groupName)) return

    const fields = countableFields(group.fields, { maritalStatus, fieldConfigs })
    const groupData = data[group.groupName] || {}
    const missing = fields.filter((field) => !isFieldFilled(groupData[field]))
    const groupFilled = fields.length - missing.length

    perGroup[group.groupName] = {
      title: group.title,
      filled: groupFilled,
      total: fields.length,
      percent: fields.length ? Math.round((groupFilled / fields.length) * 100) : 100,
      missing,
    }

    filled += groupFilled
    total += fields.length
  })

  return {
    filled,
    total,
    percent: total ? Math.round((filled / total) * 100) : 0,
    perGroup,
  }
}

export const completionColor = (percent) => {
  if (percent >= 100) return '#52c41a'
  if (percent >= 60) return '#1677ff'
  if (percent >= 30) return '#faad14'
  return '#ff4d4f'
}
