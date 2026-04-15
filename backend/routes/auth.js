const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authMiddleware, blacklistToken } = require('../middleware/auth');

const withSession = require('../config/neo4j').withSession;
const { createOtpEntry, verifyOtpEntry } = require('../config/otp');

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = async (user) => {
  const refreshToken = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await withSession(session =>
    session.run(
      `CREATE (rt:RefreshToken {
        token: $token,
        userId: $userId,
        email: $email,
        createdAt: datetime($createdAt),
        expiresAt: datetime($expiresAt),
        revoked: false
      })
      WITH rt MATCH (u:User {id: $userId})
      CREATE (u)-[:HAS_REFRESH_TOKEN]->(rt)`,
      { token: refreshToken, userId: user.id, email: user.email, createdAt, expiresAt }
    )
  );

  return { refreshToken, expiresAt: new Date(expiresAt).getTime() };
};

const cleanupExpiredRefreshTokens = async () => {
  await withSession(session =>
    session.run(
      'MATCH (rt:RefreshToken) WHERE rt.expiresAt < datetime() AND rt.revoked = false DELETE rt'
    )
  );
};

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupExpiredRefreshTokens, 60 * 60 * 1000);
}

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return { valid: false, error: 'Password must contain uppercase, lowercase, number, and special character' };
  }
  return { valid: true };
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword, firstName, lastName, phone } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const existing = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );
    if (existing.records.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await withSession(session =>
      session.run(
        `CREATE (u:User {
          id: randomUUID(),
          username: $username,
          email: $email,
          password: $hashedPassword,
          firstName: $firstName,
          lastName: $lastName,
          phone: $phone,
          createdAt: datetime()
        })
        RETURN u`,
        { username, email, hashedPassword, firstName, lastName, phone }
      )
    );

    const user = userResult.records[0].get('u').properties;

    const accountResult = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         CREATE (a:Account {
           id: randomUUID(),
           accountNumber: substring(randomUUID(), 0, 12),
           accountType: 'SAVINGS',
           balance: 10000,
           createdAt: datetime()
         })
         CREATE (u)-[:HAS_ACCOUNT]->(a)
         RETURN a`,
        { userId: user.id }
      )
    );

    const account = accountResult.records[0].get('a').properties;

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, username, email, firstName, lastName },
      account: { id: account.id, accountNumber: account.accountNumber, accountType: account.accountType, balance: account.balance }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );

    if (result.records.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const { refreshToken, expiresAt } = await generateRefreshToken(user);

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      refreshTokenExpiry: expiresAt,
      user: { id: user.id, username: user.username, email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  await blacklistToken(token);
  const refreshToken = req.body?.refreshToken;
  if (refreshToken) {
    await withSession(session =>
      session.run(
        'MATCH (rt:RefreshToken {token: $token}) SET rt.revoked = true',
        { token: refreshToken }
      )
    );
  }
  res.json({ message: 'Logged out successfully' });
});

router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokenResult = await withSession(session =>
      session.run(
        'MATCH (rt:RefreshToken {token: $token}) RETURN rt',
        { token: refreshToken }
      )
    );

    if (tokenResult.records.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokenData = tokenResult.records[0].get('rt').properties;

    if (tokenData.revoked) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      await withSession(session =>
        session.run('MATCH (rt:RefreshToken {token: $token}) DELETE rt', { token: refreshToken })
      );
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const userResult = await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) RETURN u', { userId: tokenData.userId })
    );

    if (userResult.records.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.records[0].get('u').properties;

    await withSession(session =>
      session.run('MATCH (rt:RefreshToken {token: $token}) SET rt.revoked = true', { token: refreshToken })
    );

    const newAccessToken = generateAccessToken(user);
    const { refreshToken: newRefreshToken, expiresAt: newExpiresAt } = await generateRefreshToken(user);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      refreshTokenExpiry: newExpiresAt
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
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

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) SET u.password = $newPassword', { userId: req.user.userId, newPassword: hashedNewPassword })
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.post('/request-password-otp', authMiddleware, async (req, res) => {
  try {
    const { currentPassword } = req.body;

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
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const user = result.records[0].get('u').properties;

    const { otpId } = await createOtpEntry({
      purpose: 'forgot_password',
      userId: user.id,
      transferData: { email: email }
    });

    res.json({ message: 'OTP sent to your email', otpId });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otpId, otp, newPassword } = req.body;

    if (!email || !otpId || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, otpId, otp, and newPassword are required' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const verification = await verifyOtpEntry(otpId, otp);

    if (!verification.valid) {
      return res.status(400).json({ error: `OTP ${verification.reason}` });
    }

    if (verification.data.purpose !== 'forgot_password') {
      return res.status(400).json({ error: 'Invalid OTP purpose' });
    }

    if (verification.data.transferData?.email !== email) {
      return res.status(400).json({ error: 'Invalid OTP or email mismatch' });
    }

    const result = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await withSession(session =>
      session.run('MATCH (u:User {email: $email}) SET u.password = $newPassword', { email, newPassword: hashedNewPassword })
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.post('/change-password-with-otp', authMiddleware, async (req, res) => {
  try {
    const { otpId, otp, newPassword } = req.body;

    if (!otpId || !otp || !newPassword) {
      return res.status(400).json({ error: 'OTP ID, OTP, and newPassword are required' });
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
});

module.exports = router;
