const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getBeneficiaries, addBeneficiary, deleteBeneficiary } = require('../controllers/beneficiaryController');

router.get('/', authMiddleware, getBeneficiaries);
router.post('/', authMiddleware, addBeneficiary);
router.delete('/:id', authMiddleware, deleteBeneficiary);

module.exports = router;
