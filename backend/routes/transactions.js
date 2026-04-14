const express = require('express');
const router = express.Router();
const { getTransactions, transfer } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getTransactions);
router.post('/transfer', transfer);

module.exports = router;
