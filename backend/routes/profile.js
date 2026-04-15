const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword, requestPasswordChangeOTP, changePasswordWithOTP } = require('../controllers/profileController');
const { deleteUser } = require('../controllers/userController');

router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);
router.post('/request-password-otp', authMiddleware, requestPasswordChangeOTP);
router.post('/change-password-with-otp', authMiddleware, changePasswordWithOTP);
router.delete('/user', authMiddleware, deleteUser);

module.exports = router;
