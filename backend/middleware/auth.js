const jwt = require('jsonwebtoken');
const { withSession } = require('../config/neo4j');

const blacklistToken = async (token) => {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return;
  
  const expiresAt = new Date(decoded.exp * 1000).toISOString();
  const blacklistedAt = new Date().toISOString();

  await withSession(session =>
    session.run(
      `CREATE (bt:BlacklistedToken {
        token: $token,
        expiresAt: datetime($expiresAt),
        blacklistedAt: datetime($blacklistedAt)
      })`,
      { token, expiresAt, blacklistedAt }
    )
  );
};

const isTokenBlacklisted = async (token) => {
  const result = await withSession(session =>
    session.run('MATCH (bt:BlacklistedToken {token: $token}) RETURN bt', { token })
  );
  return result.records.length > 0;
};

const blacklistRefreshToken = async (refreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const blacklistedAt = new Date().toISOString();

  await withSession(session =>
    session.run(
      `CREATE (brt:BlacklistedRefreshToken {
        token: $token,
        expiresAt: datetime($expiresAt),
        blacklistedAt: datetime($blacklistedAt)
      })`,
      { token: refreshToken, expiresAt, blacklistedAt }
    )
  );
};

const isRefreshTokenBlacklisted = async (refreshToken) => {
  const result = await withSession(session =>
    session.run('MATCH (brt:BlacklistedRefreshToken {token: $token}) RETURN brt', { token: refreshToken })
  );
  return result.records.length > 0;
};

const cleanupExpiredTokens = async () => {
  const now = new Date().toISOString();
  await withSession(session =>
    session.run(
      `MATCH (bt:BlacklistedToken) WHERE bt.expiresAt < datetime($now) DELETE bt`,
      { now }
    )
  );
  await withSession(session =>
    session.run(
      `MATCH (brt:BlacklistedRefreshToken) WHERE brt.expiresAt < datetime($now) DELETE brt`,
      { now }
    )
  );
};

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) return res.status(401).json({ error: 'Token has been revoked' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = { 
  authMiddleware, 
  blacklistToken, 
  blacklistRefreshToken, 
  isRefreshTokenBlacklisted,
  isTokenBlacklisted,
  cleanupExpiredTokens 
};