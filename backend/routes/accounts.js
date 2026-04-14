const express = require('express');
const router = express.Router();
const { getAccounts, getAccountById, getAccountBalance } = require('../controllers/accountController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAccounts);
router.get('/:accountId', getAccountById);
router.get('/:accountId/balance', getAccountBalance);

module.exports = router;
