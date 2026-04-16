const express = require('express');
const router = express.Router();
const { createTestOTP } = require('../controllers/testOtpController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:purpose', authMiddleware, createTestOTP);

module.exports = router;
