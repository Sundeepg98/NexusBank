const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { withSession } = require('./neo4j');
const { sendOTPNotification } = require('./notificationService');
const logger = require('./logger');

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const OTP_PURPOSE = Object.freeze({
  TRANSFER: 'transfer',
  BATCH_TRANSFER: 'batch_transfer',
  PASSWORD_CHANGE: 'password_change',
  FORGOT_PASSWORD: 'forgot_password',
  GENERAL: 'general'
});

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const checkLockout = async (otpId) => {
  const result = await withSession(session =>
    session.run(
      'MATCH (o:OTPEntry {otpId: $otpId}) RETURN o.failedAttempts as attempts',
      { otpId }
    )
  );

  if (result.records.length === 0) {
    return { locked: false, attempts: 0 };
  }

  const attempts = result.records[0].get('attempts')?.toNumber?.() || 0;
  return { locked: attempts >= MAX_ATTEMPTS, attempts };
};

const recordFailedAttempt = async (otpId) => {
  await withSession(session =>
    session.run(
      'MATCH (o:OTPEntry {otpId: $otpId}) SET o.failedAttempts = coalesce(o.failedAttempts, 0) + 1',
      { otpId }
    )
  );

  const lockout = await checkLockout(otpId);
  return lockout.attempts;
};

const createOtpEntry = async (data) => {
  const otp = generateOTP();
  const otpId = crypto.randomUUID();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  const hashedOtp = await bcrypt.hash(otp, 10);

  const isTest = process.env.NODE_ENV === 'test' && process.env.ENABLE_TEST_OTP === 'true';
  const plainOtpField = isTest ? ', plainOtp: $plainOtp' : '';

  await withSession(session =>
    session.run(
      `CREATE (o:OTPEntry {
        id: randomUUID(),
        otpId: $otpId,
        otp: $hashedOtp${plainOtpField},
        expiresAt: $expiresAt,
        createdAt: $createdAt,
        userId: $userId,
        purpose: $purpose,
        transferData: $transferData,
        failedAttempts: 0
      })
      RETURN o`,
      {
        otpId,
        hashedOtp,
        expiresAt,
        createdAt: Date.now(),
        userId: data.userId || '',
        purpose: data.purpose || 'general',
        transferData: JSON.stringify(data.transferData || null),
        ...(isTest ? { plainOtp: otp } : {})
      }
    )
  );

  sendOTPNotification('mock', { purpose: data.purpose, email: data.email, userId: data.userId });

  if (isTest) {
    return { otpId, expiresAt, otp };
  }
  return { otpId, expiresAt };
};

const verifyOtpEntry = async (otpId, otp) => {
  const lockoutStatus = await checkLockout(otpId);
  if (lockoutStatus.locked) {
    return { valid: false, reason: 'locked_out', attempts: lockoutStatus.attempts };
  }

  const result = await withSession(session =>
    session.run(
      'MATCH (o:OTPEntry {otpId: $otpId}) RETURN o',
      { otpId }
    )
  );

  if (result.records.length === 0) {
    return { valid: false, reason: 'invalid' };
  }

  const stored = result.records[0].get('o').properties;

  if (stored.expiresAt < Date.now()) {
    await withSession(session =>
      session.run('MATCH (o:OTPEntry {otpId: $otpId}) DELETE o', { otpId })
    );
    return { valid: false, reason: 'expired' };
  }

  const otpMatch = await bcrypt.compare(otp, stored.otp);
  if (!otpMatch) {
    const attempts = await recordFailedAttempt(otpId);
    if (attempts >= MAX_ATTEMPTS) {
      await withSession(session =>
        session.run('MATCH (o:OTPEntry {otpId: $otpId}) DELETE o', { otpId })
      );
      return { valid: false, reason: 'locked_out', attempts };
    }
    return { valid: false, reason: 'invalid', attempts };
  }

  let transferData = null;
  if (stored.transferData) {
    try {
      transferData = JSON.parse(stored.transferData);
    } catch (e) {
      logger.error('Failed to parse transferData', { stored });
    }
  }

  await withSession(session =>
    session.run('MATCH (o:OTPEntry {otpId: $otpId}) DELETE o', { otpId })
  );

  return { valid: true, data: { userId: stored.userId, purpose: stored.purpose, transferData } };
};

module.exports = {
  generateOTP,
  createOtpEntry,
  verifyOtpEntry,
  checkLockout,
  recordFailedAttempt,
  OTP_PURPOSE
};