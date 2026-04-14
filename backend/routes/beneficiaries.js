const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getBeneficiaries, addBeneficiary, deleteBeneficiary, updateBeneficiary } = require('../controllers/beneficiaryController');

router.get('/', authMiddleware, getBeneficiaries);
router.post('/', authMiddleware, addBeneficiary);
router.put('/:id', authMiddleware, updateBeneficiary);
router.delete('/:id', authMiddleware, deleteBeneficiary);

module.exports = router;
