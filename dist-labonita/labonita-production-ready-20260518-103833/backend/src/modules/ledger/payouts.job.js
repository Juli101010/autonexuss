/**
 * Friday payouts proposals batch (optional, manual approval).
 *
 * This creates OUT ledger movements for petitions that are:
 * - status in ('NOMINA_PUBLICADA','COBRADA') (configurable)
 * - and have positive balance_to_zero > tolerance
 *
 * By default disabled unless FRIDAY_PAYOUTS_ENABLED=1.
 * The amount paid is the current positive balance_to_zero (so it reconciles).
 *
 * NOTE: This is a starter implementation; you may want manual approval per petition.
 */
const db = require('../../config/db');

function safeJsonParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

async function computeBalanceToZero(petitionId) {
  const petition = await db.get(`SELECT id, data FROM petitions WHERE id = ?`, [petitionId]);
  const data = safeJsonParse(petition?.data);
  const expenses = (
    Number(data?.expenses?.gastos_puntuales_total || 0) +
    Number(data?.expenses?.gastos_representacion_total || 0)
  );
  const comm = await db.get('SELECT COALESCE(SUM(amount_eur), 0) AS total FROM commissions WHERE petition_id = ?', [petitionId]);
  const ledger = await db.get(`
    SELECT
      COALESCE(SUM(CASE WHEN direction='IN' THEN amount_eur ELSE 0 END), 0) AS in_total,
      COALESCE(SUM(CASE WHEN direction='OUT' THEN amount_eur ELSE 0 END), 0) AS out_total
    FROM ledger_transactions
    WHERE petition_id = ?
  `, [petitionId]);

  const receipts_total = Number(ledger?.in_total || 0);
  const payouts_total = Number(ledger?.out_total || 0);
  const commissions_total = Number(comm?.total || 0);
  const balance_to_zero = receipts_total - expenses - commissions_total - payouts_total;
  return { balance_to_zero };
}

async function runFridayPayouts() {
  if (process.env.FRIDAY_PAYOUTS_ENABLED !== '1') return { enabled: false, created: 0 };

  const tol = Number(process.env.CLOSE_ZERO_TOLERANCE_EUR || 0.01);
  const occurredAt = new Date().toISOString().slice(0, 10);

  const statuses = (process.env.FRIDAY_PAYOUTS_STATUSES || 'NOMINA_PUBLICADA,COBRADA')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const placeholders = statuses.map(() => '?').join(',');
  const petitions = await db.all(
    `SELECT id FROM petitions WHERE status IN (${placeholders})`,
    statuses
  );

  let created = 0;
  for (const p of petitions) {
    const { balance_to_zero } = await computeBalanceToZero(p.id);
    if (Number(balance_to_zero) > tol) {
      try {
      await db.run(
        `INSERT INTO payout_batch_items (petition_id, occurred_at, proposed_amount_eur, note, created_by_role)
         VALUES (?,?,?,?,?)`,
        [p.id, occurredAt, Number(balance_to_zero), 'Pago viernes (propuesto)', 'SYSTEM']
      );
      created += 1;
    } catch (e) {
      if (String(e?.message || '').includes('UNIQUE')) {
        // already proposed today
      } else {
        throw e;
      }
    }
    }
  }
  return { enabled: true, created };
}

module.exports = { runFridayPayouts };
