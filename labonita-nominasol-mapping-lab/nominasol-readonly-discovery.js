const fs = require('fs');
const path = require('path');

const DEFAULT_ENV = path.resolve(
  __dirname,
  '..',
  '_tmp_step57',
  'labonita-delsol-handoff-step57-con-credenciales',
  '.env.delsol.local'
);

const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_JSON = path.join(REPORT_DIR, 'nominasol-readonly-discovery.json');
const REPORT_MD = path.join(REPORT_DIR, 'nominasol-readonly-discovery.md');

const TABLE_PATTERNS = [
  'TRA', 'TRAB', 'EMP', 'NOM', 'NOMI', 'CON', 'CONT', 'SS', 'SEG',
  'A1', 'BAJ', 'ALT', 'INC', 'LIQ', 'SAL', 'COT', 'IRPF', 'RET'
];

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

function makeLikeClause(columnName) {
  return TABLE_PATTERNS.map((p) => `${columnName} LIKE '%${p}%'`).join(' OR ');
}

class DelsolReadonlyClient {
  constructor(envFile = DEFAULT_ENV) {
    this.envFile = envFile;
    this.vars = readEnv(envFile);
    this.loginUrl = this.vars.DELSOL_LOGIN_URL || 'https://api.sdelsol.com/login/Autenticar';
    this.adminUrl = (this.vars.DELSOL_ADMIN_URL || 'https://api.sdelsol.com/admin').replace(/\/+$/, '');
    this.ejercicio = this.vars.DELSOL_EJERCICIO || '2026';
  }

  envSummary() {
    return {
      env_file: this.envFile,
      login_url: this.loginUrl,
      admin_url: this.adminUrl,
      ejercicio: this.ejercicio,
      has_codigo_fabricante: Boolean(this.vars.DELSOL_CODIGO_FABRICANTE),
      has_codigo_cliente: Boolean(this.vars.DELSOL_CODIGO_CLIENTE),
      has_base_datos: Boolean(this.vars.DELSOL_BASE_DATOS),
      has_password: Boolean(this.vars.DELSOL_PASSWORD)
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
    return json;
  }
}

async function safeQuery(client, label, sql) {
  try {
    const response = await client.query(sql);
    const rows = rowsToObjects(response);
    return { label, ok: response.respuesta === 'OK', respuesta: response.respuesta || null, rows };
  } catch (error) {
    return { label, ok: false, error: compactError(error), rows: [] };
  }
}

function renderMarkdown(report) {
  const lines = [
    '# Nominasol / Laboral Readonly Discovery',
    '',
    `Fecha: ${report.created_at}`,
    `Ejercicio: ${report.environment.ejercicio}`,
    '',
    'No contiene credenciales, tokens ni datos personales. Es un laboratorio externo al sistema La Bonita.',
    '',
    '## Entorno',
    '',
    `- Login URL configurada: ${report.environment.login_url}`,
    `- Admin URL configurada: ${report.environment.admin_url}`,
    `- Credenciales presentes: ${report.environment.has_codigo_fabricante && report.environment.has_codigo_cliente && report.environment.has_base_datos && report.environment.has_password ? 'si' : 'no'}`,
    '',
    '## Hallazgos',
    ''
  ];

  for (const result of report.results) {
    lines.push(`### ${result.label}`);
    if (!result.ok) {
      lines.push(`- Estado: error`);
      lines.push(`- Motivo: ${result.error?.message || 'sin detalle'}`);
      lines.push('');
      continue;
    }
    lines.push(`- Estado: OK`);
    lines.push(`- Filas: ${result.rows.length}`);
    const columns = Object.keys(result.rows[0] || {});
    if (columns.length) lines.push(`- Columnas: ${columns.join(', ')}`);
    if (result.rows.length && !result.label.includes('sample_values')) {
      lines.push('- Muestra estructural:');
      lines.push('```json');
      lines.push(JSON.stringify(result.rows.slice(0, 20), null, 2));
      lines.push('```');
    }
    lines.push('');
  }

  lines.push('## Conclusión Técnica');
  lines.push('');
  lines.push(report.conclusion);
  lines.push('');
  lines.push('## Próxima Decisión');
  lines.push('');
  lines.push(report.next_step);
  lines.push('');
  return lines.join('\n');
}

function summarize(report) {
  const tableRows = report.results.find((r) => r.label === 'filtered_tables_information_schema')?.rows || [];
  const tableNames = new Set(tableRows.map((r) => r.TABLE_NAME || r.name).filter(Boolean));
  const hasNominas = [...tableNames].some((t) => /NOM|TRABAJ|CONTRA|COT|IRPF/i.test(t));
  const hasOnlyFactuLaborAux = tableNames.has('F_TRA') && !hasNominas;

  if (hasNominas) {
    report.conclusion = 'La base consultada expone tablas candidatas laborales/Nominasol. Se puede preparar un segundo paso con pruebas de lectura por entidad y mapeo campo a campo antes de escribir.';
    report.next_step = 'Elegir una tabla candidata de trabajadores/nominas, validar claves primarias por lectura y pedir confirmación antes de cualquier EscribirRegistro.';
    return;
  }

  if (hasOnlyFactuLaborAux) {
    report.conclusion = 'La base consultada parece ser principalmente Factusol/gestión comercial. Expone F_EMP y F_TRA, pero no aparecen tablas Nominasol completas de nómina/trabajador. F_TRA existe como tabla auxiliar/transporte o laboral mínima, no basta para afirmar nómina oficial.';
    report.next_step = 'Necesitamos base de datos/empresa Nominasol o documentación privada de tablas laborales. Mientras tanto solo se debe sincronizar liquidación/pago interno y dejar nómina oficial como pendiente de mapeo.';
    return;
  }

  report.conclusion = 'No se pudo confirmar un catálogo Nominasol suficiente con las credenciales actuales.';
  report.next_step = 'Solicitar a La Bonita/DELSOL la base Nominasol exacta o export de tablas/campos del módulo laboral.';
}

async function main() {
  const envFile = process.argv[2] || DEFAULT_ENV;
  const client = new DelsolReadonlyClient(envFile);
  const report = {
    created_at: new Date().toISOString(),
    environment: client.envSummary(),
    results: []
  };

  const filteredWhereInfo = makeLikeClause('TABLE_NAME');
  const filteredWhereSys = makeLikeClause('o.name');
  const filteredWhereCols = makeLikeClause('TABLE_NAME');

  const queries = [
    ['all_tables_count', 'SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.TABLES'],
    ['filtered_tables_information_schema', `SELECT TOP 200 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE ${filteredWhereInfo} ORDER BY TABLE_NAME`],
    ['filtered_tables_sysobjects', `SELECT TOP 200 o.name FROM sysobjects o WHERE o.xtype='U' AND (${filteredWhereSys}) ORDER BY o.name`],
    ['filtered_columns_information_schema', `SELECT TOP 600 TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE ${filteredWhereCols} ORDER BY TABLE_NAME, ORDINAL_POSITION`],
    ['f_emp_columns', "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'F_EMP' ORDER BY ORDINAL_POSITION"],
    ['f_tra_columns', "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'F_TRA' ORDER BY ORDINAL_POSITION"],
    ['nominas_columns', "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'NOMINAS' ORDER BY ORDINAL_POSITION"],
    ['trabajadores_columns', "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TRABAJADORES' ORDER BY ORDINAL_POSITION"],
    ['counts_known_candidates', "SELECT (SELECT COUNT(*) FROM F_EMP) AS F_EMP, (SELECT COUNT(*) FROM F_TRA) AS F_TRA"],
    ['count_nominas_if_exists', "SELECT COUNT(*) AS NOMINAS FROM NOMINAS"],
    ['count_trabajadores_if_exists', "SELECT COUNT(*) AS TRABAJADORES FROM TRABAJADORES"]
  ];

  for (const [label, sql] of queries) {
    report.results.push(await safeQuery(client, label, sql));
  }

  summarize(report);
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(REPORT_MD, renderMarkdown(report));

  console.log(JSON.stringify({
    ok: true,
    report: REPORT_MD,
    conclusion: report.conclusion,
    next_step: report.next_step
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: compactError(error) }, null, 2));
  process.exit(1);
});
