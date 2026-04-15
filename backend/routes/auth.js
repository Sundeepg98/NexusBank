const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, blacklistedTokens } = require('../middleware/auth');

const withSession = require('../config/neo4j').withSession;
const { createOtpEntry, verifyOtpEntry } = require('../config/otp');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

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

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  blacklistedTokens.add(token);
  res.json({ message: 'Logged out successfully' });
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

    const { otpId, otp } = createOtpEntry({
      purpose: 'password_change',
      userId: req.user.userId,
      newPassword: newPassword
    });

    res.json({ message: 'OTP sent', otpId, otp });
  } catch (error) {
    console.error('Request password OTP error:', error);
    res.status(500).json({ error: 'Failed to request OTP' });
  }
});

router.post('/change-password-with-otp', authMiddleware, async (req, res) => {
  try {
    const { otpId, otp } = req.body;

    if (!otpId || !otp) {
      return res.status(400).json({ error: 'OTP ID and OTP are required' });
    }

    const verification = verifyOtpEntry(otpId, otp);

    if (!verification.valid) {
      return res.status(400).json({ error: `OTP ${verification.reason}` });
    }

    if (verification.data.purpose !== 'password_change') {
      return res.status(400).json({ error: 'Invalid OTP purpose' });
    }

    if (verification.data.userId !== req.user.userId) {
      return res.status(403).json({ error: 'OTP does not match user' });
    }

    const hashedNewPassword = await bcrypt.hash(verification.data.newPassword, 10);

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
