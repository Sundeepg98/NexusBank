const express = require('express');
const router = express.Router();
const { getTransactions, transfer, createOTP, verifyOTP } = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getTransactions);
router.post('/transfer', transfer);
router.post('/generate-otp', createOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;