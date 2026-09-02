/**
 * Salary structure — client-side PREVIEW calculator.
 *
 * A line-for-line mirror of backend/utils/salaryStructure.js so the tables can
 * update live while HR types a new Monthly CTC, before anything is saved.
 *
 * The backend stays the source of truth: on save the structure is reloaded from
 * /api/salary/structure/:userId and the preview is discarded. This exists only
 * so the figures react as you type — nothing computed here is ever persisted or
 * used for an actual payroll run.
 *
 * If the constants below are changed, change them in the backend file too or
 * the preview will disagree with what saving actually produces.
 */

// TDS applies only above ₹12,00,000 annual CTC — mirror of the backend rule.
export const TDS_ANNUAL_THRESHOLD = 1200000

const PF_MONTHLY = 1800 // 12% of ₹15,000 statutory ceiling
const PT_MONTHLY = 200 // Professional Tax per month
const PT_ANNUAL = 2500 // Professional Tax per year (Maharashtra: ₹200×11 + ₹300)
const GRATUITY_RATE_OF_BASIC = 0.0481 // 4.81% of Basic
const GRATUITY_RATE_OF_GROSS = GRATUITY_RATE_OF_BASIC * 0.5 // 2.405% of Gross

const EARNING_PERCENTS = {
  basic: 50,
  hra: 25,
  specialAllowance: 15,
  cca: 0,
  conveyance: 0,
  education: 0,
  bonus: 10,
}

const round = (n) => Math.round(Number(n) || 0)

export function computeSalaryStructure(monthlyCTC, pfEnabled = false, monthlyTds = 0) {
  const ctc = Math.max(0, Number(monthlyCTC) || 0)
  const withPF = !!pfEnabled
  const tdsApplicable = ctc * 12 > TDS_ANNUAL_THRESHOLD
  const tds = tdsApplicable ? Math.max(0, round(monthlyTds)) : 0

  const employerPF = withPF ? PF_MONTHLY : 0
  const employeePF = withPF ? PF_MONTHLY : 0

  // Reverse Total CTC back to Gross Salary.
  const gross = ctc > 0 ? round((ctc - employerPF) / (1 + GRATUITY_RATE_OF_GROSS)) : 0

  const basic = round(gross * (EARNING_PERCENTS.basic / 100))
  const hra = round(gross * (EARNING_PERCENTS.hra / 100))
  const specialAllowance = round(gross * (EARNING_PERCENTS.specialAllowance / 100))
  const cca = round(gross * (EARNING_PERCENTS.cca / 100))
  const conveyance = round(gross * (EARNING_PERCENTS.conveyance / 100))
  const education = round(gross * (EARNING_PERCENTS.education / 100))
  const bonus = round(gross * (EARNING_PERCENTS.bonus / 100))

  const gratuity = gross > 0 ? round(basic * GRATUITY_RATE_OF_BASIC) : 0
  const totalCTC = gross + gratuity + employerPF

  const professionalTax = gross > 0 ? PT_MONTHLY : 0
  const netSalary = gross - employeePF - professionalTax
  const tdsApplied = gross > 0 ? Math.min(tds, netSalary) : 0
  const takeHome = netSalary - tdsApplied

  const M = (v) => round(v)
  const A = (v) => round(v) * 12

  return {
    pfEnabled: withPF,
    monthlyCTC: round(ctc),
    annualCTC: round(ctc) * 12,

    employerPFPerMonth: employerPF,
    employeePFPerMonth: employeePF,
    gratuityPerMonth: gratuity,
    ptPerMonth: professionalTax,
    grossMonthly: gross,

    earnings: [
      { key: 'basic', label: 'Basic', percent: EARNING_PERCENTS.basic, monthly: M(basic), annual: A(basic) },
      { key: 'hra', label: 'HRA', percent: EARNING_PERCENTS.hra, monthly: M(hra), annual: A(hra) },
      { key: 'specialAllowance', label: 'Special Allowance', percent: EARNING_PERCENTS.specialAllowance, monthly: M(specialAllowance), annual: A(specialAllowance) },
      { key: 'cca', label: 'CCA', percent: EARNING_PERCENTS.cca, monthly: M(cca), annual: A(cca) },
      { key: 'conveyance', label: 'Conveyance', percent: EARNING_PERCENTS.conveyance, monthly: M(conveyance), annual: A(conveyance) },
      { key: 'education', label: 'Education', percent: EARNING_PERCENTS.education, monthly: M(education), annual: A(education) },
      { key: 'bonus', label: 'Bonus', percent: EARNING_PERCENTS.bonus, monthly: M(bonus), annual: A(bonus) },
    ],

    grossSalary: { monthly: M(gross), annual: A(gross) },
    gratuity: { monthly: M(gratuity), annual: A(gratuity) },
    employerPF: { monthly: M(employerPF), annual: A(employerPF) },
    totalCTCRow: { monthly: M(totalCTC), annual: A(totalCTC) },

    tdsApplicable,
    tdsThresholdAnnual: TDS_ANNUAL_THRESHOLD,
    tdsPerMonth: tdsApplied,
    net: {
      grossSalary: { monthly: M(gross), annual: A(gross) },
      employeePF: { monthly: M(employeePF), annual: A(employeePF) },
      professionalTax: { monthly: professionalTax, annual: gross > 0 ? PT_ANNUAL : 0 },
      netSalary: {
        monthly: M(netSalary),
        annual: A(gross) - A(employeePF) - (gross > 0 ? PT_ANNUAL : 0),
      },
      tds: { monthly: tdsApplied, annual: A(tdsApplied) },
      takeHome: {
        monthly: M(takeHome),
        annual: A(gross) - A(employeePF) - (gross > 0 ? PT_ANNUAL : 0) - A(tdsApplied),
      },
    },
    takeHomeMonthly: M(takeHome),
    netBeforeTdsMonthly: M(netSalary),
  }
}

/**
 * Preview structure for an unsaved CTC / PF change.
 *
 * Keeps the employee block from the saved structure so the banner still shows
 * who it belongs to, and returns null when nothing has actually changed — the
 * caller then falls back to the saved structure from the server.
 */
export function buildPreviewStructure(savedStructure, monthlyCTC, pfEnabled, monthlyTds = 0) {
  const saved = savedStructure || {}
  const unchanged =
    Number(monthlyCTC || 0) === Number(saved.monthlyCTC || 0) &&
    !!pfEnabled === !!saved.pfEnabled &&
    Number(monthlyTds || 0) === Number(saved.tdsPerMonth || 0)
  if (unchanged) return null

  return {
    ...computeSalaryStructure(monthlyCTC, pfEnabled, monthlyTds),
    employee: saved.employee,
  }
}
