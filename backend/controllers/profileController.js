const bcrypt = require('bcryptjs');
const neo4j = require('neo4j-driver');
const { withSession } = require('../config/neo4j');
const { createOtpEntry, verifyOtpEntry } = require('../config/otp');
const { validatePassword } = require('../routes/auth');

const getProfile = async (req, res) => {
  try {
    const result = await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) RETURN u', { userId: req.user.userId })
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        createdAt: user.createdAt ? user.createdAt.toString() : null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    let query = 'MATCH (u:User {id: $userId}) SET u.firstName = $firstName, u.lastName = $lastName, u.phone = $phone';
    let params = { userId: req.user.userId, firstName, lastName, phone };

    if (avatar !== undefined) {
      query = 'MATCH (u:User {id: $userId}) SET u.firstName = $firstName, u.lastName = $lastName, u.phone = $phone, u.avatar = $avatar';
      params.avatar = avatar;
    }

    query += ' RETURN u';

    const result = await withSession(session =>
      session.run(query, params)
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    res.json({
      message: 'Profile updated',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        createdAt: user.createdAt ? user.createdAt.toString() : null
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const result = await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) RETURN u', { userId: req.user.userId })
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) SET u.password = $newPassword', { userId: req.user.userId, newPassword: hashedNewPassword })
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const requestPasswordChangeOTP = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character' });
    }

    const result = await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) RETURN u', { userId: req.user.userId })
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const { otpId } = await createOtpEntry({
      purpose: 'password_change',
      userId: req.user.userId
    });

    res.json({ message: 'OTP sent', otpId });
  } catch (error) {
    console.error('Request password OTP error:', error);
    res.status(500).json({ error: 'Failed to request OTP' });
  }
};

const changePasswordWithOTP = async (req, res) => {
  try {
    const { otpId, otp, newPassword } = req.body;

    if (!otpId || !otp) {
      return res.status(400).json({ error: 'OTP ID and OTP are required' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const verification = await verifyOtpEntry(otpId, otp);

    if (!verification.valid) {
      return res.status(400).json({ error: `OTP ${verification.reason}` });
    }

    if (verification.data.purpose !== 'password_change') {
      return res.status(400).json({ error: 'Invalid OTP purpose' });
    }

    if (verification.data.userId !== req.user.userId) {
      return res.status(403).json({ error: 'OTP does not match user' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) SET u.password = $newPassword', { userId: req.user.userId, newPassword: hashedNewPassword })
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password with OTP error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, requestPasswordChangeOTP, changePasswordWithOTP };
