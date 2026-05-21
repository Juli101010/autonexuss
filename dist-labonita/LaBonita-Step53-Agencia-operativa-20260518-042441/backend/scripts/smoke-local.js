const assert = require('assert');

const baseUrl = String(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return {
    status: res.status,
    body,
    cookie: res.headers.get('set-cookie') || '',
  };
}

async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.strictEqual(res.status, 200, `login ${email} should return 200`);
  assert.ok(res.cookie.includes('token='), `login ${email} should set auth cookie`);
  return res.cookie.split(';')[0];
}

async function main() {
  const loginPage = await fetch(`${baseUrl}/login.html`);
  assert.strictEqual(loginPage.status, 200, 'login page should be available');

  const adminCookie = await login('admin@test.com', '123456');
  const artistCookie = await login('artist@test.com', '123456');

  const adminMyPetitions = await request('/api/ops/my/petitions', { cookie: adminCookie });
  assert.strictEqual(adminMyPetitions.status, 403, 'ADMIN must not use artist /ops/my endpoints');

  const artistTemplates = await request('/api/ops/templates', { cookie: artistCookie });
  assert.strictEqual(artistTemplates.status, 200, 'ARTIST should list operational templates');

  const delsol = await request('/api/admin/delsol/status', { cookie: adminCookie });
  assert.strictEqual(delsol.status, 200, 'ADMIN should read DELSOL status');
  assert.strictEqual(delsol.body.mode, 'mock', 'DELSOL should remain in mock mode for local smoke');

  const exportCsv = await fetch(`${baseUrl}/api/admin/ops/export/control-total.csv`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(exportCsv.status, 200, 'ADMIN should export control total CSV');

  console.log('Smoke local OK:', baseUrl);
}

main().catch((err) => {
  console.error('Smoke local FAILED');
  console.error(err);
  process.exit(1);
});
