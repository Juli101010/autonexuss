const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_JSON = path.join(REPORT_DIR, 'nominasol-schema-map.json');
const REPORT_MD = path.join(REPORT_DIR, 'nominasol-schema-map.md');

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
  return Buffer.from(String(raw), 'utf8').toString('base64');
}

function compactError(error) {
  return {
    message: String(error?.message || error || '').slice(0, 300),
    status: error?.status || null,
    respuesta: error?.response?.respuesta || null
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

class DelsolReadonlyClient {
  constructor(envFile) {
    this.vars = readEnv(envFile);
    this.loginUrl = this.vars.DELSOL_LOGIN_URL || this.vars.DELSOL_AUTH_URL || 'https://api.sdelsol.com/login/Autenticar';
    this.adminUrl = (this.vars.DELSOL_ADMIN_URL || 'https://api.sdelsol.com/admin').replace(/\/+$/, '');
    this.ejercicio = this.vars.DELSOL_EJERCICIO || '2026';
  }

  envSummary() {
    return {
      login_url: this.loginUrl,
      admin_url: this.adminUrl,
      ejercicio: this.ejercicio,
      credentials_present: Boolean(
        this.vars.DELSOL_CODIGO_FABRICANTE &&
        this.vars.DELSOL_CODIGO_CLIENTE &&
        this.vars.DELSOL_BASE_DATOS &&
        this.vars.DELSOL_PASSWORD
      )
    };
  }

  async token() {
    const body = {
      codigoFabricante: this.vars.DELSOL_CODIGO_FABRICANTE,
      codigoCliente: this.vars.DELSOL_CODIGO_CLIENTE,
      baseDatosCliente: this.vars.DELSOL_BASE_DATOS,
      password: passwordToBase64(this.vars.DELSOL_PASSWORD)
    };
    const res = await fetch(this.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.respuesta !== 'OK' || !json.resultado) {
      const err = new Error(json.respuesta || `auth HTTP ${res.status}`);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json.resultado;
  }

  async query(sql) {
    const token = await this.token();
    const res = await fetch(`${this.adminUrl}/LanzarConsulta`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ ejercicio: this.ejercicio, consulta: sql })
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) {
      const err = new Error(`consulta HTTP ${res.status}`);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return rowsToObjects(json);
  }
}

async function safeQuery(client, label, sql) {
  try {
    return { label, ok: true, rows: await client.query(sql) };
  } catch (error) {
    return { label, ok: false, error: compactError(error), rows: [] };
  }
}

function columnsByTable(rows) {
  const tables = {};
  for (const row of rows) {
    const table = row.TABLE_NAME;
    if (!tables[table]) tables[table] = [];
    tables[table].push({
      name: row.COLUMN_NAME,
      type: row.DATA_TYPE,
      position: Number(row.ORDINAL_POSITION)
    });
  }
  return tables;
}

function inferRelations(tables) {
  const relations = [];
  const names = Object.keys(tables);
  for (const table of names) {
    for (const column of tables[table]) {
      if (column.name === 'TRACON') relations.push({ from: `${table}.${column.name}`, to: 'F_TRA.CODTRA', confidence: 'alta' });
      if (column.name === 'TRANOM') relations.push({ from: `${table}.${column.name}`, to: 'F_TRA.CODTRA', confidence: 'alta' });
      if (column.name === 'CODNOM') relations.push({ from: `${table}.${column.name}`, to: 'F_NOM.CODNOM', confidence: 'media' });
      if (column.name === 'CODCON') relations.push({ from: `${table}.${column.name}`, to: 'F_CON.CODCON', confidence: table === 'F_CON' ? 'pk' : 'media' });
    }
  }
  return relations;
}

function renderMarkdown(report) {
  const lines = [
    '# Mapa De Esquema Nominasol',
    '',
    `Fecha: ${report.created_at}`,
    '',
    'Reporte sanitizado. No contiene credenciales, tokens ni filas personales.',
    '',
    '## Tablas Confirmadas',
    ''
  ];

  for (const table of Object.keys(report.tables).sort()) {
    const count = report.counts[table];
    lines.push(`### ${table}`);
    lines.push(`- Filas: ${count === null ? 'no disponible' : count}`);
    lines.push(`- Columnas: ${report.tables[table].length}`);
    lines.push('');
    lines.push('| # | Campo | Tipo | Lectura funcional |');
    lines.push('|---:|---|---|---|');
    for (const column of report.tables[table]) {
      const meaning = report.field_hints[`${table}.${column.name}`] || '';
      lines.push(`| ${column.position} | ${column.name} | ${column.type} | ${meaning} |`);
    }
    lines.push('');
  }

  lines.push('## Relaciones Inferidas');
  lines.push('');
  if (!report.relations.length) {
    lines.push('- Sin relaciones inferidas con confianza suficiente.');
  } else {
    for (const rel of report.relations) lines.push(`- ${rel.from} -> ${rel.to} (${rel.confidence})`);
  }
  lines.push('');
  lines.push('## Decision Tecnica');
  lines.push('');
  lines.push(report.decision);
  lines.push('');
  return lines.join('\n');
}

function buildFieldHints() {
  return {
    'F_TRA.CODTRA': 'codigo trabajador',
    'F_TRA.DNITRA': 'NIF/DNI trabajador',
    'F_TRA.NSSTRA': 'numero Seguridad Social',
    'F_TRA.NOMTRA': 'nombre',
    'F_TRA.AP1TRA': 'primer apellido',
    'F_TRA.AP2TRA': 'segundo apellido',
    'F_TRA.DOMTRA': 'domicilio',
    'F_TRA.CPOTRA': 'codigo postal',
    'F_TRA.MUNTRA': 'municipio',
    'F_TRA.PROTRA': 'provincia',
    'F_TRA.PAITRA': 'pais',
    'F_TRA.FNATRA': 'fecha nacimiento probable',
    'F_TRA.FALTRA': 'fecha alta probable',
    'F_TRA.FBJTRA': 'fecha baja probable',
    'F_TRA.EMATRA': 'email probable',
    'F_CON.CODCON': 'codigo contrato',
    'F_CON.TRACON': 'trabajador asociado',
    'F_CON.FINCON': 'fecha inicio contrato probable',
    'F_CON.FFICON': 'fecha fin contrato probable',
    'F_CON.NOMCON': 'nombre',
    'F_CON.AP1CON': 'primer apellido',
    'F_CON.AP2CON': 'segundo apellido',
    'F_NOM.CODNOM': 'codigo nomina',
    'F_NOM.TRANOM': 'trabajador asociado probable',
    'F_NOM.FECNOM': 'fecha nomina probable',
    'F_EMP.CODEMP': 'codigo empresa',
    'F_EMP.NIFEMP': 'NIF empresa',
    'F_EMP.DENEMP': 'denominacion empresa'
  };
}

async function main() {
  const envFile = process.argv[2];
  if (!envFile) throw new Error('Uso: node nominasol-schema-map.js <env-temporal>');
  const client = new DelsolReadonlyClient(envFile);
  const targets = ['F_EMP', 'F_TRA', 'F_CON', 'F_NOM'];
  const quoted = targets.map((t) => `'${t}'`).join(',');
  const columnsResult = await safeQuery(
    client,
    'columns',
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN (${quoted}) ORDER BY TABLE_NAME, ORDINAL_POSITION`
  );

  const tables = columnsByTable(columnsResult.rows);
  const counts = {};
  for (const table of targets) {
    const result = await safeQuery(client, `count_${table}`, `SELECT COUNT(*) AS total FROM ${table}`);
    counts[table] = result.ok && result.rows[0] ? Number(result.rows[0].total) : null;
  }

  const report = {
    created_at: new Date().toISOString(),
    environment: client.envSummary(),
    tables,
    counts,
    relations: inferRelations(tables),
    field_hints: buildFieldHints(),
    decision: 'NS006 confirma tablas laborales/Nominasol: F_TRA trabajadores, F_CON contratos y F_NOM nominas. Aun no se recomienda escribir hasta validar campos obligatorios con documentacion oficial o una prueba controlada de alta sobre registro reservado.'
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(REPORT_MD, renderMarkdown(report));
  console.log(JSON.stringify({
    ok: true,
    report: REPORT_MD,
    tables: Object.keys(tables).sort(),
    counts,
    decision: report.decision
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: compactError(error) }, null, 2));
  process.exit(1);
});
