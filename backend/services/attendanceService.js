const { AttendanceRecord, Office, User, UserOffice } = require('../models')
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors')
const { validateGeofence } = require('../utils/distanceCalculator')
const officeService = require('./officeService')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const { toIST, istStartOfDay, istEndOfDay, getCurrentIST } = require('../utils/timeUtils')

/**
 * Codes used by the monthly attendance report, mapped to the labels the UI
 * already renders. Anything unmapped is shown verbatim, so an unfamiliar code
 * surfaces rather than silently becoming "Present".
 */
const EXPLICIT_STATUS_LABELS = {
  P: 'Present',
  WOF: 'Week Off',
  A: 'Absent',
  HD: 'Half Day',
  L: 'Late',
}

/**
 * Attendance Service
 * Handles all attendance-related business logic
 */
class AttendanceService {
  /**
   * Process attendance punch
   * @param {Object} punchData - Punch data
   * @param {number} punchData.userId - User ID
   * @param {number} punchData.officeId - Office ID
   * @param {number} punchData.latitude - User latitude
   * @param {number} punchData.longitude - User longitude
   * @param {string} punchData.punchType - IN or OUT
   * @param {string} punchData.remark - Optional remark
   * @param {boolean} punchData.canOverride - Whether user can override geofence
   * @returns {Promise<Object>} Punch result
   *
   * NOTE: Time is ALWAYS derived on the backend in IST using getCurrentIST().
   * We deliberately ignore any client-provided time to keep a single source of truth.
   */
  async processPunch(punchData) {
    let { userId, officeId, latitude, longitude, punchType, remark, canOverride } = punchData

    try {
      // 1. Auto-resolve officeId if not provided
      if (!officeId) {
        const userOffices = await UserOffice.findAll({ where: { userId } })
        if (userOffices.length > 0) {
          officeId = userOffices[0].officeId
        } else {
          // Fallback: use the first active office
          const firstOffice = await Office.findOne({ where: { isActive: true } })
          if (firstOffice) {
            officeId = firstOffice.id
          } else {
            throw new BadRequestError('No office found. Please contact admin.')
          }
        }
      }

      // 2. Fetch office details
      const office = await officeService.getOfficeById(officeId)
      
      // Convert Sequelize model to plain object if needed
      const officeData = office.toJSON ? office.toJSON() : office

      // 2. Validate geofence
      const geofenceValidation = validateGeofence(
        latitude,
        longitude,
        parseFloat(officeData.latitude),
        parseFloat(officeData.longitude),
        parseInt(officeData.radius)
      )

      // 3. Check if user is within radius or can override
      const isWithinRadius = geofenceValidation.isWithinRadius
      const strictGeofencing = Boolean(officeData.strictGeofencing)

      // Geofence is DISABLED by default now. Set ENABLE_GEOFENCE=true in .env
      // only if you explicitly want to enforce distance checks.
      const geofenceEnabled = process.env.ENABLE_GEOFENCE === 'true'

      if (geofenceEnabled) {
        if (!isWithinRadius && strictGeofencing && !canOverride) {
          throw new BadRequestError(
            `You are ${geofenceValidation.distance}m away from the office. Attendance is only allowed within ${officeData.radius}m radius.`
          )
        }

        if (!isWithinRadius && !strictGeofencing && !remark) {
          throw new BadRequestError(
            'Remark is required when punching from outside the allowed area'
          )
        }

        if (!isWithinRadius && strictGeofencing && canOverride && !remark) {
          throw new BadRequestError(
            'Remark is required when overriding geofence restriction'
          )
        }
      }

      // 4. Check for invalid punch sequences
      await this.validatePunchSequence(userId, punchType)

      // 5. Save attendance record
      const attendanceRecord = await this.saveAttendanceRecord({
        userId,
        officeId,
        latitude,
        longitude,
        punchType,
        remark: remark || null,
        distance: geofenceValidation.distance,
        isWithinRadius,
        accuracy: punchData.accuracy || null,
        ipAddress: punchData.ipAddress || null,
        userAgent: punchData.userAgent || null,
      })

      // 6. Log attendance action
      logger.info('Attendance punch recorded', {
        userId,
        officeId,
        punchType,
        distance: geofenceValidation.distance,
        isWithinRadius,
        overridden: !isWithinRadius && canOverride,
      })

      return {
        id: attendanceRecord.id,
        punchType,
        timestamp: attendanceRecord.createdAt,
        checkInTime: attendanceRecord.checkInTime || null,
        checkOutTime: attendanceRecord.checkOutTime || null,
        totalHours: attendanceRecord.totalHours || null,
        office: {
          id: officeData.id,
          name: officeData.name,
        },
        location: {
          latitude,
          longitude,
          distance: geofenceValidation.distance,
          isWithinRadius,
        },
        message: this.getPunchMessage(punchType, isWithinRadius, geofenceValidation.distance),
      }
    } catch (error) {
      logger.error('Error processing attendance punch:', error)
      throw error
    }
  }

  /**
   * Validate punch sequence
   * - Prevent multiple check-ins on the same day (IST)
   * - Ensure check-out is only allowed if check-in exists for that day
   *
   * @param {number} userId - User ID
   * @param {string} punchType - IN or OUT
   */
  async validatePunchSequence(userId, punchType) {
    try {
      const now = getCurrentIST()
      const startOfDay = istStartOfDay(now).toDate()
      const endOfDay = istEndOfDay(now).toDate()

      if (punchType === 'IN') {
        // Check if user already has a check-in today (IST)
        const existingCheckIn = await AttendanceRecord.findOne({
          where: {
            userId,
            punchType: 'IN',
            [Op.or]: [
              {
                createdAt: {
                  [Op.gte]: startOfDay,
                  [Op.lte]: endOfDay,
                },
              },
              {
                checkInTime: {
                  [Op.gte]: startOfDay,
                  [Op.lte]: endOfDay,
                },
              },
            ],
          },
        })

        if (existingCheckIn) {
          const existingTime = toIST(existingCheckIn.checkInTime || existingCheckIn.createdAt).format('hh:mm A')
          throw new ConflictError(
            `You have already checked in today at ${existingTime} IST. Multiple check-ins on the same day are not allowed.`
          )
        }
      } else if (punchType === 'OUT') {
        // Check if user has a check-in today (IST) before allowing check-out
        const existingCheckIn = await AttendanceRecord.findOne({
          where: {
            userId,
            punchType: 'IN',
            [Op.or]: [
              {
                createdAt: {
                  [Op.gte]: startOfDay,
                  [Op.lte]: endOfDay,
                },
              },
              {
                checkInTime: {
                  [Op.gte]: startOfDay,
                  [Op.lte]: endOfDay,
                },
              },
            ],
          },
        })

        if (!existingCheckIn) {
          throw new BadRequestError(
            'Cannot check out without checking in first. Please check in before checking out.'
          )
        }

        // Check if user already has a check-out today (IST)
        const existingCheckOut = await AttendanceRecord.findOne({
          where: {
            userId,
            punchType: 'OUT',
            [Op.or]: [
              {
                createdAt: {
                  [Op.gte]: startOfDay,
                  [Op.lte]: endOfDay,
                },
              },
              {
                checkOutTime: {
                  [Op.gte]: startOfDay,
                  [Op.lte]: endOfDay,
                },
              },
            ],
          },
        })

        if (existingCheckOut) {
          const existingTime = toIST(existingCheckOut.checkOutTime || existingCheckOut.createdAt).format('hh:mm A')
          throw new ConflictError(
            `You have already checked out today at ${existingTime} IST. Multiple check-outs on the same day are not allowed.`
          )
        }
      }
    } catch (error) {
      if (error instanceof ConflictError || error instanceof BadRequestError) {
        throw error
      }
      logger.error('Error validating punch sequence:', error)
      throw error
    }
  }

  /**
   * Save attendance record to database
   * @param {Object} recordData - Record data
   * @returns {Promise<Object>} Saved record
   */
  async saveAttendanceRecord(recordData) {
    try {
      const {
        userId,
        officeId,
        latitude,
        longitude,
        punchType,
        remark,
        distance,
        isWithinRadius,
        accuracy,
        ipAddress,
        userAgent,
        clientTime,
      } = recordData

      // Base punch time: use clientTime if provided, otherwise current UTC
      // DB stores UTC (timezone: '+00:00'), toIST() converts when reading
      let punchInstant = clientTime ? new Date(clientTime) : new Date()

      // Base payload with punch timestamp
      const payload = {
        userId,
        officeId,
        punchType,
        latitude,
        longitude,
        distance,
        isWithinRadius,
        remark: remark || null,
        accuracy: accuracy || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdAt: punchInstant,
      }

      // Create record with punch timestamp
      const attendanceRecord = await AttendanceRecord.create(payload)

      // When punching IN, store check_in_time
      if (punchType === 'IN') {
        attendanceRecord.checkInTime = punchInstant
        await attendanceRecord.save()
      }

      // When punching OUT, store check_out_time (server-side IST), 
      // mirror check_in_time from the latest IN for the same day,
      // and compute totalHours between that IN and this OUT.
      if (punchType === 'OUT') {
        // Set explicit check-out time
        attendanceRecord.checkOutTime = punchInstant

        try {
          const outTime = punchInstant

          // Limit the search for IN punches to the same calendar day as OUT (IST)
          // to avoid accidentally spanning multiple days and inflating hours.
          const startOfDay = istStartOfDay(outTime).toDate()
          const endOfDay = istEndOfDay(outTime).toDate()

          const lastInPunch = await AttendanceRecord.findOne({
            where: {
              userId,
              punchType: 'IN',
              [Op.or]: [
                {
                  createdAt: {
                    [Op.gte]: startOfDay,
                    [Op.lte]: endOfDay,
                  },
                },
                {
                  checkInTime: {
                    [Op.gte]: startOfDay,
                    [Op.lte]: endOfDay,
                  },
                },
              ],
            },
            order: [['createdAt', 'DESC']],
          })

          if (lastInPunch) {
            // Copy the original IN time onto this OUT record for easier reporting
            attendanceRecord.checkInTime =
              lastInPunch.checkInTime || lastInPunch.createdAt || attendanceRecord.checkInTime

            const inTime = lastInPunch.checkInTime || lastInPunch.createdAt
            if (inTime) {
              const diffMs = outTime.getTime() - new Date(inTime).getTime()
              if (diffMs > 0) {
                const diffHours = diffMs / (1000 * 60 * 60)
                // Round to 2 decimal places
                const roundedHours = Math.round(diffHours * 100) / 100
                attendanceRecord.totalHours = roundedHours
              }
            }
          }
        } catch (err) {
          logger.error('Error calculating totalHours for attendance record:', err)
        }

        await attendanceRecord.save()
      }

      return attendanceRecord
    } catch (error) {
      logger.error('Error saving attendance record:', error)
      throw error
    }
  }

  /**
   * Update attendance record (for admin/manager editing)
   * @param {Object} updateData - Update data
   * @param {number} updateData.userId - User ID
   * @param {string} updateData.date - Date (YYYY-MM-DD)
   * @param {string} updateData.checkInTime - Check in time (HH:mm format)
   * @param {string} updateData.checkOutTime - Check out time (HH:mm format)
   * @param {string} updateData.status - Status (Present, Absent, Late, Half Day)
   * @returns {Promise<Object>} Updated record
   */
  async updateAttendanceRecord(updateData) {
    try {
      const { userId, date, checkInTime, checkOutTime, status } = updateData

      // Parse the date
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Find existing records for this user and date
      // Also check records where checkInTime or checkOutTime fall on this date
      const existingRecords = await AttendanceRecord.findAll({
        where: {
          userId,
          [Op.or]: [
            {
              createdAt: {
                [Op.gte]: startOfDay,
                [Op.lte]: endOfDay,
              },
            },
            {
              checkInTime: {
                [Op.gte]: startOfDay,
                [Op.lte]: endOfDay,
              },
            },
            {
              checkOutTime: {
                [Op.gte]: startOfDay,
                [Op.lte]: endOfDay,
              },
            },
          ],
        },
        order: [['createdAt', 'ASC']],
      })

      logger.info('Existing records found:', {
        count: existingRecords.length,
        records: existingRecords.map(r => ({
          id: r.id,
          punchType: r.punchType,
          checkInTime: r.checkInTime,
          checkOutTime: r.checkOutTime,
          totalHours: r.totalHours,
          createdAt: r.createdAt,
        })),
      })

      // Parse times and create date objects
      // Support both HH:mm and hh:mm A formats
      let checkInDateTime = null
      let checkOutDateTime = null

      const parseTime = (timeStr) => {
        if (!timeStr) return null
        // Try HH:mm format first (24-hour)
        if (timeStr.includes(':')) {
          const parts = timeStr.split(':')
          const hours = parseInt(parts[0], 10)
          const minutes = parseInt(parts[1]?.replace(/[^0-9]/g, '') || '0', 10)
          if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            const date = new Date(targetDate)
            date.setHours(hours, minutes, 0, 0)
            return date
          }
        }
        return null
      }

      if (checkInTime) {
        checkInDateTime = parseTime(checkInTime)
        if (!checkInDateTime) {
          throw new BadRequestError('Invalid check-in time format. Use HH:mm format (e.g., 09:00)')
        }
      }

      if (checkOutTime) {
        checkOutDateTime = parseTime(checkOutTime)
        if (!checkOutDateTime) {
          throw new BadRequestError('Invalid check-out time format. Use HH:mm format (e.g., 18:00)')
        }
      }

      // If checkOutTime is provided but checkInTime is not, try to get it from existing IN record
      let effectiveCheckInDateTime = checkInDateTime
      if (!checkInDateTime && checkOutDateTime) {
        const existingInRecord = existingRecords.find((r) => r.punchType === 'IN')
        if (existingInRecord && existingInRecord.checkInTime) {
          effectiveCheckInDateTime = new Date(existingInRecord.checkInTime)
        } else if (existingInRecord && existingInRecord.createdAt) {
          effectiveCheckInDateTime = new Date(existingInRecord.createdAt)
        }
      }

      // Validate that check-out is after check-in
      if (effectiveCheckInDateTime && checkOutDateTime && checkOutDateTime <= effectiveCheckInDateTime) {
        throw new BadRequestError('Check-out time must be after check-in time')
      }

      // Calculate total hours using effective check-in time
      let totalHours = null
      if (effectiveCheckInDateTime && checkOutDateTime) {
        const diffMs = checkOutDateTime.getTime() - effectiveCheckInDateTime.getTime()
        if (diffMs > 0) {
          const diffHours = diffMs / (1000 * 60 * 60)
          totalHours = Math.round(diffHours * 100) / 100
        }
      }

      // Get default values from existing records or use safe defaults
      const defaultOfficeId = existingRecords[0]?.officeId || 1
      const defaultLatitude = existingRecords[0]?.latitude !== null && existingRecords[0]?.latitude !== undefined 
        ? existingRecords[0].latitude 
        : 0
      const defaultLongitude = existingRecords[0]?.longitude !== null && existingRecords[0]?.longitude !== undefined 
        ? existingRecords[0].longitude 
        : 0
      const defaultDistance = existingRecords[0]?.distance !== null && existingRecords[0]?.distance !== undefined 
        ? existingRecords[0].distance 
        : 0
      const defaultIsWithinRadius = existingRecords[0]?.isWithinRadius !== null && existingRecords[0]?.isWithinRadius !== undefined 
        ? existingRecords[0].isWithinRadius 
        : true

      // Update or create IN record
      if (checkInDateTime) {
        let inRecord = existingRecords.find((r) => r.punchType === 'IN')
        if (inRecord) {
          inRecord.checkInTime = checkInDateTime
          inRecord.createdAt = checkInDateTime
          await inRecord.save()
        } else {
          // Create new IN record with required fields
          inRecord = await AttendanceRecord.create({
            userId,
            officeId: defaultOfficeId,
            punchType: 'IN',
            latitude: defaultLatitude,
            longitude: defaultLongitude,
            distance: defaultDistance,
            isWithinRadius: defaultIsWithinRadius,
            checkInTime: checkInDateTime,
            createdAt: checkInDateTime,
          })
        }
      }

      // Update or create OUT record
      if (checkOutDateTime) {
        let outRecord = existingRecords.find((r) => r.punchType === 'OUT')
        if (outRecord) {
          // Update existing OUT record
          outRecord.checkOutTime = checkOutDateTime
          
          // Use effective check-in time (from parameter or existing IN record)
          if (effectiveCheckInDateTime) {
            outRecord.checkInTime = effectiveCheckInDateTime
          } else if (!outRecord.checkInTime) {
            // If no check-in time exists, try to get from IN record
            const inRecord = existingRecords.find((r) => r.punchType === 'IN')
            if (inRecord && inRecord.checkInTime) {
              outRecord.checkInTime = new Date(inRecord.checkInTime)
            } else if (inRecord && inRecord.createdAt) {
              outRecord.checkInTime = new Date(inRecord.createdAt)
            }
          }
          
          // Recalculate total hours if we have both times
          const finalCheckInTime = outRecord.checkInTime ? new Date(outRecord.checkInTime) : null
          const finalCheckOutTime = new Date(checkOutDateTime)
          
          if (finalCheckInTime && finalCheckOutTime) {
            const diffMs = finalCheckOutTime.getTime() - finalCheckInTime.getTime()
            if (diffMs > 0) {
              const diffHours = diffMs / (1000 * 60 * 60)
              outRecord.totalHours = Math.round(diffHours * 100) / 100
            } else {
              outRecord.totalHours = 0
            }
          } else if (totalHours !== null && totalHours !== undefined) {
            outRecord.totalHours = totalHours
          }
          
          outRecord.createdAt = checkOutDateTime
          
          logger.info('Updating OUT record:', {
            id: outRecord.id,
            checkInTime: outRecord.checkInTime,
            checkOutTime: outRecord.checkOutTime,
            totalHours: outRecord.totalHours,
            effectiveCheckInDateTime: effectiveCheckInDateTime,
            finalCheckInTime: finalCheckInTime,
            finalCheckOutTime: finalCheckOutTime,
          })
          
          // Save with explicit field update to ensure changes are persisted
          await outRecord.save({
            fields: ['checkOutTime', 'checkInTime', 'totalHours', 'createdAt', 'updatedAt'],
          })
          
          // Reload the record to verify it was saved
          await outRecord.reload()
          
          logger.info('OUT record after save:', {
            id: outRecord.id,
            checkInTime: outRecord.checkInTime,
            checkOutTime: outRecord.checkOutTime,
            totalHours: outRecord.totalHours,
            checkInTimeType: typeof outRecord.checkInTime,
            checkOutTimeType: typeof outRecord.checkOutTime,
          })
          
          // Verify the save worked by querying the database
          const verifyRecord = await AttendanceRecord.findByPk(outRecord.id)
          if (verifyRecord) {
            logger.info('Verified OUT record from database:', {
              id: verifyRecord.id,
              checkInTime: verifyRecord.checkInTime,
              checkOutTime: verifyRecord.checkOutTime,
              totalHours: verifyRecord.totalHours,
            })
          }
        } else {
          // Create new OUT record with required fields
          outRecord = await AttendanceRecord.create({
            userId,
            officeId: defaultOfficeId,
            punchType: 'OUT',
            latitude: defaultLatitude,
            longitude: defaultLongitude,
            distance: defaultDistance,
            isWithinRadius: defaultIsWithinRadius,
            checkInTime: effectiveCheckInDateTime || null,
            checkOutTime: checkOutDateTime,
            totalHours: totalHours,
            createdAt: checkOutDateTime,
          })
          
          logger.info('Created new OUT record:', {
            id: outRecord.id,
            checkInTime: outRecord.checkInTime,
            checkOutTime: outRecord.checkOutTime,
            totalHours: outRecord.totalHours,
          })
        }
      }

      // If status is Absent and no times provided, we might want to delete records
      // For now, we'll just update what we have

      return {
        success: true,
        message: 'Attendance updated successfully',
        userId,
        date,
        checkInTime,
        checkOutTime,
        totalHours,
        status,
      }
    } catch (error) {
      logger.error('Error updating attendance record:', error)
      throw error
    }
  }

  /**
   * Get attendance records for a user with pagination
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated attendance records with total count
   */
  async getUserAttendanceRecords(userId, filters = {}) {
    try {
      const { startDate, endDate, officeId, page = 1, limit = 10, cursor } = filters

      const whereClause = {
        userId,
      }

      // Date filtering - include createdAt, checkInTime, checkOutTime so regulation records appear
      if (startDate || endDate) {
        const start = startDate ? istStartOfDay(startDate).toDate() : null
        const end = endDate ? istEndOfDay(endDate).toDate() : null
        const range = {}
        if (start) range[Op.gte] = start
        if (end) range[Op.lte] = end
        if (Object.keys(range).length > 0) {
          whereClause[Op.or] = [
            { createdAt: range },
            { checkInTime: range },
            { checkOutTime: range },
          ]
        }
      }

      if (officeId) {
        whereClause.officeId = officeId
      }

      // Cursor-based pagination (cursor is the last record ID from previous page)
      if (cursor) {
        whereClause.id = {
          [Op.lt]: parseInt(cursor, 10), // Get records with ID less than cursor
        }
      }

      // Get total count from DB (not frontend state)
      const totalCount = await AttendanceRecord.count({
        where: whereClause,
        distinct: true,
        col: 'id',
      })

      // Get records with limit
      const records = await AttendanceRecord.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'employeeCode'],
          },
          {
            model: Office,
            as: 'office',
            attributes: ['id', 'name', 'country'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: limit + 1, // Fetch one extra to check if there's a next page
      })

      // Check if there's a next page
      const hasNextPage = records.length > limit
      const data = hasNextPage ? records.slice(0, limit) : records

      // Get the last record's ID for cursor
      const nextCursor = hasNextPage && data.length > 0 ? data[data.length - 1].id : null

      // Group by date and format for frontend
      const formattedRecords = this.formatAttendanceRecords(data)

      // Calculate actual counts from DB
      const totalCheckIns = await AttendanceRecord.count({
        where: {
          ...whereClause,
          punchType: 'IN',
        },
      })

      const totalCompleted = await AttendanceRecord.count({
        where: {
          ...whereClause,
          punchType: 'OUT',
        },
      })

      return {
        data: formattedRecords,
        pagination: {
          total: totalCount,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage,
          nextCursor,
        },
        counts: {
          total: totalCount,
          checkIns: totalCheckIns,
          completed: totalCompleted, // Check-ins with check-outs
        },
      }
    } catch (error) {
      logger.error('Error fetching attendance records:', error)
      throw error
    }
  }

  /**
   * Delete a single attendance record by ID
   * @param {number} id - AttendanceRecord ID
   */
  async deleteAttendanceRecord(id) {
    try {
      const record = await AttendanceRecord.findByPk(id)
      if (!record) {
        throw new NotFoundError('Attendance record not found')
      }

      await record.destroy()

      return {
        success: true,
        message: 'Attendance record deleted successfully',
      }
    } catch (error) {
      logger.error('Error deleting attendance record:', error)
      throw error
    }
  }

  /**
   * Format attendance records for frontend
   * Groups punches by date and formats location data
   * @param {Array} records - Raw records from database
   * @returns {Array} Formatted records
   */
  formatAttendanceRecords(records) {
    const grouped = {}

    records.forEach((record) => {
      // Use IST date (not raw UTC) to avoid off-by-one issues for India timezone
      // For IN punches, use checkInTime if available (set from clientTime), otherwise createdAt
      // For OUT punches, use checkOutTime if available (set from clientTime), otherwise createdAt
      const punchTime =
        record.punchType === 'IN'
          ? record.checkInTime || record.createdAt
          : record.punchType === 'OUT'
          ? record.checkOutTime || record.createdAt
          : record.createdAt

      const createdAtIst = toIST(punchTime)
      const date = createdAtIst.format('YYYY-MM-DD')

      if (!grouped[date]) {
        grouped[date] = {
          id: `date-${date}`,
          date,
          userId: record.user?.id || record.userId,
          employeeId: record.user?.employeeCode || null,
          employeeName: record.user?.name || 'Employee',
          officeId: record.office?.id || record.officeId,
          officeName: record.office?.name || null,
          checkIn: null,
          checkOut: null,
          checkInLocation: null,
          checkOutLocation: null,
          status: 'Absent',
          totalHours: null,
          isLate: false,
          // Internal fields (not returned) used to compute accurate day summary
          _earliestInTime: null,
          _latestOutTime: null,
        }
      }

      const daySlot = grouped[date]

      // Days imported from a monthly report carry their status on the row —
      // there are no times to derive it from. Read it before the punch
      // branches below so they know not to overwrite it.
      if (record.status && !daySlot._explicitStatus) {
        daySlot._explicitStatus = record.status
        daySlot.status = EXPLICIT_STATUS_LABELS[record.status] || record.status
      }

      // A status-only row (monthly-report import) has no times at all — its
      // created_at is just a date anchor so the row groups under the right day.
      // Falling through to the punch branches would render that anchor as a
      // check-in time, inventing a punch that never happened.
      if (record.status && !record.checkInTime && !record.checkOutTime) {
        return
      }

      if (record.punchType === 'IN') {
        const punchTime = record.checkInTime || record.createdAt
        const punchDateIst = toIST(punchTime)
        const punchDate = punchDateIst.toDate()

        // Office start time: 10:15 (10:15 AM IST). Later than this is considered "Late".
        const expectedStartIst = punchDateIst
          .clone()
          .hour(10)
          .minute(15)
          .second(0)
          .millisecond(0)
        const isLate = punchDateIst.isAfter(expectedStartIst)

        // Track earliest IN time of the day
        if (!daySlot._earliestInTime || punchDate < daySlot._earliestInTime) {
          daySlot._earliestInTime = punchDate
          daySlot.checkIn = punchDateIst.format('hh:mm A')
          daySlot.checkInLocation = {
            latitude: parseFloat(record.latitude),
            longitude: parseFloat(record.longitude),
            distance: parseInt(record.distance),
            isWithinRadius: record.isWithinRadius,
          }
          // An explicitly stored status (from a monthly-report import) is the
          // authority for the day; only derive when it is absent.
          if (!daySlot._explicitStatus) {
            daySlot.status = isLate ? 'Late' : 'Present'
          }
          daySlot.isLate = isLate
        }
      } else if (record.punchType === 'OUT') {
        const punchTime = record.checkOutTime || record.createdAt
        const punchDateIst = toIST(punchTime)
        const punchDate = punchDateIst.toDate()

        // Track latest OUT time of the day
        if (!daySlot._latestOutTime || punchDate > daySlot._latestOutTime) {
          daySlot._latestOutTime = punchDate
          daySlot.checkOut = punchDateIst.format('hh:mm A')
          daySlot.checkOutLocation = {
            latitude: parseFloat(record.latitude),
            longitude: parseFloat(record.longitude),
            distance: parseInt(record.distance),
            isWithinRadius: record.isWithinRadius,
          }
        }
      }
    })

    // After grouping, compute accurate total hours for each day
    const result = Object.values(grouped).map((slot) => {
      if (slot._earliestInTime && slot._latestOutTime && slot._latestOutTime > slot._earliestInTime) {
        const diffMs = slot._latestOutTime.getTime() - slot._earliestInTime.getTime()
        const diffMinutes = Math.round(diffMs / 60000)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        slot.totalHours = Math.round((diffMinutes / 60) * 100) / 100
      } else if (!slot.totalHours) {
        slot.totalHours = 0
      }

      // Remove internal helper fields before sending response
      delete slot._earliestInTime
      delete slot._latestOutTime
      return slot
    })

    return result
  }

  /**
   * Get punch message based on result
   * @param {string} punchType - IN or OUT
   * @param {boolean} isWithinRadius - Whether within geofence
   * @param {number} distance - Distance from office
   * @returns {string} Message
   */
  getPunchMessage(punchType, isWithinRadius, distance) {
    if (isWithinRadius) {
      return `Successfully punched ${punchType.toLowerCase()} from office location`
    }
    return `Punched ${punchType.toLowerCase()} from ${distance}m away from office (override)`
  }

  /**
   * Create attendance records for an approved regulation request so the day counts as present.
   * Creates IN and OUT records for the given date (IST). Uses user's primary/first office.
   * @param {number} userId - User ID
   * @param {string} dateStr - Date YYYY-MM-DD
   * @param {Object} options - { checkIn: optional time string e.g. "09:30", checkOut: optional e.g. "18:00" }
   * @returns {Promise<{ inRecord: Object, outRecord: Object }>}
   */
  async createAttendanceForRegulation(userId, dateStr, options = {}) {
    const { checkIn, checkOut } = options
    const dateOnly = String(dateStr).slice(0, 10)
    const [y, m, d] = dateOnly.split('-').map(Number)
    if (!y || !m || !d) throw new BadRequestError('Invalid date for regulation')

    const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0)
    const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999)
    const existingIn = await AttendanceRecord.findOne({
      where: {
        userId,
        punchType: 'IN',
        [Op.or]: [
          { createdAt: { [Op.gte]: startOfDay, [Op.lte]: endOfDay } },
          { checkInTime: { [Op.gte]: startOfDay, [Op.lte]: endOfDay } },
        ],
      },
    })
    if (existingIn) {
      throw new BadRequestError('Attendance already exists for this date. Regulation not applied.')
    }

    let officeId = null
    const userOffice = await UserOffice.findOne({
      where: { userId },
      order: [['isPrimary', 'DESC'], ['officeId', 'ASC']],
      attributes: ['officeId'],
    })
    if (userOffice) officeId = userOffice.officeId
    if (!officeId) {
      const firstOffice = await Office.findOne({ order: [['id', 'ASC']], attributes: ['id'] })
      if (firstOffice) officeId = firstOffice.id
    }
    if (!officeId) throw new BadRequestError('No office assigned. Cannot create regulation attendance.')

    let inHour = 9
    let inMin = 0
    if (checkIn && /^\d{1,2}:\d{2}$/.test(String(checkIn).trim())) {
      const [h, min] = String(checkIn).trim().split(':').map(Number)
      if (h >= 0 && h < 24 && min >= 0 && min < 60) {
        inHour = h
        inMin = min
      }
    }
    let outHour = 18
    let outMin = 0
    if (checkOut && /^\d{1,2}:\d{2}$/.test(String(checkOut).trim())) {
      const [h, min] = String(checkOut).trim().split(':').map(Number)
      if (h >= 0 && h < 24 && min >= 0 && min < 60) {
        outHour = h
        outMin = min
      }
    }
    const checkInDate = new Date(y, m - 1, d, inHour, inMin, 0, 0)
    const checkOutDate = new Date(y, m - 1, d, outHour, outMin, 0, 0)
    const totalHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    const totalHoursRounded = Math.round(totalHours * 100) / 100

    const inRecord = await AttendanceRecord.create({
      userId,
      officeId,
      punchType: 'IN',
      checkInTime: checkInDate,
      // Manual regulation has no GPS punch; columns are NOT NULL, so use 0.
      latitude: 0,
      longitude: 0,
      distance: 0,
      isWithinRadius: true,
      remark: 'Attendance regulation (approved)',
    })
    await inRecord.update({ createdAt: checkInDate })

    const outRecord = await AttendanceRecord.create({
      userId,
      officeId,
      punchType: 'OUT',
      checkInTime: checkInDate,
      checkOutTime: checkOutDate,
      totalHours: totalHoursRounded,
      latitude: 0,
      longitude: 0,
      distance: 0,
      isWithinRadius: true,
      remark: 'Attendance regulation (approved)',
    })
    await outRecord.update({ createdAt: checkOutDate })

    logger.info('Regulation attendance created', { userId, date: dateOnly, officeId })
    return { inRecord, outRecord }
  }
}

module.exports = new AttendanceService()
// Shared with attendanceController, which does its own grouping for the team
// view and must label imported statuses identically.
module.exports.EXPLICIT_STATUS_LABELS = EXPLICIT_STATUS_LABELS
