const fs = require('fs');
const path = require('path');
const { DelSolClient } = require('../src/integrations/delsol/delsol.client');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const JSON_PATH = path.join(REPORT_DIR, 'delsol-discovery-readonly.json');
const MD_PATH = path.join(REPORT_DIR, 'delsol-discovery-readonly.md');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'));

function compactError(error) {
  const response = error?.response || {};
  return {
    message: String(error?.message || error || '').slice(0, 300),
    code: error?.code || response?.codigo || response?.respuesta || null,
    respuesta: response?.respuesta || null
  };
}

function sanitizeRows(result) {
  const rows = Array.isArray(result?.resultado) ? result.resultado : [];
  return rows.slice(0, 5).map((rawRow) => {
    const row = Array.isArray(rawRow)
      ? rawRow.reduce((acc, cell) => {
          if (cell?.columna) acc[cell.columna] = cell.dato;
          return acc;
        }, {})
      : rawRow;
    const out = {};
    for (const [key, value] of Object.entries(row || {})) {
      const name = String(key).toLowerCase();
      if (name.includes('password') || name.includes('token') || name.includes('clave')) continue;
      if (typeof value === 'string' && value.length > 120) out[key] = `${value.slice(0, 120)}...`;
      else out[key] = value;
    }
    return out;
  });
}

async function runQuery(client, label, sql) {
  try {
    const result = await client.lanzarConsulta({ consulta: sql });
    const rows = sanitizeRows(result);
    const columns = rows[0] ? Object.keys(rows[0]) : [];
    const keepRows = label.includes('candidates');
    return { label, ok: result?.respuesta === 'OK', respuesta: result?.respuesta || null, columns, rows: keepRows ? rows : [], sample_count: rows.length };
  } catch (error) {
    return { label, ok: false, error: compactError(error) };
  }
}

function renderMarkdown(report) {
  const lines = [
    '# DelSol / Nominasol Discovery Readonly',
    '',
    `Fecha: ${report.created_at}`,
    `Modo: ${report.mode}`,
    `Live habilitado: ${report.live_enabled ? 'si' : 'no'}`,
    '',
    'Este reporte no contiene credenciales ni tokens. Solo guarda resultados de consultas de lectura para confirmar tablas/campos reales.',
    '',
    '## Resultado',
    ''
  ];

  for (const item of report.results) {
    lines.push(`### ${item.label}`);
    if (!item.ok) {
      lines.push(`- Estado: error`);
      lines.push(`- Motivo: ${item.error?.message || 'sin detalle'}`);
      if (item.error?.respuesta) lines.push(`- Respuesta: ${item.error.respuesta}`);
      lines.push('');
      continue;
    }
    lines.push(`- Estado: OK`);
    lines.push(`- Columnas detectadas: ${item.columns.length ? item.columns.join(', ') : 'sin filas'}`);
    lines.push(`- Filas muestra: ${item.sample_count ?? item.rows.length}`);
    if (item.rows.length && item.label.includes('candidates')) {
      lines.push(`- Muestra sanitizada:`);
      lines.push('```json');
      lines.push(JSON.stringify(item.rows.slice(0, 3), null, 2));
      lines.push('```');
    }
    lines.push('');
  }

  lines.push('## Criterio operacional');
  lines.push('');
  lines.push('- Facturacion: se puede marcar como DelSol synced solo si la cola devuelve OK y guarda codigo externo.');
  lines.push('- Nomina: no se marca como Nominasol oficial si no aparece una tabla/campo laboral confirmado.');
  lines.push('- Si DelSol no expone catalogo, se conserva nomina interna/PDF/liquidacion y queda pendiente mapeo Nominasol oficial.');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const client = new DelSolClient({ mode: process.env.DELSOL_MODE || 'mock' });
  const report = {
    created_at: new Date().toISOString(),
    mode: client.mode,
    live_enabled: client.isEnabled(),
    write_enabled: String(process.env.DELSOL_WRITE_ENABLED || '0') === '1',
    results: []
  };

  const queries = [
    ['information_schema_candidates', "SELECT TOP 80 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%TRA%' OR TABLE_NAME LIKE '%NOM%' OR TABLE_NAME LIKE '%EMP%' OR TABLE_NAME LIKE '%CON%' OR TABLE_NAME LIKE '%SS%' OR TABLE_NAME LIKE '%A1%' ORDER BY TABLE_NAME"],
    ['sysobjects_candidates', "SELECT TOP 80 name FROM sysobjects WHERE xtype='U' AND (name LIKE '%TRA%' OR name LIKE '%NOM%' OR name LIKE '%EMP%' OR name LIKE '%CON%' OR name LIKE '%SS%' OR name LIKE '%A1%') ORDER BY name"],
    ['sample_F_TRA', 'SELECT TOP 1 * FROM F_TRA'],
    ['sample_N_TRA', 'SELECT TOP 1 * FROM N_TRA'],
    ['sample_TRABAJADORES', 'SELECT TOP 1 * FROM TRABAJADORES'],
    ['sample_NOMINAS', 'SELECT TOP 1 * FROM NOMINAS'],
    ['sample_F_FAC', 'SELECT TOP 1 * FROM F_FAC'],
    ['sample_F_LFA', 'SELECT TOP 1 * FROM F_LFA']
  ];

  for (const [label, sql] of queries) {
    report.results.push(await runQuery(client, label, sql));
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(MD_PATH, renderMarkdown(report));

  console.log(JSON.stringify({
    ok: true,
    report: path.relative(process.cwd(), MD_PATH),
    live_enabled: report.live_enabled,
    discovered_ok: report.results.filter((r) => r.ok).map((r) => r.label)
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: compactError(error) }, null, 2));
  process.exit(1);
});
