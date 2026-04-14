const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');

router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
