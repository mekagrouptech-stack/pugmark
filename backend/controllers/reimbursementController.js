const { ReimbursementRequest, ReimbursementExpenseItem, User } = require('../models')
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors')
const logger = require('../utils/logger')

/** Format createdAt to YYYY-MM-DD (handles Date or string from MySQL dateStrings) */
function formatCreatedOn(val) {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  const s = String(val)
  return s.slice(0, 10) || null
}

/**
 * Map DB request to API shape for "my requests" list
 */
function mapMyRequest(req) {
  return {
    id: req.id,
    requestType: req.requestType,
    periodFrom: req.periodFrom,
    periodTo: req.periodTo,
    totalAmount: parseFloat(req.totalAmount) || 0,
    status: req.status,
    pendingFrom: req.status === 'Pending' ? 'Manager' : '-',
    createdOn: formatCreatedOn(req.createdAt),
    expenseDetails: (req.expenseDetails || []).map((d) => ({
      type: d.type,
      date: d.expenseDate,
      amount: parseFloat(d.amount) || 0,
      purpose: d.purpose,
    })),
  }
}

/**
 * Map DB request to API shape for "team" list (admin/manager view)
 */
function mapTeamRequest(req) {
  const user = req.user
  return {
    id: req.id,
    requestType: req.requestType,
    userName: user ? user.name : '-',
    employeeCode: user ? user.employeeCode : '-',
    totalAmount: parseFloat(req.totalAmount) || 0,
    status: req.status,
    createdOn: formatCreatedOn(req.createdAt),
    approver: req.user ? req.user.name : '-',
    periodFrom: req.periodFrom,
    periodTo: req.periodTo,
    rejectionReason: req.rejectionReason,
    expenseDetails: (req.expenseDetails || []).map((d) => ({
      type: d.type,
      date: d.expenseDate,
      amount: parseFloat(d.amount) || 0,
      purpose: d.purpose,
    })),
  }
}

class ReimbursementController {
  /**
   * Create reimbursement request
   * POST /api/reimbursements
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id
      const { requestType, periodFrom, periodTo, totalAmount, expenseDetails } = req.body

      if (!requestType || !periodFrom || !periodTo || totalAmount == null) {
        throw new BadRequestError('requestType, periodFrom, periodTo and totalAmount are required')
      }

      const request = await ReimbursementRequest.create({
        userId,
        requestType,
        periodFrom,
        periodTo,
        totalAmount: totalAmount || 0,
        status: 'Pending',
      })

      if (Array.isArray(expenseDetails) && expenseDetails.length > 0) {
        await ReimbursementExpenseItem.bulkCreate(
          expenseDetails.map((d) => ({
            reimbursementRequestId: request.id,
            type: d.type || null,
            expenseDate: d.date || null,
            amount: d.amount != null ? d.amount : 0,
            purpose: d.purpose || null,
            proofUrl: d.proofUrl || null,
          }))
        )
      }

      const created = await ReimbursementRequest.findByPk(request.id, {
        include: [{ model: ReimbursementExpenseItem, as: 'expenseDetails' }],
      })

      res.status(201).json({
        id: created.id,
        ...req.body,
        status: 'Pending',
        createdOn: formatCreatedOn(created.createdAt) || new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * Get my reimbursement requests
   * GET /api/reimbursements
   */
  async getMyRequests(req, res, next) {
    try {
      const userId = req.user.id
      const { status } = req.query

      const where = { userId }
      if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
        where.status = status
      }

      const requests = await ReimbursementRequest.findAll({
        where,
        include: [{ model: ReimbursementExpenseItem, as: 'expenseDetails' }],
        order: [['createdAt', 'DESC']],
      })

      res.json(requests.map(mapMyRequest))
    } catch (err) {
      next(err)
    }
  }

  /**
   * Get team/pending requests (for admin/manager approval)
   * GET /api/reimbursements/team
   */
  async getTeamRequests(req, res, next) {
    try {
      const { status } = req.query

      const where = {}
      if (status && status !== 'all' && ['Pending', 'Approved', 'Rejected'].includes(status)) {
        where.status = status
      }

      const requests = await ReimbursementRequest.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'employeeCode'] },
          { model: ReimbursementExpenseItem, as: 'expenseDetails' },
        ],
        order: [['createdAt', 'DESC']],
      })

      const list = requests.map((r) => {
        const plain = r.toJSON()
        return mapTeamRequest({
          ...r,
          user: plain.user,
          expenseDetails: plain.expenseDetails || [],
        })
      })

      res.json(list)
    } catch (err) {
      next(err)
    }
  }

  /**
   * Approve reimbursement
   * PATCH /api/reimbursements/:id/approve
   */
  async approve(req, res, next) {
    try {
      const { id } = req.params
      const approverId = req.user.id

      const request = await ReimbursementRequest.findByPk(id)
      if (!request) throw new NotFoundError('Reimbursement request not found')
      if (request.status !== 'Pending') {
        throw new BadRequestError('Only pending requests can be approved')
      }

      await request.update({
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: null,
      })

      res.json({ success: true, message: 'Reimbursement approved successfully' })
    } catch (err) {
      next(err)
    }
  }

  /**
   * Reject reimbursement
   * PATCH /api/reimbursements/:id/reject
   */
  async reject(req, res, next) {
    try {
      const { id } = req.params
      const { rejectionReason } = req.body

      const request = await ReimbursementRequest.findByPk(id)
      if (!request) throw new NotFoundError('Reimbursement request not found')
      if (request.status !== 'Pending') {
        throw new BadRequestError('Only pending requests can be rejected')
      }

      await request.update({
        status: 'Rejected',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
      })

      res.json({ success: true, message: 'Reimbursement rejected' })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new ReimbursementController()
