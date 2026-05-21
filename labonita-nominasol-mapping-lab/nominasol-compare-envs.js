const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LAB_DIR = __dirname;
const DISCOVERY = path.join(LAB_DIR, 'nominasol-readonly-discovery.js');
const REPORT_JSON = path.join(LAB_DIR, 'reports', 'nominasol-readonly-discovery.json');
const OUT_JSON = path.join(LAB_DIR, 'reports', 'nominasol-multi-env-summary.json');
const OUT_MD = path.join(LAB_DIR, 'reports', 'nominasol-multi-env-summary.md');

const envFiles = [
  path.resolve(LAB_DIR, '..', '_tmp_step57', 'labonita-delsol-handoff-step57-con-credenciales', '.env.delsol.local'),
  'C:\\Users\\Julian\\Downloads\\labonita-delsol-api-probe-step55-corregido\\labonita_delsol_api_probe_step55_corregido\\.env.delsol.local',
  'C:\\Users\\Julian\\Downloads\\labonita-delsol-api-probe-step54\\labonita_delsol_api_probe_step54\\.env.delsol.local',
  'C:\\Users\\Julian\\Downloads\\labonita-delsol-credenciales-local\\labonita_delsol_credenciales_local\\.env.delsol.local'
].filter((file) => fs.existsSync(file));

function resultRows(report, label) {
  return report.results.find((r) => r.label === label)?.rows || [];
}

function runOne(envFile) {
  execFileSync(process.execPath, [DISCOVERY, envFile], { cwd: LAB_DIR, stdio: 'pipe' });
  const report = JSON.parse(fs.readFileSync(REPORT_JSON, 'utf8'));
  const tables = resultRows(report, 'filtered_tables_information_schema')
    .map((r) => r.TABLE_NAME || r.name)
    .filter(Boolean);
  const fTraColumns = resultRows(report, 'f_tra_columns').map((r) => r.COLUMN_NAME).filter(Boolean);
  const fEmpColumns = resultRows(report, 'f_emp_columns').map((r) => r.COLUMN_NAME).filter(Boolean);
  const knownCounts = resultRows(report, 'counts_known_candidates')[0] || {};
  return {
    source: path.basename(path.dirname(envFile)),
    env_file: envFile,
    ok: true,
    table_count: resultRows(report, 'all_tables_count')[0]?.total || null,
    filtered_tables: tables,
    f_emp_columns: fEmpColumns,
    f_tra_columns: fTraColumns,
    counts_known_candidates: knownCounts,
    conclusion: report.conclusion,
    next_step: report.next_step
  };
}

const summary = {
  created_at: new Date().toISOString(),
  envs_tested: envFiles.length,
  results: envFiles.map(runOne)
};

const allTables = new Set(summary.results.flatMap((r) => r.filtered_tables));
summary.detected_tables_union = [...allTables].sort();
summary.nominasol_confirmed = summary.detected_tables_union.some((t) => /NOM|TRABAJ|CONTRA|COT|IRPF/i.test(t) && !/^F_/.test(t));
summary.final_decision = summary.nominasol_confirmed
  ? 'Hay candidatas Nominasol para mapear en detalle antes de escribir.'
  : 'No hay mapeo Nominasol oficial suficiente con estas credenciales. No integrar escritura de nomina oficial todavia.';

fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2));
fs.writeFileSync(OUT_MD, [
  '# Nominasol Multi Env Summary',
  '',
  `Fecha: ${summary.created_at}`,
  `Entornos probados: ${summary.envs_tested}`,
  '',
  'No contiene credenciales ni tokens.',
  '',
  '## Resultado',
  '',
  ...summary.results.flatMap((r) => [
    `### ${r.source}`,
    `- Tablas totales: ${r.table_count}`,
    `- Tablas laborales candidatas detectadas: ${r.filtered_tables.join(', ') || 'ninguna'}`,
    `- F_EMP columnas: ${r.f_emp_columns.length}`,
    `- F_TRA columnas: ${r.f_tra_columns.length}`,
    `- Conclusión: ${r.conclusion}`,
    ''
  ]),
  '## Decisión',
  '',
  summary.final_decision,
  ''
].join('\n'));

console.log(JSON.stringify({
  ok: true,
  report: OUT_MD,
  envs_tested: summary.envs_tested,
  detected_tables_union: summary.detected_tables_union,
  final_decision: summary.final_decision
}, null, 2));
