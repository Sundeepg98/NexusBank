const crypto = require('crypto');

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOtpEntry = (data) => {
  const otp = generateOTP();
  const otpId = crypto.randomUUID();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(otpId, { otp, expiresAt, ...data });
  return { otpId, otp, expiresAt };
};

const verifyOtpEntry = (otpId, otp) => {
  const stored = otpStore.get(otpId);
  if (!stored || stored.expiresAt < Date.now()) {
    otpStore.delete(otpId);
    return { valid: false, reason: 'expired' };
  }
  if (stored.otp !== otp) {
    return { valid: false, reason: 'invalid' };
  }
  otpStore.delete(otpId);
  return { valid: true, data: stored };
};

module.exports = { otpStore, generateOTP, createOtpEntry, verifyOtpEntry };
