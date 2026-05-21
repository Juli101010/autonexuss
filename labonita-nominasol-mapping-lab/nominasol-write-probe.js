const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_JSON = path.join(REPORT_DIR, 'nominasol-write-probe.json');
const REPORT_MD = path.join(REPORT_DIR, 'nominasol-write-probe.md');

function readEnv(filePath) {
  const vars = {};
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#') || !clean.includes('=')) continue;
    const idx = clean.indexOf('=');
    vars[clean.slice(0, idx).trim()] = clean.slice(idx + 1).trim();
  }
  return vars;
}

function passwordToBase64(raw) {
  return Buffer.from(String(raw || ''), 'utf8').toString('base64');
}

function compactError(error) {
  return {
    message: String(error?.message || error || '').slice(0, 300),
    status: error?.status || null,
    respuesta: error?.response?.respuesta || null,
    resultado: error?.response?.resultado || null,
  };
}

function rowToObject(row) {
  if (Array.isArray(row)) {
    return row.reduce((acc, cell) => {
      if (cell?.columna) acc[cell.columna] = cell.dato;
      return acc;
    }, {});
  }
  return row || {};
}

function rowsToObjects(result) {
  return (Array.isArray(result?.resultado) ? result.resultado : []).map(rowToObject);
}

function rec(obj) {
  return Object.entries(obj).map(([columna, dato]) => ({ columna, dato }));
}

class DelsolClient {
  constructor(envFile) {
    this.vars = readEnv(envFile);
    this.loginUrl = this.vars.DELSOL_LOGIN_URL || 'https://api.sdelsol.com/login/Autenticar';
    this.adminUrl = (this.vars.DELSOL_ADMIN_URL || 'https://api.sdelsol.com/admin').replace(/\/+$/, '');
    this.ejercicio = this.vars.DELSOL_EJERCICIO || '2026';
    this.fabricante = this.vars.DELSOL_CODIGO_FABRICANTE || '';
    this.cliente = this.vars.DELSOL_CODIGO_CLIENTE || '';
    this.baseDatos = this.vars.DELSOL_BASE_DATOS || '';
    this.password = this.vars.DELSOL_PASSWORD || '';
  }

  async token() {
    const res = await fetch(this.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        codigoFabricante: this.fabricante,
        codigoCliente: this.cliente,
        baseDatosCliente: this.baseDatos,
        password: passwordToBase64(this.password),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.respuesta !== 'OK' || !json?.resultado) {
      const err = new Error(json?.respuesta || `auth HTTP ${res.status}`);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json.resultado;
  }

  async post(endpoint, payload) {
    const token = await this.token();
    const res = await fetch(`${this.adminUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ ejercicio: this.ejercicio, ...payload }),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} en ${endpoint}`);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json;
  }

  lanzarConsulta(sql) {
    return this.post('LanzarConsulta', { consulta: sql });
  }

  actualizarRegistro(tabla, registro) {
    return this.post('ActualizarRegistro', { tabla, registro });
  }
}

function buildProbeUpdate(table, row) {
  const clean = (v) => (v === undefined ? null : v);
  if (table === 'F_TRA') {
    if (row.CODTRA == null) throw new Error('F_TRA sin CODTRA');
    return {
      key: { CODTRA: row.CODTRA },
      registro: rec({
        CODTRA: clean(row.CODTRA),
        NOMTRA: clean(row.NOMTRA || ''),
        AP1TRA: clean(row.AP1TRA || ''),
        AP2TRA: clean(row.AP2TRA || ''),
      }),
    };
  }
  if (table === 'F_CON') {
    if (row.CODCON == null) throw new Error('F_CON sin CODCON');
    return {
      key: { CODCON: row.CODCON },
      registro: rec({
        CODCON: clean(row.CODCON),
        TRACON: clean(row.TRACON || 0),
        NOMCON: clean(row.NOMCON || ''),
        AP1CON: clean(row.AP1CON || ''),
      }),
    };
  }
  if (table === 'F_NOM') {
    if (row.CODNOM == null) throw new Error('F_NOM sin CODNOM');
    return {
      key: { CODNOM: row.CODNOM },
      registro: rec({
        CODNOM: clean(row.CODNOM),
        TRANOM: clean(row.TRANOM || 0),
        EDRNOM: clean(row.EDRNOM || 0),
      }),
    };
  }
  throw new Error(`Tabla no soportada: ${table}`);
}

function sanitizeSample(table, row) {
  if (!row) return null;
  const clone = { ...row };
  Object.keys(clone).forEach((k) => {
    if (/NOM|AP1|AP2|DIR|DOM|MAIL|TEL|NIF|DNI|IBAN|CCC|CTA/i.test(k)) clone[k] = '<redacted>';
  });
  clone.__table = table;
  return clone;
}

async function probeTable(client, table, sql) {
  const result = {
    table,
    select_ok: false,
    update_ok: false,
    key: null,
    sample: null,
    update_response: null,
    error: null,
  };
  try {
    const query = await client.lanzarConsulta(sql);
    const rows = rowsToObjects(query);
    if (!rows.length) throw new Error(`${table} sin filas para prueba controlada`);
    const row = rows[0];
    result.select_ok = true;
    result.sample = sanitizeSample(table, row);
    const patch = buildProbeUpdate(table, row);
    result.key = patch.key;
    const upd = await client.actualizarRegistro(table, patch.registro);
    result.update_response = { respuesta: upd?.respuesta || null, resultado: upd?.resultado || null };
    result.update_ok = upd?.respuesta === 'OK';
    return result;
  } catch (error) {
    result.error = compactError(error);
    return result;
  }
}

function renderMarkdown(report) {
  const lines = [
    '# Nominasol Write Probe (Controlado)',
    '',
    `Fecha: ${report.created_at}`,
    `Base: ${report.base_alias}`,
    '',
    'Prueba controlada: solo `ActualizarRegistro` sobre una fila existente, reenviando valores equivalentes de claves/campos minimos para confirmar permiso de escritura por tabla.',
    '',
    '## Resultado por tabla',
    '',
  ];

  for (const item of report.tables) {
    lines.push(`### ${item.table}`);
    lines.push(`- Lectura: ${item.select_ok ? 'OK' : 'ERROR'}`);
    lines.push(`- Escritura (update controlado): ${item.update_ok ? 'OK' : 'ERROR'}`);
    if (item.key) lines.push(`- Clave usada: \`${JSON.stringify(item.key)}\``);
    if (item.error) lines.push(`- Error: ${item.error.message}`);
    lines.push('');
  }

  lines.push('## Conclusión');
  lines.push('');
  lines.push(report.conclusion);
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const envFile = process.argv[2];
  if (!envFile) throw new Error('Uso: node nominasol-write-probe.js <ruta-env>');
  const client = new DelsolClient(envFile);

  const report = {
    created_at: new Date().toISOString(),
    base_alias: path.basename(envFile),
    tables: [],
    conclusion: '',
  };

  report.tables.push(
    await probeTable(client, 'F_TRA', 'SELECT TOP 1 CODTRA,NOMTRA,AP1TRA,AP2TRA FROM F_TRA ORDER BY CODTRA DESC')
  );
  report.tables.push(
    await probeTable(client, 'F_CON', 'SELECT TOP 1 CODCON,TRACON,NOMCON,AP1CON FROM F_CON ORDER BY CODCON DESC')
  );
  report.tables.push(
    await probeTable(client, 'F_NOM', 'SELECT TOP 1 CODNOM,TRANOM,EDRNOM FROM F_NOM ORDER BY CODNOM DESC')
  );

  const okAll = report.tables.every((t) => t.select_ok && t.update_ok);
  const okAny = report.tables.some((t) => t.update_ok);
  report.conclusion = okAll
    ? 'Escritura controlada confirmada en F_TRA, F_CON y F_NOM. Se puede activar integración laboral/nómina con guardas de validación.'
    : okAny
      ? 'Escritura parcial confirmada. Se requiere ajuste por tabla antes de activar integración completa.'
      : 'No se confirmó escritura en tablas laborales críticas. Mantener bloqueo en producción.';

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(REPORT_MD, renderMarkdown(report));

  console.log(JSON.stringify({
    ok: true,
    report_json: REPORT_JSON,
    report_md: REPORT_MD,
    conclusion: report.conclusion,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: compactError(error) }, null, 2));
  process.exit(1);
});

