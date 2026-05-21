const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');

function normalizeRole(role) {
  if (!role) return role;
  return String(role).trim().toUpperCase();
}

function getToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  }
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

/**
 * API auth middleware. Supports:
 * - Authorization: Bearer <token>
 * - Cookie: token=<jwt> (HttpOnly)
 */
module.exports = (requiredRole) => {
  const required = normalizeRole(requiredRole);

  return (req, res, next) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      decoded.role = normalizeRole(decoded.role);
      req.user = decoded;

      if (required && decoded.role !== required) return res.status(403).json({ error: 'Forbidden' });

      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

module.exports.normalizeRole = normalizeRole;
