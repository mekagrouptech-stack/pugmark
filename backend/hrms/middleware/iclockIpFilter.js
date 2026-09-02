const logger = require('../utils/logger')

/**
 * Source IP of the request.
 *
 * Behind Nginx, req.ip is only trustworthy because index.js sets `trust proxy`
 * in production; without that every request reports as 127.0.0.1. Node reports
 * IPv4 over IPv6 sockets as ::ffff:1.2.3.4, so that prefix is stripped.
 */
function clientIp(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  return ip.replace(/^::ffff:/, '')
}

// Loopback is always permitted so local curl smoke-tests keep working even
// when an allowlist is configured.
const LOOPBACK = new Set(['127.0.0.1', '::1'])

function parseAllowedIps() {
  return String(process.env.ICLOCK_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)
}

/**
 * Restricts /iclock to known device IPs.
 *
 * ICLOCK_ALLOWED_IPS is a comma-separated list in backend/.env, e.g.
 *   ICLOCK_ALLOWED_IPS=13.126.23.34,203.0.113.9
 *
 * Leave it UNSET to disable the check (any IP may push). That is the default
 * so existing installs are not broken by an upgrade, but on a public IP it
 * means anyone who finds the port can post forged punches — see the warning
 * logged at startup.
 *
 * This is a coarse network control, not authentication: a source IP can be
 * spoofed, and every device behind one office NAT shares an address. It is
 * worth having because it stops opportunistic internet scanners outright.
 */
const restrictIclockIp = (req, res, next) => {
  const allowed = parseAllowedIps()

  // Not configured → check disabled.
  if (allowed.length === 0) return next()

  const ip = clientIp(req)
  if (LOOPBACK.has(ip) || allowed.includes(ip)) return next()

  // Plain-text 403: the device expects text/plain, and logging the rejection
  // is the point — this is how you spot someone probing the open port.
  logger.warn(`[iclock] REJECTED push from ip=${ip} SN=${req.query.SN || 'unknown'} (not in ICLOCK_ALLOWED_IPS)`)
  return res.set('Content-Type', 'text/plain').status(403).send('Forbidden')
}

/**
 * One-time startup notice so an unrestricted public deployment is not silent.
 */
const logIclockIpPolicy = () => {
  const allowed = parseAllowedIps()
  if (allowed.length === 0) {
    logger.warn('⚠️  ICLOCK_ALLOWED_IPS not set — /iclock accepts punches from ANY IP')
  } else {
    logger.info(`🔒 /iclock restricted to: ${allowed.join(', ')} (+ loopback)`)
  }
}

module.exports = { restrictIclockIp, clientIp, logIclockIpPolicy }
