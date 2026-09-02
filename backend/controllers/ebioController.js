/**
 * eBioServerNew sync controller.
 *
 * Pulls punch data from the eBioServerNew SOAP API and stores it in the same
 * `attendance_logs` table used by the direct /iclock push, so both sources show
 * up on the Biometric Attendance page.
 *
 * eBioServer's GetDeviceLogs returns the EMPLOYEE CODE (not the device PIN), so
 * we store that code in `device_pin`. The Biometric Attendance query matches it
 * against both users.device_pin AND users.employee_code, so names resolve either
 * way.
 */

const logger = require('../utils/logger')
const ebio = require('../services/ebioServerService')
const csvImporter = require('../services/biometricCsvImporter')

class EbioController {
  /**
   * POST /api/ebio/pull
   * Pull from BOTH sources: import any uploaded CSVs (FTP/WebDav) AND, if the
   * SOAP API is enabled, sync device logs. Both write to attendance_logs with
   * INSERT IGNORE, so overlapping punches are deduped automatically.
   */
  async pull(req, res, next) {
    try {
      const date = req.query.date || req.body?.date
      const location = req.query.location ?? req.body?.location

      // 1) CSV import (FTP/WebDav uploads)
      let csv = { files: 0, fetched: 0, stored: 0 }
      try {
        csv = await csvImporter.importAll()
      } catch (e) {
        logger.error(`[ebio] pull: csv import failed: ${e.message}`)
        csv.error = e.message
      }

      // 2) SOAP API sync (only if configured/reachable)
      let soap = { enabled: false }
      if (ebio.isEnabled()) {
        try {
          const r = await ebio.syncDeviceLogsToDb({ logDate: date, location })
          soap = { enabled: true, ...r }
        } catch (e) {
          logger.error(`[ebio] pull: soap sync failed: ${e.message}`)
          soap = { enabled: true, error: e.message, fetched: 0, stored: 0 }
        }
      }

      const totalStored = (csv.stored || 0) + (soap.stored || 0)

      // 3) Both importers already materialized their own punches into
      // attendance_records (first punch = IN, last = OUT) for exactly the IST
      // days those punches carried — which is strictly better than the single
      // date this endpoint used to guess at, since a CSV drop or a device that
      // was offline routinely carries backdated days. Just report the totals.
      const materialized = {
        days: (csv.attendance?.days || 0) + (soap.attendance?.days || 0),
        users: (csv.attendance?.users || 0) + (soap.attendance?.users || 0),
      }

      logger.info(
        `[ebio] pull: csv=${JSON.stringify(csv)} soap=${JSON.stringify(soap)} attendance=${JSON.stringify(materialized)}`
      )
      return res.status(200).json({
        success: true,
        message: `Imported ${totalStored} new punch(es) (CSV: ${csv.stored || 0}, API: ${soap.stored || 0}).`,
        data: { csv, soap, attendance: materialized },
      })
    } catch (error) {
      logger.error('[ebio] pull failed:', error)
      next(error)
    }
  }

  /**
   * POST /api/ebio/import-csv
   * Import punch CSVs that the eSSL Bio Server uploaded via FTP into attendance_logs.
   */
  async importCsv(req, res, next) {
    try {
      // importAll() rolls the punches it stored into attendance_records itself
      // (first punch = IN, last = OUT) and reports them as result.attendance,
      // covering exactly the days the CSVs carried — including backdated ones
      // that the old fixed 7-day window would have missed.
      const result = await csvImporter.importAll()

      logger.info(`[ebio] csv import: ${JSON.stringify(result)}`)
      return res.status(200).json({
        success: true,
        message:
          result.files === 0
            ? `No new CSV files found in ${csvImporter.csvDir()}.`
            : `Imported ${result.stored} punch(es) from ${result.files} file(s).`,
        data: result,
      })
    } catch (error) {
      logger.error('[ebio] csv import failed:', error)
      next(error)
    }
  }

  /**
   * POST /api/ebio/sync?date=YYYY-MM-DD&location=<code>
   * Pull device logs for a date and upsert into attendance_logs.
   */
  async sync(req, res, next) {
    try {
      if (!ebio.isEnabled()) {
        return res.status(400).json({
          success: false,
          message: 'eBioServer integration is disabled. Set EBIO_ENABLED=true and EBIO_URL in .env.',
        })
      }

      const date = req.query.date || req.body?.date
      const location = req.query.location ?? req.body?.location

      const { fetched, stored, skipped } = await ebio.syncDeviceLogsToDb({ logDate: date, location })
      logger.info(`[ebio] sync date=${date || 'today'} fetched=${fetched} stored=${stored} skipped=${skipped}`)
      return res.status(200).json({
        success: true,
        message: fetched === 0
          ? 'No punch records returned by eBioServer for that date.'
          : `Synced ${stored} punch record(s) from eBioServer.`,
        data: { fetched, stored, skipped },
      })
    } catch (error) {
      logger.error('[ebio] sync failed:', error)
      next(error)
    }
  }

  /** GET /api/ebio/test — verify URL/credentials by fetching the device list. */
  async test(req, res, next) {
    try {
      if (!ebio.isEnabled()) {
        return res.status(400).json({
          success: false,
          message: 'eBioServer integration is disabled. Set EBIO_ENABLED=true and EBIO_URL in .env.',
        })
      }
      const result = await ebio.testConnection()
      return res.status(200).json({ success: true, message: 'Connected to eBioServer.', data: result })
    } catch (error) {
      logger.error('[ebio] test failed:', error)
      return res.status(502).json({ success: false, message: `eBioServer connection failed: ${error.message}` })
    }
  }
}

module.exports = new EbioController()
