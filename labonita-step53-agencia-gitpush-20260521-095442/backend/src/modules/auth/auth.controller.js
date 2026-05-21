const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const { JWT_SECRET, NODE_ENV, ALLOW_PUBLIC_REGISTER } = require('../../config/env');
const { normalizeRole } = require('./auth.middleware');

async function findUserByEmail(email) {
  return db.get(`SELECT * FROM users WHERE lower(email) = lower(?)`, [email]);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function validatePassword(password) {
  const value = String(password || '');
  const missing = [];

  if (value.length < 8) missing.push('8 caracteres');
  if (!/[A-Z]/.test(value)) missing.push('una mayúscula');
  if (!/[a-z]/.test(value)) missing.push('una minúscula');
  if (!/\d/.test(value)) missing.push('un número');

  return missing;
}

function normalizeOnboardingProfile(value) {
  const raw = String(value || '').trim().toUpperCase();
  return raw === 'PUNTUAL' ? 'PUNTUAL' : 'ASOCIADA';
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
    if (NODE_ENV === 'production' && String(ALLOW_PUBLIC_REGISTER) !== '1') {
      return res.status(403).json({ error: 'El registro público está deshabilitado.' });
    }

    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Completá email y contraseña.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Ingresá un email válido.' });

    const passwordMissing = validatePassword(password);
    if (passwordMissing.length) {
      return res.status(400).json({
        error: `La contraseña debe tener al menos ${passwordMissing.join(', ')}.`,
      });
    }

    const exists = await findUserByEmail(email);
    if (exists) return res.status(400).json({ error: 'Ya existe una cuenta registrada con ese email.' });

    const hash = bcrypt.hashSync(password, 12);
    const onboardingProfile = normalizeOnboardingProfile(req.body?.profile_type || req.body?.account_type);
    const r = await db.run(
      `INSERT INTO users (email, password, role, onboarding_profile, onboarding_status, created_at, updated_at)
       VALUES (?, ?, 'ARTIST', ?, 'PENDIENTE_VALIDACION', datetime('now'), datetime('now'))`,
      [email, hash, onboardingProfile]
    );

    const onboardingType = onboardingProfile === 'PUNTUAL' ? 'ONBOARDING_PUNTUAL' : 'ONBOARDING_ASSOCIADO';
    const onboardingData = {
      form_template: onboardingType,
      type: onboardingType,
      account_type: onboardingProfile,
      onboarding_profile: onboardingProfile,
      onboarding_status: 'PENDIENTE_VALIDACION',
      email,
      source: 'REGISTER_2026',
    };
    await db.run(
      `INSERT INTO petitions (user_id, type, data, status, locked, created_at, updated_at)
       VALUES (?, ?, ?, 'PENDIENTE_VALIDACION', 1, datetime('now'), datetime('now'))`,
      [r.lastID, onboardingType, JSON.stringify(onboardingData)]
    );

    const user = { id: r.lastID, email, role: 'ARTIST', onboarding_profile: onboardingProfile, onboarding_status: 'PENDIENTE_VALIDACION' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'No pudimos crear la cuenta. Intentá de nuevo.' });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Completá email y contraseña.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Ingresá un email válido.' });

    const user = await findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const role = normalizeRole(user.role) || 'ARTIST';
    const jwtPayload = {
      id: user.id,
      email: user.email,
      role,
      onboarding_profile: normalizeOnboardingProfile(user.onboarding_profile),
      onboarding_status: String(user.onboarding_status || 'PENDIENTE_VALIDACION').toUpperCase(),
    };
    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '7d' });

    setAuthCookie(res, token);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role,
        onboarding_profile: normalizeOnboardingProfile(user.onboarding_profile),
        onboarding_status: String(user.onboarding_status || 'PENDIENTE_VALIDACION').toUpperCase(),
      },
    });
  } catch {
    return res.status(500).json({ error: 'No pudimos iniciar sesión. Intentá de nuevo.' });
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ ok: true });
};

exports.me = async (req, res) => {
  try {
    const user = await db.get(
      `SELECT id, email, role, onboarding_profile, onboarding_status, created_at, updated_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    user.role = normalizeRole(user.role);
    user.onboarding_profile = normalizeOnboardingProfile(user.onboarding_profile);
    user.onboarding_status = String(user.onboarding_status || 'PENDIENTE_VALIDACION').toUpperCase();
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'No pudimos obtener la sesión.' });
  }
};
