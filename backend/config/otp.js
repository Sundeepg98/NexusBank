const crypto = require('crypto');
const { withSession } = require('./neo4j');
const logger = require('./logger')?.logger;

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPNotification = (otp, channel = 'mock') => {
  if (logger?.info) {
    logger.info(`[OTP Notification] Channel: ${channel} | OTP sent`);
  } else {
    console.log(`[OTP Notification] Channel: ${channel} | OTP sent`);
  }
};

const cleanupExpiredOTPs = async () => {
  const now = Date.now().toString();
  await withSession(session =>
    session.run(
      'MATCH (o:OTPEntry) WHERE o.expiresAt < $now DELETE o',
      { now }
    )
  );
};

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
}

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

const clearFailedAttempts = async (otpId) => {
  await withSession(session =>
    session.run(
      'MATCH (o:OTPEntry {otpId: $otpId}) SET o.failedAttempts = 0',
      { otpId }
    )
  );
};

const createOtpEntry = async (data) => {
  const otp = generateOTP();
  const otpId = crypto.randomUUID();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  await withSession(session =>
    session.run(
      `CREATE (o:OTPEntry {
        id: randomUUID(),
        otpId: $otpId,
        otp: $otp,
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
        otp,
        expiresAt,
        createdAt: Date.now(),
        userId: data.userId || '',
        purpose: data.purpose || 'general',
        transferData: JSON.stringify(data.transferData || null)
      }
    )
  );

  sendOTPNotification(otp, 'mock');
  return { otpId, otp, expiresAt };
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

  if (stored.otp !== otp) {
    const attempts = await recordFailedAttempt(otpId);
    if (attempts >= MAX_ATTEMPTS) {
      await withSession(session =>
        session.run('MATCH (o:OTPEntry {otpId: $otpId}) DELETE o', { otpId })
      );
      return { valid: false, reason: 'locked_out', attempts };
    }
    return { valid: false, reason: 'invalid', attempts };
  }

  const transferData = stored.transferData ? JSON.parse(stored.transferData) : null;

  await withSession(session =>
    session.run('MATCH (o:OTPEntry {otpId: $otpId}) DELETE o', { otpId })
  );

  return { valid: true, data: { ...stored, transferData } };
};

const deleteOtpEntry = async (otpId) => {
  await withSession(session =>
    session.run('MATCH (o:OTPEntry {otpId: $otpId}) DELETE o', { otpId })
  );
};

module.exports = {
  generateOTP,
  createOtpEntry,
  verifyOtpEntry,
  checkLockout,
  recordFailedAttempt,
  clearFailedAttempts,
  deleteOtpEntry,
  cleanupExpiredOTPs
};