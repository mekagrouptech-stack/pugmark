const express = require('express')
const router = express.Router()
const letterController = require('../controllers/letterController')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

router.use(authenticate)
router.post('/send-email', authorize(['ADMIN', 'HR', 'HEAD_HR']), letterController.sendLetterEmail)

module.exports = router
