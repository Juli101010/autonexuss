const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDb } = require('./src/db');
const routes = require('./src/routes');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const integrated = String(process.env.INTEGRATED_MODE || '').trim() === '1';
const internalKey = String(process.env.INTERNAL_KEY || '').trim();
const nodeEnv = String(process.env.NODE_ENV || 'development').trim();

function isUnsafeSecret(value) {
  const v = String(value || '').trim();
  return !v || ['supersecreto123', 'change_me_super_secret', 'dev-secret-change-me'].includes(v);
}

if (nodeEnv === 'production') {
  const errors = [];
  if (isUnsafeSecret(process.env.JWT_SECRET)) errors.push('JWT_SECRET debe ser fuerte y no puede ser demo.');
  if (integrated && isUnsafeSecret(internalKey)) errors.push('INTERNAL_KEY debe ser fuerte y no puede ser demo.');
  if (errors.length) throw new Error(`Configuracion insegura de produccion: ${errors.join(' ')}`);
}

app.get('/health', (_req, res) => res.json({ ok: true, integrated }));

if (integrated) {
  // Harden: require INTERNAL_KEY for all API access; UI is served by core, not here.
  app.use('/api', (req, res, next) => {
    const key = String(req.headers['x-internal-key'] || '').trim();
    if (!internalKey || key !== internalKey) return res.status(403).json({ error: 'Forbidden' });
    return next();
  });
} else {
  // Non-integrated dev mode: UI + optional internal key (core proxy can still work)
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (_req, res) => res.redirect('/login.html'));
}

app.use('/api', routes);

const port = Number(process.env.PORT || 3010);
const host = String(process.env.HOST || '127.0.0.1');

initDb()
  .then(() => app.listen(port, host, () => console.log(`Billing Service: http://${host}:${port}`)))
  .catch((e) => {
    console.error('DB init failed:', e);
    process.exit(1);
  });
