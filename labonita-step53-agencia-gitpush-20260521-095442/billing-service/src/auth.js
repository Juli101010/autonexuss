const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const internal = String(req.headers['x-internal-key'] || '').trim();
  const internalKey = String(process.env.INTERNAL_KEY || '').trim();
  if (internalKey && internal && internal === internalKey) {
    req.user = { id: 0, role: 'ADMIN', internal: true };
    return next();
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (String(payload.role || '').toUpperCase() !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireAdmin };
