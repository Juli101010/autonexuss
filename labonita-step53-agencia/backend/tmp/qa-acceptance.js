const assert = require('assert');
const http = require('http');

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
const mockPort = Number(process.env.QA_MOCK_PORT || 4015);

const state = {
  workers: [
    { CODTRA: 100, DNITRA: 'TEMPLATE', NOMTRA: 'TEMPLATE', AP1TRA: 'BASE', AP2TRA: 'ROW', EMATRA: 'template@labonita.local' },
  ],
  contracts: [{ CODCON: 500, TRACON: 100 }],
  payrolls: [{ CODNOM: 900, TRANOM: 100, TOTNOM: 0 }],
  counters: { writeFtra: 0, updateFtra: 0, writeFcon: 0, writeFnom: 0 },
};

function toRec(obj) {
  return Object.entries(obj).map(([columna, dato]) => ({ columna, dato }));
}

function responseOk(resultado) {
  return { respuesta: 'OK', resultado };
}

function parseSqlString(query, field) {
  const re = new RegExp(`${field}\\s*=\\s*'([^']+)'`, 'i');
  return (query.match(re) || [])[1] || '';
}

function maxField(rows, field) {
  return rows.reduce((acc, row) => Math.max(acc, Number(row[field] || 0)), 0);
}

function handleQuery(sql = '') {
  const q = String(sql || '').toUpperCase();
  if (q.includes('SELECT TOP 1 CODTRA FROM F_TRA WHERE DNITRA')) {
    const tax = parseSqlString(sql, 'DNITRA').toUpperCase();
    const found = [...state.workers]
      .filter((w) => String(w.DNITRA || '').toUpperCase() === tax)
      .sort((a, b) => Number(b.CODTRA) - Number(a.CODTRA))[0];
    return responseOk(found ? [toRec({ CODTRA: found.CODTRA })] : []);
  }
  if (q.includes('SELECT TOP 1 * FROM F_TRA')) {
    const row = [...state.workers].sort((a, b) => Number(b.CODTRA) - Number(a.CODTRA))[0];
    return responseOk(row ? [toRec(row)] : []);
  }
  if (q.includes('SELECT MAX(CODTRA) AS M FROM F_TRA')) {
    return responseOk([toRec({ M: maxField(state.workers, 'CODTRA') })]);
  }
  if (q.includes('SELECT TOP 1 * FROM F_CON')) {
    const row = [...state.contracts].sort((a, b) => Number(b.CODCON) - Number(a.CODCON))[0];
    return responseOk(row ? [toRec(row)] : []);
  }
  if (q.includes('SELECT MAX(CODCON) AS M FROM F_CON')) {
    return responseOk([toRec({ M: maxField(state.contracts, 'CODCON') })]);
  }
  if (q.includes('SELECT TOP 1 * FROM F_NOM')) {
    const row = [...state.payrolls].sort((a, b) => Number(b.CODNOM) - Number(a.CODNOM))[0];
    return responseOk(row ? [toRec(row)] : []);
  }
  if (q.includes('SELECT MAX(CODNOM) AS M FROM F_NOM')) {
    return responseOk([toRec({ M: maxField(state.payrolls, 'CODNOM') })]);
  }
  if (q.includes('SELECT COUNT(*) AS TOTAL FROM F_TRA WHERE DNITRA')) {
    const tax = parseSqlString(sql, 'DNITRA').toUpperCase();
    const total = state.workers.filter((w) => String(w.DNITRA || '').toUpperCase() === tax).length;
    return responseOk([toRec({ total })]);
  }
  if (q.includes('INFORMATION_SCHEMA.TABLES')) {
    return responseOk([toRec({ TABLE_NAME: 'F_CON' }), toRec({ TABLE_NAME: 'F_NOM' }), toRec({ TABLE_NAME: 'F_TRA' })]);
  }
  return responseOk([]);
}

function recToObj(registro = []) {
  return Array.isArray(registro)
    ? registro.reduce((acc, r) => {
      if (r && r.columna) acc[r.columna] = r.dato;
      return acc;
    }, {})
    : {};
}

function createMockServer() {
  return http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const json = body ? JSON.parse(body) : {};
      let out = responseOk([]);

      if (req.url === '/login/Autenticar') {
        out = { respuesta: 'OK', resultado: 'mock-token' };
      } else if (req.url === '/admin/LanzarConsulta') {
        out = handleQuery(json.consulta || '');
      } else if (req.url === '/admin/ActualizarRegistro') {
        const row = recToObj(json.registro);
        if (String(json.tabla || '').toUpperCase() === 'F_TRA' && row.CODTRA) {
          state.counters.updateFtra += 1;
          const idx = state.workers.findIndex((w) => Number(w.CODTRA) === Number(row.CODTRA));
          if (idx >= 0) state.workers[idx] = { ...state.workers[idx], ...row };
        }
        out = responseOk([]);
      } else if (req.url === '/admin/EscribirRegistro') {
        const row = recToObj(json.registro);
        const table = String(json.tabla || '').toUpperCase();
        if (table === 'F_TRA') {
          state.counters.writeFtra += 1;
          state.workers.push(row);
        } else if (table === 'F_CON') {
          state.counters.writeFcon += 1;
          state.contracts.push(row);
        } else if (table === 'F_NOM') {
          state.counters.writeFnom += 1;
          state.payrolls.push(row);
        }
        out = responseOk([]);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    });
  });
}

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
  return { status: res.status, body, cookie: res.headers.get('set-cookie') || '' };
}

function assertStatus(res, expected, msg) {
  if (Array.isArray(expected)) {
    assert.ok(expected.includes(res.status), `${msg}. got=${res.status} body=${JSON.stringify(res.body).slice(0, 400)}`);
    return;
  }
  assert.strictEqual(res.status, expected, `${msg}. got=${res.status} body=${JSON.stringify(res.body).slice(0, 400)}`);
}

async function login(email, password) {
  const res = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  assertStatus(res, 200, `login ${email}`);
  return res.cookie.split(';')[0];
}

function invoicePayload(reference, taxId) {
  return {
    type: 'ALTA_FACTURA',
    petition_date: '2026-05-21',
    responsible_name: 'QA Integrador',
    company_show: 'QA Show',
    reference,
    pais_ciudad_actuacion: 'Madrid, España',
    fecha_inicio_actuacion: '2026-06-21',
    fecha_fin_actuacion: '2026-06-21',
    requiere_a1: 'NO',
    client_name: 'Cliente QA',
    client_tax_id: `B${Date.now().toString().slice(-8)}`,
    client_email: 'cliente-qa@example.test',
    factura_direccion: 'Calle QA 1',
    factura_cp: '28001',
    factura_ciudad: 'Madrid',
    factura_provincia: 'Madrid',
    factura_pais: 'España',
    factura_concepto: 'Servicio QA',
    factura_total_sin_iva: 1000,
    iva_tipo: 'IVA_21',
    artist_name: 'Artista QA',
    artist_tax_id: taxId,
    service_date: '2026-06-21',
    project_place: 'Madrid',
    description: 'Prueba QA',
    total_presupuestado: 1000,
  };
}

async function findLaboralQueueId(adminCookie, petitionId) {
  const q = await request('/api/admin/delsol/queue', { cookie: adminCookie });
  assertStatus(q, 200, 'listar cola DELSOL');
  const row = (q.body.rows || []).find((r) => Number(r.petition_id) === Number(petitionId) && r.entity_type === 'laboral');
  assert.ok(row, `debe existir item laboral para peticion ${petitionId}`);
  return row.id;
}

async function processQueueItem(adminCookie, queueId) {
  const out = await request(`/api/admin/delsol/queue/${queueId}/process`, {
    cookie: adminCookie,
    method: 'POST',
    body: JSON.stringify({}),
  });
  assertStatus(out, 200, `procesar cola id=${queueId}`);
  return out.body.result;
}

async function main() {
  const mock = createMockServer();
  await new Promise((resolve) => mock.listen(mockPort, resolve));

  const run = { onboarding: {}, laboral: {}, exports: {}, gaps: [] };

  try {
    const adminCookie = await login('admin@test.com', '123456');

    const stamp = Date.now();
    const assocEmail = `qa.asociada.${stamp}@example.test`;
    const puntualEmail = `qa.puntual.${stamp}@example.test`;
    const pwd = 'Abc12345';

    const regAsociada = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: assocEmail, password: pwd, profile_type: 'asociada' }),
    });
    assertStatus(regAsociada, [200, 201], 'registro asociada');
    assert.strictEqual(regAsociada.body.user.onboarding_profile, 'ASOCIADA');
    run.onboarding.asociada_register = 'ok';

    const regPuntual = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: puntualEmail, password: pwd, profile_type: 'puntual' }),
    });
    assertStatus(regPuntual, [200, 201], 'registro puntual');
    assert.strictEqual(regPuntual.body.user.onboarding_profile, 'PUNTUAL');
    run.onboarding.puntual_register = 'ok';

    const assocCookie = await login(assocEmail, pwd);
    const puntualCookie = await login(puntualEmail, pwd);

    const assocMe = await request('/api/auth/me', { cookie: assocCookie });
    const puntualMe = await request('/api/auth/me', { cookie: puntualCookie });
    assertStatus(assocMe, 200, 'auth me asociada');
    assertStatus(puntualMe, 200, 'auth me puntual');
    const assocUser = assocMe.body.user || assocMe.body;
    const puntualUser = puntualMe.body.user || puntualMe.body;
    assert.strictEqual(assocUser.onboarding_status, 'PENDIENTE_VALIDACION');
    assert.strictEqual(puntualUser.onboarding_status, 'PENDIENTE_VALIDACION');
    run.onboarding.status_validation = 'ok';

    const assocPetitions = await request('/api/petitions', { cookie: assocCookie });
    const puntualPetitions = await request('/api/petitions', { cookie: puntualCookie });
    assertStatus(assocPetitions, 200, 'listar peticiones asociada');
    assertStatus(puntualPetitions, 200, 'listar peticiones puntual');
    const assocHasOnboarding = (assocPetitions.body.rows || []).some((r) => String(r.type || '').toUpperCase() === 'ONBOARDING_ASSOCIADO');
    const puntualHasOnboarding = (puntualPetitions.body.rows || []).some((r) => String(r.type || '').toUpperCase() === 'ONBOARDING_PUNTUAL');
    assert.ok(assocHasOnboarding, 'asociada debe tener onboarding asociado');
    assert.ok(puntualHasOnboarding, 'puntual debe tener onboarding puntual');
    run.onboarding.petitions_seeded = 'ok';

    const taxId = 'QA1234567X';
    const p1 = await request('/api/admin/ops/petitions', {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify(invoicePayload(`QA-DEDUPE-1-${stamp}`, taxId)),
    });
    assertStatus(p1, 201, 'crear peticion laboral #1');

    const lab1 = await request(`/api/admin/ops/petitions/${p1.body.id}/laboral`, {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify({ movement_type: 'ALTA_BAJA', requires_a1: 'NO' }),
    });
    assertStatus(lab1, 201, 'crear movimiento laboral #1');
    const q1 = await findLaboralQueueId(adminCookie, p1.body.id);
    const r1 = await processQueueItem(adminCookie, q1);
    assert.strictEqual(r1?.dedupe?.status, 'created', 'primer sync laboral debe crear');
    run.laboral.first_created = r1?.dedupe || null;

    const p2 = await request('/api/admin/ops/petitions', {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify(invoicePayload(`QA-DEDUPE-2-${stamp}`, taxId)),
    });
    assertStatus(p2, 201, 'crear peticion laboral #2');

    const lab2 = await request(`/api/admin/ops/petitions/${p2.body.id}/laboral`, {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify({ movement_type: 'ALTA_BAJA', requires_a1: 'NO' }),
    });
    assertStatus(lab2, 201, 'crear movimiento laboral #2');
    const q2 = await findLaboralQueueId(adminCookie, p2.body.id);
    const r2 = await processQueueItem(adminCookie, q2);
    assert.strictEqual(r2?.dedupe?.status, 'reused', 'segundo sync laboral debe reutilizar');
    assert.strictEqual(Number(r1.codtra), Number(r2.codtra), 'debe reutilizar mismo CODTRA');
    run.laboral.second_reused = r2?.dedupe || null;

    const p3 = await request('/api/admin/ops/petitions', {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify(invoicePayload(`QA-DEDUPE-3-${stamp}`, taxId)),
    });
    assertStatus(p3, 201, 'crear peticion laboral #3');
    const lab3 = await request(`/api/admin/ops/petitions/${p3.body.id}/laboral`, {
      cookie: adminCookie,
      method: 'POST',
      body: JSON.stringify({ movement_type: 'ALTA_BAJA', requires_a1: 'NO' }),
    });
    assertStatus(lab3, 201, 'crear movimiento laboral #3');
    const q3 = await findLaboralQueueId(adminCookie, p3.body.id);
    const r3 = await processQueueItem(adminCookie, q3);
    assert.strictEqual(r3?.dedupe?.status, 'reused', 'tercer sync laboral no debe duplicar');
    assert.strictEqual(state.counters.writeFtra, 1, 'solo debe escribirse un alta F_TRA');
    run.laboral.no_duplicate = { writeFtra: state.counters.writeFtra, updateFtra: state.counters.updateFtra };

    const expControl = await request('/api/admin/controls/control-total?download=1', { cookie: adminCookie });
    const expGastos = await request('/api/admin/controls/gastos?download=1', { cookie: adminCookie });
    const expPayroll = await request('/api/admin/controls/monthly-payroll?download=1', { cookie: adminCookie });
    const expSs = await request('/api/admin/controls/ss-diario?download=1', { cookie: adminCookie });
    assertStatus(expControl, 200, 'export control-total');
    assertStatus(expGastos, 200, 'export gastos');
    assertStatus(expPayroll, 200, 'export monthly-payroll');
    assertStatus(expSs, 200, 'export ss-diario');

    const txtControl = String(expControl.body || '');
    const txtGastos = String(expGastos.body || '');
    const txtPayroll = String(expPayroll.body || '');
    const txtSs = String(expSs.body || '');
    assert.ok(txtControl.includes('REFERENCIA'), 'control-total export debe incluir REFERENCIA');
    assert.ok(txtGastos.includes('REFERENCIA'), 'gastos export debe incluir REFERENCIA');
    assert.ok(txtPayroll.includes('TRABAJADOR') || txtPayroll.includes('REFERENCIA'), 'monthly-payroll export debe tener cabecera');
    assert.ok(txtSs.includes('DNI') || txtSs.includes('REFERENCIA') || txtSs.includes('TRABAJADOR'), 'ss-diario export debe tener cabecera');
    run.exports = { control_total: 'ok', gastos: 'ok', monthly_payroll: 'ok', ss_diario: 'ok' };

    console.log(JSON.stringify({ ok: true, checklist: run, mock_state: state }, null, 2));
  } finally {
    await new Promise((resolve) => mock.close(resolve));
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message, stack: err.stack }, null, 2));
  process.exit(1);
});
