const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const { JWT_SECRET, NODE_ENV } = require('../../config/env');
const { normalizeRole } = require('./auth.middleware');

async function findUserByEmail(email) {
  return db.get(`SELECT * FROM users WHERE email = ?`, [email]);
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Datos incompletos' });

    const exists = await findUserByEmail(email);
    if (exists) return res.status(400).json({ error: 'Usuario ya existe' });

    const hash = bcrypt.hashSync(password, 12);
    const r = await db.run(
      `INSERT INTO users (email, password, role, created_at, updated_at)
       VALUES (?, ?, 'ARTIST', datetime('now'), datetime('now'))`,
      [email, hash]
    );

    const user = { id: r.lastID, email, role: 'ARTIST' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Datos incompletos' });

    const user = await findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const role = normalizeRole(user.role) || 'ARTIST';
    const jwtPayload = { id: user.id, email: user.email, role };
    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '7d' });

    setAuthCookie(res, token);

    return res.json({ user: { id: user.id, email: user.email, role } });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ ok: true });
};

exports.me = async (req, res) => {
  try {
    const user = await db.get(
      `SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.role = normalizeRole(user.role);
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
};
