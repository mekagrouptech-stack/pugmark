/**
 * Salary Structure Calculator
 * -----------------------------------------------------------------------------
 * Single source of truth for the company CTC salary breakup. There are two
 * variants driven by a single flag:
 *   - withoutPF (pfEnabled = false): Employer/Employee PF = 0, Gratuity applies
 *   - withPF    (pfEnabled = true) : Employer/Employee PF = ₹1,800 (12% of the
 *                                     ₹15,000 statutory wage ceiling), Gratuity applies
 *
 * Earnings are a fixed split of Gross Salary:
 *   Basic 50%, HRA 25%, Special Allowance 15%, Bonus 10%  (CCA/Conveyance/Education 0%)
 *
 * Gratuity   = 4.81% of Basic  (= 2.405% of Gross, since Basic = 50% of Gross)
 * Total CTC  = Gross + Gratuity + Employer PF
 * Take Home  = Gross - Employee PF - Professional Tax - TDS
 *
 * TDS is a MANUAL monthly figure (users.monthly_tds) and applies only when
 * annual CTC is above ₹12,00,000. At or below that threshold it is neither
 * collected nor deducted, and the UI hides the input entirely.
 *
 * The input is Monthly CTC (Total CTC). We reverse it to Gross:
 *   Total CTC = Gross * (1 + 0.02405) + EmployerPF
 *   => Gross  = (Total CTC - EmployerPF) / 1.02405
 */

// TDS only applies once ANNUAL CTC crosses ₹12,00,000 — below that the new-regime
// rebate leaves nothing to deduct, so the TDS input is hidden and any stored
// figure is ignored rather than applied.
const TDS_ANNUAL_THRESHOLD = 1200000

const PF_MONTHLY = 1800 // 12% of ₹15,000 statutory ceiling
const PT_MONTHLY = 200 // Professional Tax per month
const PT_ANNUAL = 2500 // Professional Tax per year (Maharashtra: ₹200×11 + ₹300)
const GRATUITY_RATE_OF_BASIC = 0.0481 // 4.81% of Basic
const GRATUITY_RATE_OF_GROSS = GRATUITY_RATE_OF_BASIC * 0.5 // 2.405% of Gross

// Earnings as a percentage of Gross Salary (must total 100%).
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

/**
 * Compute the full salary structure from a Monthly CTC figure.
 * @param {number} monthlyCTC - users.monthly_salary (treated as Monthly Total CTC)
 * @param {boolean} pfEnabled - true = with-PF variant, false = without-PF variant
 * @returns {object} full structure with monthly + annual figures
 */
function computeSalaryStructure(monthlyCTC, pfEnabled = false, monthlyTds = 0) {
  const ctc = Math.max(0, Number(monthlyCTC) || 0)
  const withPF = !!pfEnabled
  // Manual monthly TDS. It cannot be derived from CTC (it depends on the
  // employee's investment declarations and chosen tax regime), so HR enters it
  // per employee on the salary structure screen — but only for employees whose
  // annual CTC is above the ₹12,00,000 threshold.
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
  const netSalary = gross - employeePF - professionalTax // Net (Before TDS)
  // TDS is only meaningful once there is a salary to deduct it from, and can
  // never push take-home below zero.
  const tdsApplied = gross > 0 ? Math.min(tds, netSalary) : 0
  const takeHome = netSalary - tdsApplied // Take Home (After TDS)

  const M = (v) => round(v)
  const A = (v) => round(v) * 12

  return {
    pfEnabled: withPF,
    monthlyCTC: round(ctc),
    annualCTC: round(ctc) * 12,

    // Headline boxes (as in the sheet)
    employerPFPerMonth: employerPF,
    employeePFPerMonth: employeePF,
    gratuityPerMonth: gratuity,
    ptPerMonth: professionalTax,
    grossMonthly: gross,

    // Earnings table: each row has percent, monthly, annual
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

    // Net / take-home table
    tdsApplicable,
    tdsThresholdAnnual: TDS_ANNUAL_THRESHOLD,
    tdsPerMonth: tdsApplied,
    net: {
      grossSalary: { monthly: M(gross), annual: A(gross) },
      employeePF: { monthly: M(employeePF), annual: A(employeePF) },
      professionalTax: { monthly: professionalTax, annual: gross > 0 ? PT_ANNUAL : 0 },
      netSalary: { monthly: M(netSalary), annual: A(gross) - A(employeePF) - (gross > 0 ? PT_ANNUAL : 0) },
      tds: { monthly: tdsApplied, annual: A(tdsApplied) },
      takeHome: {
        monthly: M(takeHome),
        annual: A(gross) - A(employeePF) - (gross > 0 ? PT_ANNUAL : 0) - A(tdsApplied),
      },
    },
    takeHomeMonthly: M(takeHome),
    netBeforeTdsMonthly: M(netSalary),

    // Flat fields kept for backward compatibility with old callers
    basic: M(basic),
    hra: M(hra),
    allowances: M(specialAllowance + cca + conveyance + education + bonus),
    deductions: M(employeePF + professionalTax + tdsApplied),
    netSalaryFlat: M(takeHome),
  }
}

const PF_RATE = 0.12 // Employee/Employer PF rate applied to Basic

/**
 * Apply attendance proration to the salary structure for one pay period.
 *
 * Proration policy (standard Indian payroll):
 *   - Earnings (Basic, HRA, Special, CCA, Conveyance, Education, Bonus) scale
 *     by payableDays / totalWorkingDays.
 *   - Professional Tax is a flat statutory amount — NOT prorated.
 *   - Manual TDS is a fixed monthly figure — NOT prorated, and capped so the
 *     net payable never goes negative.
 *   - Employee/Employer PF = 12% of the EARNED Basic, capped at ₹1,800 (12% of
 *     the ₹15,000 statutory ceiling), so a part-paid month pays proportionate PF
 *     while a full month still lands on the ceiling.
 *   - Gratuity is 4.81% of the earned Basic.
 *
 * @param {number} monthlyCTC - users.monthly_salary (Monthly Total CTC)
 * @param {boolean} pfEnabled - with-PF variant
 * @param {object} attendance - { payableDays, totalWorkingDays }
 * @returns {object} the full structure plus an `earned` block for this period
 */
function computePayrollStructure(monthlyCTC, pfEnabled, attendance = {}, monthlyTds = 0) {
  const structure = computeSalaryStructure(monthlyCTC, pfEnabled, monthlyTds)

  const totalWorkingDays = Number(attendance.totalWorkingDays) || 0
  const payableDays = Number(attendance.payableDays) || 0
  // No working days configured => treat the month as fully paid rather than
  // wiping the salary to zero.
  const ratio =
    totalWorkingDays > 0 ? Math.min(1, Math.max(0, payableDays / totalWorkingDays)) : 1

  const pick = (key) => structure.earnings.find((e) => e.key === key)?.monthly || 0
  const prorate = (v) => round(v * ratio)

  const basic = prorate(pick('basic'))
  const hra = prorate(pick('hra'))
  const specialAllowance = prorate(pick('specialAllowance'))
  const cca = prorate(pick('cca'))
  const conveyance = prorate(pick('conveyance'))
  const education = prorate(pick('education'))
  const bonus = prorate(pick('bonus'))

  const grossEarned = basic + hra + specialAllowance + cca + conveyance + education + bonus

  // PF follows the earned Basic but never exceeds the statutory ceiling amount.
  const pfOnBasic = Math.min(PF_MONTHLY, round(basic * PF_RATE))
  const employeePF = pfEnabled ? pfOnBasic : 0
  const employerPF = pfEnabled ? pfOnBasic : 0

  // Professional Tax is flat — charged in full whenever anything is payable.
  const professionalTax = grossEarned > 0 ? PT_MONTHLY : 0

  // TDS is a fixed monthly figure entered by HR, so like Professional Tax it is
  // NOT prorated by attendance. It is capped at what remains after the other
  // deductions so a low-attendance month can never produce a negative payout.
  // Below the ₹12,00,000 annual-CTC threshold no TDS is deducted at all.
  const tdsRequested = structure.tdsApplicable ? Math.max(0, round(monthlyTds)) : 0
  const tds =
    grossEarned > 0 ? Math.min(tdsRequested, Math.max(0, grossEarned - employeePF - professionalTax)) : 0

  const gratuity = round(basic * GRATUITY_RATE_OF_BASIC)
  const totalEarnings = grossEarned
  const totalDeductions = employeePF + professionalTax + tds
  const netPayable = totalEarnings - totalDeductions

  return {
    ...structure,
    earned: {
      ratio,
      payableDays,
      totalWorkingDays,
      basic,
      hra,
      specialAllowance,
      cca,
      conveyance,
      education,
      bonus,
      grossEarned,
      employeePF,
      employerPF,
      professionalTax,
      tds,
      gratuity,
      totalEarnings,
      totalDeductions,
      netPayable,
      totalCTC: grossEarned + gratuity + employerPF,
    },
  }
}

module.exports = {
  computeSalaryStructure,
  computePayrollStructure,
  PF_MONTHLY,
  PF_RATE,
  PT_MONTHLY,
  PT_ANNUAL,
  TDS_ANNUAL_THRESHOLD,
  GRATUITY_RATE_OF_BASIC,
  EARNING_PERCENTS,
}
