const cron = require('node-cron')
const payrollService = require('./payrollService')
const biometricSync = require('./biometricAttendanceSync')
const logger = require('../utils/logger')

/**
 * Payroll Scheduler Service
 * Handles scheduled payroll calculations
 */
class PayrollScheduler {
  constructor() {
    this.job = null
    this.biometricJob = null
    this.isRunning = false
  }

  /**
   * Start the payroll scheduler
   * Runs on 1st day of every month at 00:05 AM
   */
  start() {
    // Cron expression: "5 0 1 * *" = At 00:05 AM on the 1st day of every month
    this.job = cron.schedule('5 0 1 * *', async () => {
      if (this.isRunning) {
        logger.warn('Payroll calculation is already running. Skipping this execution.')
        return
      }

      this.isRunning = true
      logger.info('🔄 Scheduled payroll calculation started')

      try {
        const { year, month } = payrollService.getPreviousMonth()
        logger.info(`Calculating payroll for previous month: ${month}/${year}`)

        const results = await payrollService.calculatePayrollForAllEmployees(year, month)

        logger.info('✅ Scheduled payroll calculation completed', {
          month,
          year,
          results,
        })
      } catch (error) {
        logger.error('❌ Error in scheduled payroll calculation:', error)
      } finally {
        this.isRunning = false
      }
    })

    logger.info('📅 Payroll scheduler started. Will run on 1st of every month at 00:05 AM')

    // Nightly biometric → attendance materialization for the previous IST day,
    // so payroll/reports have complete data even for users who never open the app.
    // Cron: "30 0 * * *" = 00:30 AM IST every day.
    this.biometricJob = cron.schedule(
      '30 0 * * *',
      async () => {
        try {
          const moment = require('moment-timezone')
          const dateStr = moment
            .tz('Asia/Kolkata')
            .subtract(1, 'day')
            .format('YYYY-MM-DD')
          const res = await biometricSync.syncAllForDate(dateStr)
          logger.info(`✅ Nightly biometric sync for ${dateStr}: ${res.users} user(s)`)
        } catch (error) {
          logger.error('❌ Error in nightly biometric sync:', error)
        }
      },
      { timezone: 'Asia/Kolkata' }
    )

    logger.info('📅 Biometric attendance sync scheduled nightly at 00:30 IST')
  }

  /**
   * Stop the payroll scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop()
      logger.info('📅 Payroll scheduler stopped')
    }
    if (this.biometricJob) {
      this.biometricJob.stop()
      logger.info('📅 Biometric sync scheduler stopped')
    }
  }

  /**
   * Manually trigger payroll calculation for previous month
   * @returns {Promise<Object>} Calculation results
   */
  async triggerManualCalculation() {
    if (this.isRunning) {
      throw new Error('Payroll calculation is already running. Please wait for it to complete.')
    }

    this.isRunning = true
    logger.info('🔄 Manual payroll calculation triggered')

    try {
      const { year, month } = payrollService.getPreviousMonth()
      logger.info(`Calculating payroll for previous month: ${month}/${year}`)

      const results = await payrollService.calculatePayrollForAllEmployees(year, month)

      logger.info('✅ Manual payroll calculation completed', {
        month,
        year,
        results,
      })

      return {
        success: true,
        month,
        year,
        results,
      }
    } catch (error) {
      logger.error('❌ Error in manual payroll calculation:', error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Get scheduler status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.job !== null,
      nextRun: this.job ? '1st of every month at 00:05 AM' : 'Not scheduled',
    }
  }
}

module.exports = new PayrollScheduler()
