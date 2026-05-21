const db = require('../../config/db');
const { computeChecklist } = require('../petitions/petition.validation');

function safeJsonParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function docsSetForPetition(petitionId, userId) {
  const docs = await db.all(
    `SELECT doc_type FROM documents WHERE petition_id = ? AND user_id = ?`,
    [petitionId, userId]
  );
  return new Set(docs.map((d) => d.doc_type));
}

async function insertNotificationOnce(userId, message, dedupeKey) {
  try {
    await db.run(
      `INSERT INTO notifications (user_id, message, dedupe_key, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [userId, message, dedupeKey]
    );
    return true;
  } catch (e) {
    if (String(e?.message || '').includes('UNIQUE')) return false;
    throw e;
  }
}

exports.list = async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.run(
      `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

/**
 * Creates daily reminders for incomplete petitions (BORRADOR / PENDIENTE_INFO).
 * Dedupe per petition per day.
 */
exports.remind = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await db.all(
      `SELECT id, type, data, status FROM petitions
       WHERE user_id = ? AND status IN ('BORRADOR', 'PENDIENTE_INFO')
       ORDER BY created_at DESC`,
      [userId]
    );

    let created = 0;
    for (const p of rows) {
      const data = safeJsonParse(p.data);
      const docsByType = await docsSetForPetition(p.id, userId);
      const checklist = computeChecklist({ type: p.type, data, docsByType });

      const hasPending =
        (checklist.missingFields && checklist.missingFields.length) ||
        (checklist.missingDocs && checklist.missingDocs.length) ||
        (checklist.ruleErrors && checklist.ruleErrors.length);

      if (!hasPending) continue;

      const dedupeKey = `reminder:${p.id}:${todayKey()}`;
      const msg = `Recordatorio: tu petición #${p.id} está incompleta (${p.status}). Revisá el checklist y completá lo faltante.`;

      const ok = await insertNotificationOnce(userId, msg, dedupeKey);
      if (ok) created += 1;
    }

    return res.json({ ok: true, created });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};
