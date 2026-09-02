/**
 * Profile ("account") completion scoring.
 *
 * One definition of what a fully-filled employee record looks like, shared by
 * every surface that reports completion — the team list, the user APIs and the
 * profile page — so the same employee never shows two different percentages.
 *
 * Only fields that apply to EVERY employee are scored. Conditional fields are
 * deliberately excluded, because counting them would cap unmarried staff, people
 * still on probation, or anyone without a passport below 100% forever:
 *   - spouseName / dateOfMarriage  → only when married
 *   - passportNumber               → not everyone holds one
 *   - confirmationDate             → only after probation ends
 *   - lastWorkingDate              → only on exit
 */

/**
 * Scored sections, in the order the profile page presents them. `path` is the
 * association name on the User instance ('' = a column on users itself).
 */
const SECTIONS = [
  {
    key: 'account',
    label: 'Account',
    path: '',
    fields: [
      ['name', 'Name'],
      ['email', 'Email'],
      ['employeeCode', 'Employee code'],
      ['department', 'Department'],
      ['designation', 'Designation'],
      ['companyId', 'Company'],
    ],
  },
  {
    key: 'basic',
    label: 'Basic information',
    path: 'basicInformation',
    fields: [
      ['avatar', 'Photo'],
      ['gender', 'Gender'],
      ['dateOfBirth', 'Date of birth'],
      ['bloodGroup', 'Blood group'],
    ],
  },
  {
    key: 'personal',
    label: 'Personal information',
    path: 'personalInformation',
    fields: [
      ['fathersName', "Father's name"],
      ['mothersName', "Mother's name"],
      ['placeOfBirth', 'Place of birth'],
      ['maritalStatus', 'Marital status'],
      ['aadhaarNumber', 'Aadhaar number'],
      ['panNumber', 'PAN number'],
    ],
  },
  {
    key: 'contact',
    label: 'Contact information',
    path: 'contactInformation',
    fields: [
      ['mobileNo', 'Mobile number'],
      ['personalEmailId', 'Personal email'],
      ['address', 'Address'],
      ['cityTown', 'City / town'],
      ['pinCode', 'PIN code'],
      ['state', 'State'],
      ['emergencyContactPerson', 'Emergency contact'],
      ['emergencyContactMobileNo', 'Emergency contact number'],
    ],
  },
  {
    key: 'educational',
    label: 'Educational information',
    path: 'educationalInformation',
    fields: [
      ['highestQualification', 'Highest qualification'],
      ['qualificationName', 'Qualification name'],
      ['yearOfPassing', 'Year of passing'],
    ],
  },
  {
    key: 'employment',
    label: 'Employment information',
    path: 'employmentInformation',
    fields: [
      ['dateOfJoining', 'Date of joining'],
      ['employmentStatus', 'Employment status'],
      ['workLocation', 'Work location'],
      ['noticePeriod', 'Notice period'],
    ],
  },
]

/** A value counts as filled only if it carries real content. */
function isFilled(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

/** Total number of scored fields, plus the documents check. */
const TOTAL_FIELDS = SECTIONS.reduce((sum, s) => sum + s.fields.length, 0) + 1

/**
 * Score one user's record.
 *
 * Accepts a Sequelize User instance or a plain object; associations that were
 * not loaded simply score as empty, so a caller that skips an include gets a
 * lower percentage rather than a crash.
 *
 * @param {Object} user user with profile associations attached
 * @returns {{percentage:number, filled:number, total:number, missing:string[],
 *            sections:Array<{key:string,label:string,filled:number,total:number,missing:string[]}>}}
 */
function computeProfileCompletion(user) {
  const plain = user && typeof user.get === 'function' ? user.get({ plain: true }) : user || {}

  let filled = 0
  const missing = []
  const sections = []

  SECTIONS.forEach((section) => {
    const source = section.path ? plain[section.path] || {} : plain
    let sectionFilled = 0
    const sectionMissing = []

    section.fields.forEach(([field, label]) => {
      if (isFilled(source[field])) {
        sectionFilled += 1
      } else {
        sectionMissing.push(label)
      }
    })

    filled += sectionFilled
    missing.push(...sectionMissing)
    sections.push({
      key: section.key,
      label: section.label,
      filled: sectionFilled,
      total: section.fields.length,
      missing: sectionMissing,
    })
  })

  // Documents are pass/fail rather than per-field: any uploaded document counts.
  const hasDocuments = Array.isArray(plain.documents)
    ? plain.documents.length > 0
    : Number(plain.documentCount || 0) > 0
  if (hasDocuments) {
    filled += 1
  } else {
    missing.push('Documents')
  }
  sections.push({
    key: 'documents',
    label: 'Documents',
    filled: hasDocuments ? 1 : 0,
    total: 1,
    missing: hasDocuments ? [] : ['At least one uploaded document'],
  })

  return {
    percentage: Math.round((filled / TOTAL_FIELDS) * 100),
    filled,
    total: TOTAL_FIELDS,
    missing,
    sections,
  }
}

module.exports = {
  computeProfileCompletion,
  SECTIONS,
  TOTAL_FIELDS,
}
