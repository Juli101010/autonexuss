/**
 * Admin Ledger: register real cash movements for petitions.
 *
 * direction:
 *  - IN  => collection (cobro) / positive adjustment
 *  - OUT => payout (pago) / negative adjustment
 *
 * category:
 *  - COBRO | PAGO | AJUSTE
 */
const db = require('../../config/db');

function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s);
}

async function list(req, res) {
  const petitionId = req.query.petition_id ? Number(req.query.petition_id) : null;
  const month = req.query.month ? String(req.query.month) : null; // YYYY-MM
  const where = [];
  const params = [];

  if (petitionId) {
    where.push('petition_id = ?');
    params.push(petitionId);
  }
  if (month) {
    where.push("substr(occurred_at, 1, 7) = ?");
    params.push(month);
  }

  const sql = `
    SELECT id, petition_id, direction, category, amount_eur, occurred_at, note, created_by_role, created_at
    FROM ledger_transactions
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY occurred_at DESC, id DESC
  `;
  const rows = await db.all(sql, params);
  return res.json({ rows });
}

async function create(req, res) {
  const { petition_id, direction, category, amount_eur, occurred_at, note } = req.body || {};
  const pid = Number(petition_id);
  if (!pid || !['IN', 'OUT'].includes(direction) || !['COBRO', 'PAGO', 'AJUSTE'].includes(category)) {
    return res.status(400).json({ error: 'petition_id, direction(IN|OUT), category(COBRO|PAGO|AJUSTE) are required' });
  }
  if (typeof amount_eur !== 'number' || !Number.isFinite(amount_eur) || amount_eur <= 0) {
    return res.status(400).json({ error: 'amount_eur must be a positive number' });
  }
  if (!isIsoDate(occurred_at)) {
    return res.status(400).json({ error: 'occurred_at must be ISO date (YYYY-MM-DD...)' });
  }

  const actor = req.user || {};
  await db.run(
    `INSERT INTO ledger_transactions
      (petition_id, direction, category, amount_eur, occurred_at, note, created_by_user_id, created_by_role)
     VALUES (?,?,?,?,?,?,?,?)`,
    [pid, direction, category, amount_eur, occurred_at, note || null, actor.id || null, actor.role || null]
  );

  return res.json({ ok: true });
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  await db.run('DELETE FROM ledger_transactions WHERE id = ?', [id]);
  return res.json({ ok: true });
}



async function listProposals(req, res) {
  const status = req.query.status ? String(req.query.status) : 'PENDING';
  const rows = await db.all(
    `SELECT id, petition_id, occurred_at, proposed_amount_eur, status, note, created_at
     FROM payout_batch_items
     WHERE status = ?
     ORDER BY occurred_at DESC, id DESC`,
    [status]
  );
  return res.json({ rows });
}

async function approveProposal(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const item = await db.get(`SELECT * FROM payout_batch_items WHERE id = ?`, [id]);
  if (!item) return res.status(404).json({ error: 'proposal not found' });
  if (item.status !== 'PENDING') return res.status(409).json({ error: 'proposal already decided' });

  // Create ledger OUT/PAGO
  await db.run(
    `INSERT INTO ledger_transactions (petition_id, direction, category, amount_eur, occurred_at, note, created_by_user_id, created_by_role)
     VALUES (?,?,?,?,?,?,?,?)`,
    [item.petition_id, 'OUT', 'PAGO', Number(item.proposed_amount_eur), item.occurred_at, 'Pago viernes (aprobado)', req.user.id, req.user.role]
  );

  await db.run(
    `UPDATE payout_batch_items
     SET status = 'APPROVED', decided_by_user_id = ?, decided_at = datetime('now')
     WHERE id = ?`,
    [req.user.id, id]
  );

  return res.json({ ok: true });
}

async function rejectProposal(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const item = await db.get(`SELECT * FROM payout_batch_items WHERE id = ?`, [id]);
  if (!item) return res.status(404).json({ error: 'proposal not found' });
  if (item.status !== 'PENDING') return res.status(409).json({ error: 'proposal already decided' });

  await db.run(
    `UPDATE payout_batch_items
     SET status = 'REJECTED', decided_by_user_id = ?, decided_at = datetime('now')
     WHERE id = ?`,
    [req.user.id, id]
  );

  return res.json({ ok: true });
}

module.exports = { list, create, remove, listProposals, approveProposal, rejectProposal };
