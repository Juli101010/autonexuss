const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function decodeFromCookie(req) {
  const token = req.cookies?.token;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Server-side guard for HTML pages.
 * - No session -> redirect login
 * - Wrong role -> redirect to correct dashboard
 */

function requirePageRole(requiredRole) {
  const required = Array.isArray(requiredRole)
    ? requiredRole.map(normalizeRole)
    : [normalizeRole(requiredRole)];

  return (req, res, next) => {
    const user = decodeFromCookie(req);
    if (!user) return res.redirect('/login.html');

    const role = normalizeRole(user.role);
    const allowAny = required.includes('ANY');
    const ok = allowAny || required.includes(role);
    if (!ok) return res.redirect('/app.html');

    req.user = user;
    next();
  };
}


module.exports = { requirePageRole };
