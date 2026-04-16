const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  message: { error: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email : 'MISSING_EMAIL';
    return email;
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword, firstName, lastName, phone } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    const result = await authController.register({ username, email, password, confirmPassword, firstName, lastName, phone });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authController.login({ email, password });
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.body?.refreshToken;
    const result = await authController.logout(token, refreshToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authController.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authController.changePassword(req.user.userId, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/request-password-otp', authMiddleware, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const result = await authController.requestPasswordOTP(req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authController.requestForgotPasswordOTP(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otpId, otp, newPassword } = req.body;
    const result = await authController.verifyPasswordOTP(email, otpId, otp, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/change-password-with-otp', authMiddleware, async (req, res) => {
  try {
    const { otpId, otp, newPassword } = req.body;
    const result = await authController.changePasswordWithOTP(req.user.userId, otpId, otp, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/admin/revoke-sessions', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { userId } = req.body;
    const result = await authController.revokeUserSessions(userId);
    res.json({ message: `Revoked ${result.revoked} sessions` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
