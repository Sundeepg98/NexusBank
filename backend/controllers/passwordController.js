const bcrypt = require('bcryptjs');
const { withSession } = require('../config/neo4j');
const { createOtpEntry, verifyOtpEntry, OTP_PURPOSE } = require('../config/otp');
const { validatePassword } = require('../utils/passwordValidator');

const changePassword = async (userId, currentPassword, newPassword) => {
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  const result = await withSession(session =>
    session.run('MATCH (u:User {id: $userId}) RETURN u', { userId })
  );

  if (result.records.length === 0) {
    throw new Error('User not found');
  }

  const user = result.records[0].get('u').properties;
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await withSession(session =>
    session.run(
      'MATCH (u:User {id: $userId}) SET u.password = $newPassword',
      { userId, newPassword: hashedNewPassword }
    )
  );

  return { message: 'Password changed successfully' };
};

const requestPasswordOTP = async (userId) => {
  const result = await withSession(session =>
    session.run('MATCH (u:User {id: $userId}) RETURN u', { userId })
  );

  if (result.records.length === 0) {
    throw new Error('User not found');
  }

  const { otpId } = await createOtpEntry({
    purpose: OTP_PURPOSE.PASSWORD_CHANGE,
    userId
  });

  return { message: 'OTP sent', otpId };
};

const verifyPasswordOTP = async (email, otpId, otp, newPassword) => {
  if (!email || !otpId || !otp || !newPassword) {
    throw new Error('Email, otpId, otp, and newPassword are required');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  const verification = await verifyOtpEntry(otpId, otp);

  if (!verification.valid) {
    throw new Error(`OTP ${verification.reason}`);
  }

  if (verification.data.purpose !== OTP_PURPOSE.FORGOT_PASSWORD) {
    throw new Error('Invalid OTP purpose');
  }

  if (verification.data.transferData?.email !== email) {
    throw new Error('Invalid OTP or email mismatch');
  }

  const result = await withSession(session =>
    session.run('MATCH (u:User {email: $email}) RETURN u', { email })
  );

  if (result.records.length === 0) {
    throw new Error('User not found');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await withSession(session =>
    session.run(
      'MATCH (u:User {email: $email}) SET u.password = $newPassword',
      { email, newPassword: hashedNewPassword }
    )
  );

  return { message: 'Password reset successfully' };
};

const changePasswordWithOTP = async (userId, otpId, otp, newPassword) => {
  if (!otpId || !otp || !newPassword) {
    throw new Error('OTP ID, OTP, and newPassword are required');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  const verification = await verifyOtpEntry(otpId, otp);

  if (!verification.valid) {
    throw new Error(`OTP ${verification.reason}`);
  }

  if (verification.data.purpose !== OTP_PURPOSE.PASSWORD_CHANGE) {
    throw new Error('Invalid OTP purpose');
  }

  if (verification.data.userId !== userId) {
    throw new Error('OTP does not match user');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await withSession(session =>
    session.run(
      'MATCH (u:User {id: $userId}) SET u.password = $newPassword',
      { userId, newPassword: hashedNewPassword }
    )
  );

  return { message: 'Password changed successfully' };
};

const requestForgotPasswordOTP = async (email) => {
  if (!email) {
    throw new Error('Email is required');
  }

  const result = await withSession(session =>
    session.run('MATCH (u:User {email: $email}) RETURN u', { email })
  );

  if (result.records.length === 0) {
    return { message: 'If that email exists, an OTP has been sent' };
  }

  const user = result.records[0].get('u').properties;

  const { otpId } = await createOtpEntry({
    purpose: OTP_PURPOSE.FORGOT_PASSWORD,
    userId: user.id,
    transferData: { email }
  });

  return { message: 'OTP sent to your email', otpId };
};

module.exports = {
  changePassword,
  requestPasswordOTP,
  verifyPasswordOTP,
  changePasswordWithOTP,
  requestForgotPasswordOTP
};
