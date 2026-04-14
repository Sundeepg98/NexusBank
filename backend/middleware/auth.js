const jwt = require('jsonwebtoken');

const blacklistedTokens = new Set();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  if (blacklistedTokens.has(token)) return res.status(401).json({ error: 'Token has been revoked' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authMiddleware, blacklistedTokens };
