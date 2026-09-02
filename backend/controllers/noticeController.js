const path = require('path')
const fs = require('fs')
const { Op } = require('sequelize')
const { sequelize, Notice, NoticeRecipient, User } = require('../models')
const { getStoragePath } = require('../middleware/upload')
const { sendEmail } = require('../utils/emailSender')
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors')
const logger = require('../utils/logger')

const SENDER_ROLES = ['ADMIN', 'HEAD_HR', 'HR']

const isSender = (user) => SENDER_ROLES.includes(String(user?.role || '').toUpperCase())

// Remove an uploaded attachment file from disk (used on validation failure).
const cleanupFile = (file) => {
  if (file && file.path) {
    fs.promises.unlink(file.path).catch(() => {})
  }
}

class NoticeController {
  /**
   * Create + broadcast an important notice.
   * POST /api/notices  (multipart/form-data, optional field "attachment" = PDF)
   * Body: title, message, priority, audience ('all'|'specific'), userIds (JSON array or CSV)
   */
  async createNotice(req, res, next) {
    const t = await sequelize.transaction()
    try {
      if (!isSender(req.user)) {
        cleanupFile(req.file)
        await t.rollback()
        return next(new ForbiddenError('You are not allowed to send notices'))
      }

      const { title, message, priority, audience } = req.body
      if (!title || !title.trim() || !message || !message.trim()) {
        cleanupFile(req.file)
        await t.rollback()
        throw new BadRequestError('Title and message are required')
      }

      const finalAudience = audience === 'specific' ? 'specific' : 'all'
      const finalPriority = ['normal', 'important', 'urgent'].includes(priority)
        ? priority
        : 'important'

      // Resolve the target user ids.
      let userIds = []
      if (finalAudience === 'specific') {
        let raw = req.body.userIds
        if (typeof raw === 'string') {
          try {
            raw = JSON.parse(raw)
          } catch {
            raw = raw.split(',')
          }
        }
        userIds = (Array.isArray(raw) ? raw : [raw])
          .map((v) => parseInt(v, 10))
          .filter((v) => v && !Number.isNaN(v))
        if (userIds.length === 0) {
          cleanupFile(req.file)
          await t.rollback()
          throw new BadRequestError('Select at least one employee for a specific notice')
        }
      }

      // The JWT does not carry companyId, so read it from the sender's record
      // to scope an "all employees" notice to the sender's own company.
      const sender = await User.findByPk(req.user.id, {
        attributes: ['id', 'companyId'],
        transaction: t,
      })
      const senderCompanyId = sender?.companyId || null

      // Build the recipient user list (active users only).
      const where = { isActive: true, id: { [Op.ne]: req.user.id } }
      if (finalAudience === 'specific') {
        where.id = { [Op.in]: userIds }
      } else if (senderCompanyId) {
        // "All employees" is scoped to the sender's company when they have one.
        where.companyId = senderCompanyId
      }
      const recipients = await User.findAll({
        where,
        attributes: ['id', 'name', 'email', 'companyEmail'],
        transaction: t,
      })

      if (recipients.length === 0) {
        cleanupFile(req.file)
        await t.rollback()
        throw new BadRequestError('No matching employees to send this notice to')
      }

      const attachmentPath = req.file ? getStoragePath(req.file.path) : null
      const attachmentName = req.file ? req.file.originalname : null

      const notice = await Notice.create(
        {
          title: title.trim(),
          message: message.trim(),
          priority: finalPriority,
          audience: finalAudience,
          attachmentPath,
          attachmentName,
          senderId: req.user.id,
          senderName: req.user.name,
        },
        { transaction: t }
      )

      await NoticeRecipient.bulkCreate(
        recipients.map((r) => ({ noticeId: notice.id, userId: r.id })),
        { transaction: t }
      )

      await t.commit()

      // --- Post-commit side effects (best-effort, never fail the request) ---

      // 1) Real-time in-app notification to each recipient.
      try {
        const io = req.app.get('io')
        if (io) {
          const payload = {
            type: 'notice_received',
            id: notice.id,
            title: notice.title,
            message: notice.message,
            priority: notice.priority,
            senderName: notice.senderName,
            hasAttachment: !!attachmentPath,
            timestamp: new Date().toISOString(),
          }
          recipients.forEach((r) => io.to('user_' + r.id).emit('notice_received', payload))
        }
      } catch (e) {
        logger.warn('Notice socket emit failed:', e.message)
      }

      // 2) Email each recipient (with the PDF attached, if any).
      let emailedCount = 0
      const attachments =
        req.file && fs.existsSync(req.file.path)
          ? [{ filename: attachmentName || path.basename(req.file.path), path: req.file.path }]
          : []
      const results = await Promise.allSettled(
        recipients
          // Prefer the official company email; fall back to personal email.
          .map((r) => ({ r, to: r.companyEmail || r.email }))
          .filter(({ to }) => to)
          .map(({ r, to }) =>
            sendEmail({
              to,
              subject: `[Notice] ${notice.title}`,
              text:
                `Hi ${r.name},\n\n` +
                `${notice.message}\n\n` +
                (attachments.length ? `An attachment is included with this email.\n\n` : '') +
                `— ${notice.senderName || 'HR'}, Pugmark HRMS`,
              html: `
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
                  <div style="border-left:4px solid ${
                    notice.priority === 'urgent' ? '#dc2626' : '#4338ca'
                  };padding:4px 0 4px 14px;margin-bottom:16px">
                    <span style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${
                      notice.priority === 'urgent' ? '#dc2626' : '#4338ca'
                    };font-weight:700">${notice.priority} notice</span>
                    <h2 style="margin:4px 0 0">${notice.title}</h2>
                  </div>
                  <p>Hi <strong>${r.name}</strong>,</p>
                  <div style="white-space:pre-wrap;line-height:1.6">${notice.message}</div>
                  ${
                    attachments.length
                      ? `<p style="margin-top:16px;color:#4338ca">📎 An attachment (${attachmentName}) is included with this email.</p>`
                      : ''
                  }
                  <p style="color:#64748b;font-size:12px;margin-top:24px">— ${
                    notice.senderName || 'HR'
                  }, Pugmark HRMS</p>
                </div>
              `,
              attachments,
            })
          )
      )
      emailedCount = results.filter((x) => x.status === 'fulfilled' && x.value?.sent).length

      logger.info('Notice sent', {
        noticeId: notice.id,
        recipients: recipients.length,
        emailed: emailedCount,
        by: req.user.id,
      })

      res.status(201).json({
        success: true,
        message: `Notice sent to ${recipients.length} employee(s)${
          emailedCount ? `, emailed to ${emailedCount}` : ''
        }.`,
        data: { id: notice.id, recipients: recipients.length, emailed: emailedCount },
      })
    } catch (error) {
      cleanupFile(req.file)
      if (t && !t.finished) await t.rollback()
      next(error)
    }
  }

  /**
   * Notices addressed to the logged-in user.
   * GET /api/notices/my
   */
  async getMyNotices(req, res, next) {
    try {
      const rows = await NoticeRecipient.findAll({
        where: { userId: req.user.id },
        include: [{ model: Notice, as: 'notice', required: true }],
        order: [['createdAt', 'DESC']],
        limit: 200,
      })

      const data = rows.map((row) => {
        const n = row.notice
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          priority: n.priority,
          senderName: n.senderName,
          attachmentPath: n.attachmentPath,
          attachmentName: n.attachmentName,
          createdAt: n.createdAt,
          isRead: row.isRead,
          readAt: row.readAt,
        }
      })

      res.json({ success: true, data, unread: data.filter((d) => !d.isRead).length })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mark one of my notices as read.
   * PATCH /api/notices/:id/read
   */
  async markRead(req, res, next) {
    try {
      const noticeId = parseInt(req.params.id, 10)
      const [count] = await NoticeRecipient.update(
        { isRead: true, readAt: new Date() },
        { where: { noticeId, userId: req.user.id, isRead: false } }
      )
      res.json({ success: true, updated: count })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mark all my notices as read.
   * PATCH /api/notices/read-all
   */
  async markAllRead(req, res, next) {
    try {
      const [count] = await NoticeRecipient.update(
        { isRead: true, readAt: new Date() },
        { where: { userId: req.user.id, isRead: false } }
      )
      res.json({ success: true, updated: count })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Notices sent (for senders — Admin/HR). Includes read/total counts.
   * GET /api/notices
   */
  async getSentNotices(req, res, next) {
    try {
      if (!isSender(req.user)) {
        return next(new ForbiddenError('You are not allowed to view sent notices'))
      }
      const notices = await Notice.findAll({
        order: [['createdAt', 'DESC']],
        limit: 200,
        include: [{ model: NoticeRecipient, as: 'recipients', attributes: ['isRead'] }],
      })
      const data = notices.map((n) => {
        const recips = n.recipients || []
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          priority: n.priority,
          audience: n.audience,
          senderName: n.senderName,
          attachmentPath: n.attachmentPath,
          attachmentName: n.attachmentName,
          createdAt: n.createdAt,
          totalRecipients: recips.length,
          readCount: recips.filter((r) => r.isRead).length,
        }
      })
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a notice (and its recipient rows + attachment file).
   * DELETE /api/notices/:id  — Admin, or the sender.
   */
  async deleteNotice(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const notice = await Notice.findByPk(id)
      if (!notice) throw new NotFoundError('Notice not found')

      const role = String(req.user.role || '').toUpperCase()
      if (role !== 'ADMIN' && notice.senderId !== req.user.id) {
        return next(new ForbiddenError('You can only delete notices you sent'))
      }

      // Remove the attachment file from disk if present.
      if (notice.attachmentPath) {
        const abs = path.join(__dirname, '..', notice.attachmentPath.replace(/^\//, ''))
        fs.promises.unlink(abs).catch(() => {})
      }

      await notice.destroy() // notice_recipients cascade via FK
      res.json({ success: true, message: 'Notice deleted' })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new NoticeController()
