const { EmployeeInvoice, InvoiceEmployee, Company } = require('../models')
const { Op } = require('sequelize')
const { BadRequestError, NotFoundError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Invoice Employees
 * -----------------------------------------------------------------------------
 * Daily-wage workers and contractors who work for the company but are NOT
 * registered as HRMS users — no login, no employee code, no CTC. They submit an
 * invoice for the period they worked and are paid against it.
 *
 * Because they are not users, they are entirely outside payroll: nothing here
 * touches the users table or the salary structure. Their master record
 * (address, rates, bank details) lives in invoice_employees, and each bill they
 * raise is a row in employee_invoices.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const getMonthName = (m) => MONTH_NAMES[(parseInt(m, 10) || 1) - 1] || ''

const STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REJECTED']

const money = (v) => Math.round((Number(v) || 0) * 100) / 100

// Shape an invoice for the UI. DECIMAL columns come back from mysql2 as
// strings, so everything numeric is coerced here once.
const serializeInvoice = (row) => {
  const p = row.get ? row.get({ plain: true }) : row
  const e = p.invoiceEmployee || {}
  const c = p.company || {}
  return {
    id: p.id,
    invoiceEmployeeId: p.invoiceEmployeeId,
    employee: e.name || 'Unknown',
    // Bill-to party. The PDF falls back to its built-in block when the invoice
    // predates the company column, so every field here may legitimately be ''.
    companyId: p.companyId || null,
    companyName: c.companyName || '',
    companyAddress: c.address || '',
    companyCity: c.city || '',
    companyState: c.state || '',
    companyCountry: c.country || '',
    companyPostalCode: c.postalCode || '',
    companyRegistrationNumber: c.registrationNumber || '',
    companyTaxId: c.taxId || '',
    companyPhone: c.phone || '',
    companyEmail: c.email || '',
    workType: e.workType || '',
    address: e.address || '',
    phone: e.phone || '',
    bankName: e.bankName || '',
    bankSwift: e.bankSwift || '',
    accountNo: e.accountNo || '',
    iban: e.iban || '',
    invoiceNumber: p.invoiceNumber,
    invoiceDate: p.invoiceDate,
    month: p.month,
    year: p.year,
    monthYear: `${getMonthName(p.month)} ${p.year}`,
    periodFrom: p.periodFrom,
    periodTo: p.periodTo,
    particulars: p.particulars || '',
    vehicleNo: p.vehicleNo || '',
    monthlyGross: Number(p.monthlyGross || 0),
    workDays: Number(p.workDays || 0),
    baseAmount: Number(p.baseAmount || 0),
    overtimeRate: Number(p.overtimeRate || 0),
    overtimeHours: Number(p.overtimeHours || 0),
    overtimeAmount: Number(p.overtimeAmount || 0),
    currency: p.currency || 'QAR',
    totalAmount: Number(p.totalAmount || 0),
    status: p.status,
    paidOn: p.paidOn,
    remarks: p.remarks || '',
    createdAt: p.createdAt,
  }
}

const serializeEmployee = (row) => {
  const p = row.get ? row.get({ plain: true }) : row
  return {
    ...p,
    monthlyGross: p.monthlyGross == null ? null : Number(p.monthlyGross),
    overtimeRate: p.overtimeRate == null ? null : Number(p.overtimeRate),
  }
}

const employeeInclude = {
  model: InvoiceEmployee,
  as: 'invoiceEmployee',
  attributes: [
    'id', 'name', 'address', 'phone', 'workType',
    'bankName', 'bankSwift', 'accountNo', 'iban',
  ],
}

// The bill-to party printed at the top of the invoice. `required: false` keeps
// invoices with no company (raised before the column existed) in the results.
const companyInclude = {
  model: Company,
  as: 'company',
  required: false,
  attributes: [
    'id', 'companyName', 'address', 'city', 'state', 'country',
    'postalCode', 'registrationNumber', 'taxId', 'phone', 'email',
  ],
}

class InvoiceController {
  // ─── Invoice employees (the people) ──────────────────────────────

  /** GET /api/invoices/employees?includeInactive= */
  async getInvoiceEmployees(req, res, next) {
    try {
      const where = {}
      if (req.query.includeInactive !== 'true') where.isActive = true

      const rows = await InvoiceEmployee.findAll({ where, order: [['name', 'ASC']] })

      res.status(200).json({
        success: true,
        message: 'Invoice employees retrieved successfully',
        count: rows.length,
        data: rows.map(serializeEmployee),
      })
    } catch (error) {
      logger.error('Error in getInvoiceEmployees:', error)
      next(error)
    }
  }

  /** POST /api/invoices/employees */
  async createInvoiceEmployee(req, res, next) {
    try {
      const { name } = req.body
      if (!name || !String(name).trim()) throw new BadRequestError('Name is required')

      const row = await InvoiceEmployee.create({
        name: String(name).trim(),
        address: req.body.address || null,
        phone: req.body.phone || null,
        email: req.body.email || null,
        workType: req.body.workType || null,
        projectName: req.body.projectName || null,
        vehicleNo: req.body.vehicleNo || null,
        currency: req.body.currency || 'QAR',
        monthlyGross: req.body.monthlyGross == null ? null : money(req.body.monthlyGross),
        overtimeRate: req.body.overtimeRate == null ? null : money(req.body.overtimeRate),
        bankName: req.body.bankName || null,
        bankSwift: req.body.bankSwift || null,
        accountNo: req.body.accountNo || null,
        iban: req.body.iban || null,
        remarks: req.body.remarks || null,
      })

      logger.info(`Invoice employee created: ${row.name}`)

      res.status(201).json({
        success: true,
        message: 'Invoice employee added successfully',
        data: serializeEmployee(row),
      })
    } catch (error) {
      logger.error('Error in createInvoiceEmployee:', error)
      next(error)
    }
  }

  /** PUT /api/invoices/employees/:id */
  async updateInvoiceEmployee(req, res, next) {
    try {
      const row = await InvoiceEmployee.findByPk(req.params.id)
      if (!row) throw new NotFoundError('Invoice employee not found')

      const fields = [
        'name', 'address', 'phone', 'email', 'workType', 'projectName',
        'vehicleNo', 'currency', 'bankName', 'bankSwift', 'accountNo',
        'iban', 'remarks', 'isActive',
      ]
      const updates = {}
      fields.forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f] === '' ? null : req.body[f]
      })
      if (req.body.monthlyGross !== undefined) {
        updates.monthlyGross = req.body.monthlyGross == null ? null : money(req.body.monthlyGross)
      }
      if (req.body.overtimeRate !== undefined) {
        updates.overtimeRate = req.body.overtimeRate == null ? null : money(req.body.overtimeRate)
      }
      if (updates.name !== undefined && !String(updates.name || '').trim()) {
        throw new BadRequestError('Name cannot be empty')
      }

      await row.update(updates)

      res.status(200).json({
        success: true,
        message: 'Invoice employee updated successfully',
        data: serializeEmployee(row),
      })
    } catch (error) {
      logger.error('Error in updateInvoiceEmployee:', error)
      next(error)
    }
  }

  /** DELETE /api/invoices/employees/:id */
  async removeInvoiceEmployee(req, res, next) {
    try {
      const row = await InvoiceEmployee.findByPk(req.params.id)
      if (!row) throw new NotFoundError('Invoice employee not found')

      // Deleting would cascade their invoices away with them; make that an
      // explicit decision rather than a silent side effect.
      const invoiceCount = await EmployeeInvoice.count({ where: { invoiceEmployeeId: row.id } })
      if (invoiceCount > 0) {
        throw new BadRequestError(
          `${row.name} has ${invoiceCount} invoice(s) on record. Mark them inactive instead, or delete those invoices first.`
        )
      }

      await row.destroy()

      res.status(200).json({ success: true, message: 'Invoice employee deleted successfully' })
    } catch (error) {
      logger.error('Error in removeInvoiceEmployee:', error)
      next(error)
    }
  }

  // ─── Invoices ────────────────────────────────────────────────────

  /** GET /api/invoices?invoiceEmployeeId=&month=&year=&status= */
  async getAll(req, res, next) {
    try {
      const { invoiceEmployeeId, month, year, status } = req.query
      const where = {}
      if (invoiceEmployeeId) where.invoiceEmployeeId = parseInt(invoiceEmployeeId, 10)
      if (month) where.month = parseInt(month, 10)
      if (year) where.year = parseInt(year, 10)
      if (status && STATUSES.includes(status)) where.status = status

      const rows = await EmployeeInvoice.findAll({
        where,
        include: [employeeInclude, companyInclude],
        order: [['year', 'DESC'], ['month', 'DESC'], ['invoiceDate', 'DESC'], ['id', 'DESC']],
      })

      res.status(200).json({
        success: true,
        message: 'Invoices retrieved successfully',
        count: rows.length,
        data: rows.map(serializeInvoice),
      })
    } catch (error) {
      logger.error('Error in getAll invoices:', error)
      next(error)
    }
  }

  /** GET /api/invoices/:id */
  async getById(req, res, next) {
    try {
      const row = await EmployeeInvoice.findByPk(req.params.id, { include: [employeeInclude, companyInclude] })
      if (!row) throw new NotFoundError('Invoice not found')

      res.status(200).json({
        success: true,
        message: 'Invoice retrieved successfully',
        data: serializeInvoice(row),
      })
    } catch (error) {
      logger.error('Error in getById invoice:', error)
      next(error)
    }
  }

  /** POST /api/invoices */
  async create(req, res, next) {
    try {
      const {
        invoiceEmployeeId,
        companyId,
        invoiceNumber,
        invoiceDate,
        month,
        year,
      } = req.body

      if (!invoiceEmployeeId || !invoiceNumber || !invoiceDate || !month || !year) {
        throw new BadRequestError(
          'invoiceEmployeeId, invoiceNumber, invoiceDate, month and year are required'
        )
      }

      const m = parseInt(month, 10)
      const y = parseInt(year, 10)
      if (!(m >= 1 && m <= 12)) throw new BadRequestError('Month must be 1-12')
      if (!(y >= 2000 && y <= 2100)) throw new BadRequestError('Invalid year')

      const employee = await InvoiceEmployee.findByPk(invoiceEmployeeId)
      if (!employee) throw new NotFoundError('Invoice employee not found')

      // Optional, but a supplied id has to be real - a dangling company would
      // silently print an invoice with no bill-to block.
      if (companyId) {
        const company = await Company.findByPk(companyId)
        if (!company) throw new NotFoundError('Company not found')
      }

      const number = String(invoiceNumber).trim()
      const duplicate = await EmployeeInvoice.findOne({
        where: { invoiceEmployeeId: employee.id, invoiceNumber: number },
      })
      if (duplicate) {
        throw new BadRequestError(`Invoice ${number} already exists for ${employee.name}`)
      }

      const amounts = this.resolveAmounts(req.body)

      const row = await EmployeeInvoice.create({
        invoiceEmployeeId: employee.id,
        companyId: companyId || null,
        invoiceNumber: number,
        invoiceDate,
        month: m,
        year: y,
        periodFrom: req.body.periodFrom || null,
        periodTo: req.body.periodTo || null,
        particulars: req.body.particulars || null,
        vehicleNo: req.body.vehicleNo || employee.vehicleNo || null,
        currency: req.body.currency || employee.currency || 'QAR',
        ...amounts,
        status: STATUSES.includes(req.body.status) ? req.body.status : 'PENDING',
        paidOn: req.body.status === 'PAID' ? new Date() : null,
        remarks: req.body.remarks || null,
        createdBy: req.user?.id || null,
      })

      const created = await EmployeeInvoice.findByPk(row.id, { include: [employeeInclude, companyInclude] })

      logger.info(
        `Invoice ${number} recorded for ${employee.name} (${created.currency} ${amounts.totalAmount})`
      )

      res.status(201).json({
        success: true,
        message: 'Invoice recorded successfully',
        data: serializeInvoice(created),
      })
    } catch (error) {
      logger.error('Error in create invoice:', error)
      next(error)
    }
  }

  /** PUT /api/invoices/:id */
  async update(req, res, next) {
    try {
      const invoice = await EmployeeInvoice.findByPk(req.params.id)
      if (!invoice) throw new NotFoundError('Invoice not found')

      const updates = {}

      if (req.body.invoiceNumber !== undefined) {
        const number = String(req.body.invoiceNumber).trim()
        if (!number) throw new BadRequestError('Invoice number cannot be empty')
        if (number !== invoice.invoiceNumber) {
          const duplicate = await EmployeeInvoice.findOne({
            where: {
              invoiceEmployeeId: invoice.invoiceEmployeeId,
              invoiceNumber: number,
              id: { [Op.ne]: invoice.id },
            },
          })
          if (duplicate) throw new BadRequestError(`Invoice ${number} already exists for this person`)
        }
        updates.invoiceNumber = number
      }
      if (req.body.companyId !== undefined) {
        const companyId = req.body.companyId || null
        if (companyId) {
          const company = await Company.findByPk(companyId)
          if (!company) throw new NotFoundError('Company not found')
        }
        updates.companyId = companyId
      }
      if (req.body.invoiceDate !== undefined) updates.invoiceDate = req.body.invoiceDate
      if (req.body.month !== undefined) {
        const m = parseInt(req.body.month, 10)
        if (!(m >= 1 && m <= 12)) throw new BadRequestError('Month must be 1-12')
        updates.month = m
      }
      if (req.body.year !== undefined) {
        const y = parseInt(req.body.year, 10)
        if (!(y >= 2000 && y <= 2100)) throw new BadRequestError('Invalid year')
        updates.year = y
      }
      ;['periodFrom', 'periodTo', 'particulars', 'vehicleNo', 'currency', 'remarks'].forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f] === '' ? null : req.body[f]
      })

      // Recompute the money columns whenever any of them is touched, so the
      // stored total can never drift from the two lines that make it up.
      const amountKeys = [
        'monthlyGross', 'workDays', 'baseAmount',
        'overtimeRate', 'overtimeHours', 'overtimeAmount',
      ]
      if (amountKeys.some((k) => req.body[k] !== undefined)) {
        const merged = {}
        amountKeys.forEach((k) => {
          merged[k] = req.body[k] !== undefined ? req.body[k] : Number(invoice[k] || 0)
        })
        Object.assign(updates, this.resolveAmounts(merged))
      }

      if (req.body.status !== undefined) {
        if (!STATUSES.includes(req.body.status)) throw new BadRequestError('Invalid status')
        updates.status = req.body.status
        if (req.body.status === 'PAID' && invoice.status !== 'PAID') updates.paidOn = new Date()
        if (req.body.status !== 'PAID') updates.paidOn = null
      }

      await invoice.update(updates)

      const updated = await EmployeeInvoice.findByPk(invoice.id, { include: [employeeInclude, companyInclude] })

      res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: serializeInvoice(updated),
      })
    } catch (error) {
      logger.error('Error in update invoice:', error)
      next(error)
    }
  }

  /** DELETE /api/invoices/:id */
  async remove(req, res, next) {
    try {
      const invoice = await EmployeeInvoice.findByPk(req.params.id)
      if (!invoice) throw new NotFoundError('Invoice not found')

      await invoice.destroy()

      res.status(200).json({ success: true, message: 'Invoice deleted successfully' })
    } catch (error) {
      logger.error('Error in remove invoice:', error)
      next(error)
    }
  }

  /** GET /api/invoices/summary?month=&year= */
  async getSummary(req, res, next) {
    try {
      const { month, year } = req.query
      const where = {}
      if (month) where.month = parseInt(month, 10)
      if (year) where.year = parseInt(year, 10)

      const [rows, employeeCount] = await Promise.all([
        EmployeeInvoice.findAll({ where, attributes: ['totalAmount', 'status', 'currency'] }),
        InvoiceEmployee.count({ where: { isActive: true } }),
      ])

      const sum = (list) => list.reduce((t, r) => t + Number(r.totalAmount || 0), 0)
      const paid = rows.filter((r) => r.status === 'PAID')
      const pending = rows.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED')

      res.status(200).json({
        success: true,
        message: 'Invoice summary retrieved successfully',
        data: {
          invoiceEmployees: employeeCount,
          totalInvoices: rows.length,
          totalAmount: sum(rows),
          paidCount: paid.length,
          paidAmount: sum(paid),
          pendingCount: pending.length,
          pendingAmount: sum(pending),
          // Mixed-currency lists can't be totalled meaningfully; the UI shows
          // the figure only when every invoice in scope uses one currency.
          currencies: [...new Set(rows.map((r) => r.currency || 'QAR'))],
        },
      })
    } catch (error) {
      logger.error('Error in getSummary invoices:', error)
      next(error)
    }
  }

  /**
   * Work out the two invoice lines and the total.
   *
   * Base and overtime amounts are computed from their rate x quantity, but an
   * explicitly supplied amount wins — the paper invoices round the overtime
   * line (8.33 x 120 = 999.60 is billed as 1,000.00), and the printed figure is
   * what the worker is actually paid.
   */
  resolveAmounts(body = {}) {
    const monthlyGross = money(body.monthlyGross)
    const workDays = money(body.workDays)
    const overtimeRate = money(body.overtimeRate)
    const overtimeHours = money(body.overtimeHours)

    const baseAmount =
      body.baseAmount != null && body.baseAmount !== ''
        ? money(body.baseAmount)
        : monthlyGross
    const overtimeAmount =
      body.overtimeAmount != null && body.overtimeAmount !== ''
        ? money(body.overtimeAmount)
        : money(overtimeRate * overtimeHours)

    if (baseAmount < 0 || overtimeAmount < 0) {
      throw new BadRequestError('Amounts cannot be negative')
    }
    const totalAmount = money(baseAmount + overtimeAmount)
    if (totalAmount <= 0) {
      throw new BadRequestError('Invoice total must be greater than 0')
    }

    return {
      monthlyGross,
      workDays,
      baseAmount,
      overtimeRate,
      overtimeHours,
      overtimeAmount,
      totalAmount,
    }
  }
}

const controller = new InvoiceController()

// Bind so `this.resolveAmounts` still resolves when Express calls the handlers
// detached from the instance.
module.exports = new Proxy(controller, {
  get(target, prop) {
    const value = target[prop]
    return typeof value === 'function' ? value.bind(target) : value
  },
})
