/**
 * Daily reminders job with escalation.
 *
 * - Finds petitions in BORRADOR or PENDIENTE_INFO with pending checklist items.
 * - Creates a notification for the petition owner (deduped by date).
 * - Updates petitions.last_reminder_at and petitions.reminder_count.
 * - Escalates after N reminders by notifying all admins (deduped by date).
 *
 * This is intentionally internal; it does not send emails/SMS directly.
 * Notifications can be bridged to email/phone later.
 */
const db = require('../../config/db');
const { computeChecklist } = require('../petitions/petition.validation');
const { enqueueEmail } = require('./email.service');

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

async function insertNotification(userId, petitionId, message, dedupeKey) {
  try {
    await db.run(
      `INSERT INTO notifications (user_id, message, dedupe_key, created_at, notif_type, severity, meta_json)
       VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`,
      [userId, message, dedupeKey, 'REMINDER', 'WARN', JSON.stringify({ petition_id: petitionId, route: 'peticiones' })]
    );
    return true;
  } catch (e) {
    if (String(e?.message || '').includes('UNIQUE')) return false;
    throw e;
  }
}

async function getUserEmail(userId) {
  const row = await db.get(`SELECT email FROM users WHERE id = ?`, [userId]);
  return row?.email || null;
}

async function listAdminIds() {
  const admins = await db.all(`SELECT id FROM users WHERE role = 'ADMIN'`);
  return admins.map((a) => a.id);
}

function escalationLevel(reminderCount) {
  if (reminderCount >= 5) return 2;
  if (reminderCount >= 3) return 1;
  return 0;
}

async function runDailyReminders() {
  const petitions = await db.all(
    `SELECT id, user_id, type, data, status, reminder_count, last_reminder_at
     FROM petitions
     WHERE status IN ('BORRADOR', 'PENDIENTE_INFO')
     ORDER BY created_at DESC`
  );

  let createdUserNotifs = 0;
  let createdAdminNotifs = 0;

  for (const p of petitions) {
    const data = safeJsonParse(p.data);
    const docsByType = await docsSetForPetition(p.id, p.user_id);
    const checklist = computeChecklist({ type: p.type, data, docsByType });

    const hasPending =
      (checklist.missingFields && checklist.missingFields.length) ||
      (checklist.missingDocs && checklist.missingDocs.length) ||
      (checklist.ruleErrors && checklist.ruleErrors.length);

    if (!hasPending) continue;

    // Dedupe per petition per day for user
    const dedupeKey = `reminder:${p.id}:${todayKey()}`;
    const msg = `Recordatorio: tu petición #${p.id} está incompleta. Entra para completar los datos/documentos.`;
    const created = await insertNotification(p.user_id, p.id, msg, dedupeKey);

    if (!created) continue; // already reminded today

    // Prepared email outbox (disabled by default)
    const toEmail = await getUserEmail(p.user_id);
    if (toEmail) {
      await enqueueEmail({
        userId: p.user_id,
        toEmail,
        templateKey: 'PETITION_REMINDER',
        payload: { petition_id: p.id, status: p.status },
      });
    }

    createdUserNotifs += 1;

    const nextCount = Number(p.reminder_count || 0) + 1;
    await db.run(
      `UPDATE petitions
       SET reminder_count = ?, last_reminder_at = datetime('now')
       WHERE id = ?`,
      [nextCount, p.id]
    );

    const level = escalationLevel(nextCount);
    if (level > 0) {
      const adminIds = await listAdminIds();
      const adminDedupe = `escalation:${p.id}:${todayKey()}:L${level}`;
      const adminMsg = `Escalado L${level}: petición #${p.id} sigue incompleta tras ${nextCount} recordatorios (estado: ${p.status}).`;
      for (const adminId of adminIds) {
        const c = await insertNotification(adminId, p.id, adminMsg, adminDedupe);
        if (c) createdAdminNotifs += 1;
      }
    }
  }

  return { createdUserNotifs, createdAdminNotifs };
}

module.exports = { runDailyReminders };
