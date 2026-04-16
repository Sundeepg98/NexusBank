const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { withSession } = require('../config/neo4j');
const { blacklistToken, blacklistRefreshToken, isRefreshTokenBlacklisted } = require('../middleware/auth');

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_TOKEN_EXPIRY = '15m';

const generateAccessToken = (email, user) => {
  if (!user || !user.id) {
    throw new Error('Invalid user object for token generation');
  }
  return jwt.sign(
    { userId: user.id, email: email || user.email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const userResult = await withSession(session =>
    session.run('MATCH (u:User {id: $userId}) RETURN u', { userId })
  );

  if (userResult.records.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.records[0].get('u').properties;
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
      { token: refreshToken, userId, email: user.email, createdAt, expiresAt }
    )
  );

  return { refreshToken, expiresAt: new Date(expiresAt).getTime() };
};

const login = async ({ email, password }) => {
  const bcrypt = require('bcryptjs');
  const result = await withSession(session =>
    session.run('MATCH (u:User {email: $email}) RETURN u', { email })
  );

  if (result.records.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.records[0].get('u').properties;
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const accessToken = generateAccessToken(user.email, user);
  const { refreshToken, expiresAt } = await generateRefreshToken(user.id);

  return {
    message: 'Login successful',
    token: accessToken,
    refreshToken,
    refreshTokenExpiry: expiresAt,
    user: {
      id: user.id,
      username: user.username,
      email,
      firstName: user.firstName,
      lastName: user.lastName
    }
  };
};

const logout = async (token, refreshToken) => {
  if (token) {
    await blacklistToken(token);
  }
  if (refreshToken) {
    await withSession(session =>
      session.run(
        'MATCH (rt:RefreshToken {token: $token}) SET rt.revoked = true',
        { token: refreshToken }
      )
    );
    await blacklistRefreshToken(refreshToken);
  }
  return { message: 'Logged out successfully' };
};

const refreshTokenFn = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token required');
  }

  const tokenResult = await withSession(session =>
    session.run(
      'MATCH (rt:RefreshToken {token: $token}) RETURN rt',
      { token: refreshToken }
    )
  );

  if (tokenResult.records.length === 0) {
    throw new Error('Invalid refresh token');
  }

  const tokenData = tokenResult.records[0].get('rt').properties;

  if (await isRefreshTokenBlacklisted(refreshToken)) {
    const logger = require('../config/logger');
    logger.warn('Blacklisted refresh token used', { token: refreshToken.substring(0, 10) + '...' });
    throw new Error('Session has been terminated');
  }

  if (tokenData.revoked) {
    throw new Error('Refresh token has been revoked');
  }

  if (new Date(tokenData.expiresAt) < new Date()) {
    await withSession(session =>
      session.run('MATCH (rt:RefreshToken {token: $token}) DELETE rt', { token: refreshToken })
    );
    throw new Error('Refresh token expired');
  }

  const userResult = await withSession(session =>
    session.run('MATCH (u:User {id: $userId}) RETURN u', { userId: tokenData.userId })
  );

  if (userResult.records.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.records[0].get('u').properties;

  await withSession(session =>
    session.run('MATCH (rt:RefreshToken {token: $token}) SET rt.revoked = true', { token: refreshToken })
  );

  const newAccessToken = generateAccessToken(user.email, user);
  const { refreshToken: newRefreshToken, expiresAt: newExpiresAt } = await generateRefreshToken(user.id);

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken,
    refreshTokenExpiry: newExpiresAt
  };
};

const revokeUserSessions = async (userId) => {
  const result = await withSession(session =>
    session.run(
      'MATCH (u:User {id: $userId})-[:HAS_REFRESH_TOKEN]->(rt:RefreshToken) WHERE NOT rt.revoked SET rt.revoked = true RETURN rt',
      { userId }
    )
  );
  return { revoked: result.records.length };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  login,
  logout,
  refreshToken: refreshTokenFn,
  revokeUserSessions
};
