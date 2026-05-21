const assert = require('assert');

const baseUrl = String(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
const expectedDelsolMode = String(process.env.SMOKE_EXPECT_DELSOL_MODE || process.env.DELSOL_MODE || 'mock').toLowerCase();

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

function assertStatus(res, status, message) {
  assert.strictEqual(
    res.status,
    status,
    `${message}. Got ${res.status}: ${JSON.stringify(res.body).slice(0, 500)}`
  );
}

async function optionalRequest(path, options = {}) {
  const res = await request(path, options);
  if (res.status === 404) {
    console.log(`Skipping optional smoke check; endpoint not found: ${path}`);
    return null;
  }
  return res;
}

function invoicePetitionPayload() {
  const stamp = Date.now();
  return {
    type: 'ALTA_FACTURA',
    petition_date: '2026-05-18',
    responsible_name: 'Smoke Admin',
    company_show: 'Smoke Flow - factura interna',
    reference: `SMOKE-FACTURA-${stamp}`,
    pais_ciudad_actuacion: 'Madrid, España',
    fecha_inicio_actuacion: '2026-06-20',
    fecha_fin_actuacion: '2026-06-20',
    requiere_a1: 'NO',
    client_name: 'Cliente Smoke S.L.',
    client_tax_id: 'B12345678',
    client_email: 'cliente-smoke@example.test',
    factura_direccion: 'Calle Smoke 1',
    factura_cp: '28001',
    factura_ciudad: 'Madrid',
    factura_provincia: 'Madrid',
    factura_pais: 'España',
    factura_concepto: 'Actuación smoke factura interna',
    factura_total_sin_iva: 1200,
    iva_tipo: 'IVA_21',
    artist_name: 'Artista Smoke',
    artist_tax_id: '12345678A',
    service_date: '2026-06-20',
    project_place: 'Madrid',
    description: 'Actuación smoke factura interna',
    total_presupuestado: 1200,
  };
}

async function main() {
  const loginPage = await fetch(`${baseUrl}/login.html`);
  assert.strictEqual(loginPage.status, 200, 'login page should be available');

  const adminCookie = await login('admin@test.com', '123456');
  const artistCookie = await login('artist@test.com', '123456');

  const adminMyPetitions = await request('/api/ops/my/petitions', { cookie: adminCookie });
  assertStatus(adminMyPetitions, 403, 'ADMIN must not use artist /ops/my endpoints');

  const artistAdminPetitions = await request('/api/admin/ops/petitions', { cookie: artistCookie });
  assertStatus(artistAdminPetitions, 403, 'ARTIST must not list admin operational petitions');

  const artistTemplates = await request('/api/ops/templates', { cookie: artistCookie });
  assertStatus(artistTemplates, 200, 'ARTIST should list operational templates');

  const delsol = await request('/api/admin/delsol/status', { cookie: adminCookie });
  assertStatus(delsol, 200, 'ADMIN should read DELSOL status');
  assert.strictEqual(delsol.body.mode, expectedDelsolMode, `DELSOL mode should match ${expectedDelsolMode} for this smoke run`);

  const noAuthExport = await request('/api/admin/ops/export/control-total.csv');
  assertStatus(noAuthExport, 401, 'Control Total export must require login');

  const artistExport = await request('/api/admin/ops/export/control-total.csv', { cookie: artistCookie });
  assertStatus(artistExport, 403, 'Control Total export must require ADMIN role');

  const createPetition = await optionalRequest('/api/admin/ops/petitions', {
    cookie: adminCookie,
    method: 'POST',
    body: JSON.stringify(invoicePetitionPayload()),
  });

  if (createPetition) {
    assertStatus(createPetition, 201, 'ADMIN should create a complete invoice petition');
    assert.ok(createPetition.body.id, 'created petition should return id');
    assert.deepStrictEqual(createPetition.body.missing, [], 'created invoice petition should have no missing required fields');

    const petitionId = createPetition.body.id;

    const artistCreateInvoice = await request(`/api/admin/ops/petitions/${petitionId}/invoices`, {
      cookie: artistCookie,
      method: 'POST',
      body: JSON.stringify({ subtotal: 1200, iva_rate: 21 }),
    });
    assertStatus(artistCreateInvoice, 403, 'ARTIST must not create internal invoices');

    const validate = await optionalRequest(`/api/admin/ops/petitions/${petitionId}/validate`, {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (validate) {
      assertStatus(validate, 200, 'ADMIN should validate a complete invoice petition');
      assert.strictEqual(validate.body.status, 'VALIDADA', 'petition should become VALIDADA');
    }

    const laboral = await optionalRequest(`/api/admin/ops/petitions/${petitionId}/laboral`, {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify({ movement_type: 'ALTA_BAJA', requires_a1: 'NO' }),
    });
    if (laboral) {
      assertStatus(laboral, 201, 'ADMIN should prepare laboral movement before invoice');
      assert.strictEqual(laboral.body.status, 'PREPARADO', 'laboral movement should be prepared');
    }

    const invoice = await optionalRequest(`/api/admin/ops/petitions/${petitionId}/invoices`, {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify({
        subtotal: 1200,
        iva_rate: 21,
        commission_rate: 6,
        irpf_rate: 2,
        extra_fees_amount: 0,
      }),
    });
    if (invoice) {
      assertStatus(invoice, 201, 'ADMIN should create internal invoice');
      assert.ok(/^LB-FAC-BORRADOR-2026-\d{6}$/.test(invoice.body.internal_number), 'invoice should get internal draft number');
      assert.strictEqual(invoice.body.total, 1452, 'invoice total should include IVA');
      assert.ok(invoice.body.net_artist > 0, 'invoice should calculate artist net amount');
    }

    const liquidation = await optionalRequest(`/api/admin/ops/petitions/${petitionId}/liquidations`, {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify({
        person_name: 'Artista Smoke',
        person_tax_id: '12345678A',
        gross_amount: 1452,
        expense_reimbursements: 0,
      }),
    });
    if (liquidation) {
      assertStatus(liquidation, 201, 'ADMIN should create liquidation after internal invoice');
      assert.ok(Number(liquidation.body.net_amount) > 0, 'liquidation should calculate net amount');
    }

    const detail = await optionalRequest(`/api/admin/ops/petitions/${petitionId}`, { cookie: adminCookie });
    if (detail) {
      assertStatus(detail, 200, 'ADMIN should read petition detail after invoice creation');
      assert.strictEqual(detail.body.petition.status, 'LIQUIDACION_INTERNA', 'petition should be in LIQUIDACION_INTERNA status');
      assert.ok(detail.body.invoices.length >= 1, 'petition detail should include created internal invoice');
      assert.ok(detail.body.liquidations.length >= 1, 'petition detail should include liquidation');
      assert.ok(detail.body.queue.some((item) => item.entity_type === 'invoice'), 'DELSOL queue should include invoice draft sync item');
      assert.ok(detail.body.queue.some((item) => item.entity_type === 'liquidation'), 'DELSOL queue should include liquidation sync item');
    }

    const exportAfterInvoice = await request('/api/admin/ops/export/control-total.csv', { cookie: adminCookie });
    assertStatus(exportAfterInvoice, 200, 'ADMIN should export Control Total after internal invoice');
    assert.ok(String(exportAfterInvoice.body).includes(String(petitionId)), 'Control Total CSV should include smoke petition');
    assert.ok(String(exportAfterInvoice.body).includes('LIQUIDACION_INTERNA'), 'Control Total CSV should include liquidation status');

    const altasBajas = await optionalRequest('/api/admin/ops/export/altas-bajas.csv', { cookie: adminCookie });
    if (altasBajas) {
      assertStatus(altasBajas, 200, 'ADMIN should export Altas/Bajas after laboral movement');
      assert.ok(String(altasBajas.body).includes(String(petitionId)), 'Altas/Bajas CSV should include smoke petition');
    }

    const liquidaciones = await optionalRequest('/api/admin/ops/export/liquidaciones.csv', { cookie: adminCookie });
    if (liquidaciones) {
      assertStatus(liquidaciones, 200, 'ADMIN should export liquidaciones after payroll creation');
      assert.ok(String(liquidaciones.body).includes(String(petitionId)), 'Liquidaciones CSV should include smoke petition');
    }
  }

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
