// Dev-only: mint a short-lived token for the existing ADMIN user so the
// invoice endpoints can be exercised over real HTTP.
require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const jwt = require('jsonwebtoken')
const { User } = require('./models')
;(async () => {
  const u = await User.findOne({ where: { role: 'ADMIN', isActive: true } })
  if (!u) { console.error('no admin user'); process.exit(1) }
  console.log(jwt.sign({ id: u.id, email: u.email, role: u.role, name: u.name },
    process.env.JWT_SECRET, { expiresIn: '15m' }))
  process.exit(0)
})()
