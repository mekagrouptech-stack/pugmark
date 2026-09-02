const express = require('express')
const router = express.Router()
const iclockController = require('../controllers/iclockController')
const { restrictIclockIp } = require('../middleware/iclockIpFilter')

/**
 * eSSL / ZKTeco ADMS "Push" endpoints.
 *
 * NOTE: deliberately UNAUTHENTICATED. The terminal has no way to present a JWT
 * — it only identifies itself by its serial number (SN). Keep this path
 * firewalled to the device's IP in production, or put it behind a reverse-proxy
 * ACL. It is mounted outside /api so the app's rate limiter does not throttle
 * a device pushing punches every second.
 *
 * The device sends TAB-SEPARATED PLAIN TEXT, not JSON. express.text() is scoped
 * to this router only, so the app-wide express.json() used by /api/* is
 * untouched. `type: () => true` is required because the terminal sends odd or
 * missing Content-Type headers depending on firmware.
 */
router.use(express.text({ type: () => true, limit: '10mb' }))

// Optional network-level guard: when ICLOCK_ALLOWED_IPS is set in backend/.env,
// only those source IPs (plus loopback) may reach the handlers below.
router.use(restrictIclockIp)

// Handshake — device asks for its config on boot/reconnect.
router.get('/cdata', iclockController.handshake)

// Punch upload (table=ATTLOG) and other tables (OPERLOG etc. — acknowledged only).
router.post('/cdata', iclockController.receiveData)

// Command polling / command result reporting.
router.get('/getrequest', iclockController.getRequest)
router.post('/getrequest', iclockController.getRequest)
router.post('/devicecmd', iclockController.deviceCmd)

// Liveness probe — some firmwares ping before they start pushing punches.
router.get('/ping', iclockController.ping)
router.post('/ping', iclockController.ping)

module.exports = router
