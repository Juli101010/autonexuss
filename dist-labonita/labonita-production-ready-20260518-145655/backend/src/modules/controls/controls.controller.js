/**
 * Admin Controls endpoints:
 * - Monthly payroll (altas/nóminas)
 * - Gastos
 * - Puntuales
 * - Control Total (reconciled with ledger)
 * - Comisiones (manual rows)
 * - Ledger export
 * - Exports: CSV / XLSX via ?download=1&format=csv|xlsx
 */
const db = require('../../config/db');
const {
  safeJsonParse,
  buildMonthlyPayrollRows,
  buildPuntualesRows,
  buildGastosRows,
  buildCommissionsRows,
  buildControlTotalRows,
  buildLedgerRows,
  buildSsDiarioRows,
  toCsv,
  toXlsxBuffer,
} = require('./controls.service');

async function readAllPetitions() {
  const rows = await db.all('SELECT id, user_id, type, status, data, created_at FROM petitions ORDER BY created_at DESC');
  return rows.map((r) => ({ ...r, data: safeJsonParse(r.data, {}) }));
}

async function readUsersById() {
  const users = await db.all(`SELECT id, email FROM users`);
  const m = new Map();
  users.forEach((u) => m.set(u.id, u));
  return m;
}

async function readAllDocuments() {
  // columns may differ between steps; keep compatible
  const cols = await db.all('PRAGMA table_info(documents)');
  const colNames = cols.map((c) => c.name);
  const hasUploadedByRole = colNames.includes('uploaded_by_role');
  const sql = hasUploadedByRole
    ? 'SELECT id, petition_id, doc_type, original_name, uploaded_by_role, is_official, created_at FROM documents ORDER BY created_at DESC'
    : 'SELECT id, petition_id, doc_type, original_name, NULL as uploaded_by_role, NULL as is_official, created_at FROM documents ORDER BY created_at DESC';
  return db.all(sql);
}

async function readCommissions() {
  return db.all('SELECT id, petition_id, month, label, amount_eur, created_at FROM commissions ORDER BY created_at DESC');
}

async function readLedgerRows() {
  return db.all(`
    SELECT id, petition_id, direction, category, amount_eur, occurred_at, note, created_by_role, created_at
    FROM ledger_transactions
    ORDER BY occurred_at DESC, id DESC
  `);
}

async function readLedgerTotalsByPetition() {
  const rows = await db.all(`
    SELECT petition_id,
           SUM(CASE WHEN direction='IN' THEN amount_eur ELSE 0 END) AS in_total,
           SUM(CASE WHEN direction='OUT' THEN amount_eur ELSE 0 END) AS out_total
    FROM ledger_transactions
    GROUP BY petition_id
  `);
  const m = new Map();
  rows.forEach((r) => m.set(r.petition_id, { in_total: Number(r.in_total || 0), out_total: Number(r.out_total || 0) }));
  return m;
}

function sendDownload(res, rows, filenameBase, format) {
  if (format === 'xlsx') {
    const buf = toXlsxBuffer(rows, filenameBase);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
    return res.send(buf);
  }
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
  return res.send(csv);
}

function wantsDownload(req) {
  return String(req.query.download || '') === '1';
}

function downloadFormat(req) {
  const f = String(req.query.format || 'csv').toLowerCase();
  return (f === 'xlsx') ? 'xlsx' : 'csv';
}

async function monthlyPayroll(req, res) {
  const petitions = await readAllPetitions();
  const docs = await readAllDocuments();
  const rows = buildMonthlyPayrollRows(petitions, docs);

  if (wantsDownload(req)) return sendDownload(res, rows, 'control_mensual_altas_nominas', downloadFormat(req));
  return res.json({ rows });
}

async function gastos(req, res) {
  const petitions = await readAllPetitions();
  const docs = await readAllDocuments();
  const rows = buildGastosRows(petitions, docs);

  if (wantsDownload(req)) return sendDownload(res, rows, 'control_gastos', downloadFormat(req));
  return res.json({ rows });
}

async function puntuales(req, res) {
  const petitions = await readAllPetitions();
  const rows = buildPuntualesRows(petitions);

  if (wantsDownload(req)) return sendDownload(res, rows, 'control_puntuales', downloadFormat(req));
  return res.json({ rows });
}

async function commissions(req, res) {
  const rows = await readCommissions();
  const exportRows = buildCommissionsRows(rows);

  if (wantsDownload(req)) return sendDownload(res, exportRows, 'comisiones_mensuales', downloadFormat(req));
  return res.json({ rows: exportRows });
}

async function createCommission(req, res) {
  const { petition_id, month, label, amount_eur } = req.body || {};
  if (!petition_id || !month || !label || typeof amount_eur !== 'number') {
    return res.status(400).json({ error: 'petition_id, month, label, amount_eur (number) are required' });
  }
  await db.run(
    'INSERT INTO commissions (petition_id, month, label, amount_eur) VALUES (?,?,?,?)',
    [petition_id, month, label, amount_eur]
  );
  return res.json({ ok: true });
}

async function controlTotal(req, res) {
  const petitions = await readAllPetitions();
  const commRows = await readCommissions();
  const ledgerTotals = await readLedgerTotalsByPetition();

  const commissionsByPetition = new Map();
  commRows.forEach((r) => {
    commissionsByPetition.set(r.petition_id, (commissionsByPetition.get(r.petition_id) || 0) + Number(r.amount_eur || 0));
  });

  const rows = buildControlTotalRows(petitions, commissionsByPetition, ledgerTotals);

  if (wantsDownload(req)) return sendDownload(res, rows, 'control_total', downloadFormat(req));
  return res.json({ rows });
}

async function ledger(req, res) {
  const rows = buildLedgerRows(await readLedgerRows());
  if (wantsDownload(req)) return sendDownload(res, rows, 'ledger_movimientos', downloadFormat(req));
  return res.json({ rows });
}


async function ssDiario(req, res) {
  const petitions = await readAllPetitions();
  const usersById = await readUsersById();
  const rows = buildSsDiarioRows(petitions, usersById);

  if (wantsDownload(req)) return sendDownload(res, rows, 'ss_diario_altas_bajas', downloadFormat(req));
  return res.json({ rows });
}

module.exports = {
  monthlyPayroll,
  gastos,
  puntuales,
  controlTotal,
  commissions,
  createCommission,
  ledger,
  ssDiario,
};
