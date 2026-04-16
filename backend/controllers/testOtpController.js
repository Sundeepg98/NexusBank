const { createOtpEntry, OTP_PURPOSE } = require('../config/otp');
const { authMiddleware } = require('../middleware/auth');

const createTestOTP = async (req, res) => {
  if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_TEST_OTP !== 'true') {
    return res.status(403).json({ error: 'Test OTP endpoints are not enabled' });
  }

  const purpose = req.params.purpose;
  const { transferData } = req.body || {};
  const userId = req.user.userId;

  if (!purpose) {
    return res.status(400).json({ error: 'Purpose is required' });
  }

  const validPurposes = Object.values(OTP_PURPOSE);
  if (!validPurposes.includes(purpose)) {
    return res.status(400).json({ error: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}` });
  }

  const result = await createOtpEntry({ userId, purpose, transferData });

  return res.status(201).json({
    otp: result.otp,
    otpId: result.otpId,
    expiresAt: result.expiresAt,
    expiresIn: Math.floor((result.expiresAt - Date.now()) / 1000)
  });
};

module.exports = { createTestOTP };
