const express = require('express');
const router = express.Router();
const { getAccounts, createAccount, getAccountStatement } = require('../controllers/accountController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAccounts);
router.post('/', createAccount);
router.get('/:id/statement', getAccountStatement);

module.exports = router;
