const fs = require('fs');
const path = require('path');

function loadDotenv() {
  const envPath = path.join(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotenv();

function env(key, fallback) {
  const v = process.env[key];
  return (v === undefined || v === '') ? fallback : v;
}

const PORT = Number(env('PORT', '3001'));
const JWT_SECRET = env('JWT_SECRET', 'dev-secret-change-me');
const NODE_ENV = env('NODE_ENV', 'development');

module.exports = { PORT, JWT_SECRET, NODE_ENV };
