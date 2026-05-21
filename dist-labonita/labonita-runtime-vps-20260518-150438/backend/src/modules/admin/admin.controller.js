const db = require('../../config/db');
const { logPetitionEvent, listPetitionTimeline } = require('../petitions/petition.events');
const { computeChecklist } = require('../petitions/petition.validation');
const billingOutbox = require('../billing/billingOutbox.service');

function safeJsonParse(s) {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }


async function computeBalanceToZero(petitionRow) {
  const data = safeJsonParse(petitionRow.data, {});
  const expenses = (
    Number(data?.expenses?.gastos_puntuales_total || 0) +
    Number(data?.expenses?.gastos_representacion_total || 0)
  );
  const comm = await db.get('SELECT COALESCE(SUM(amount_eur), 0) AS total FROM commissions WHERE petition_id = ?', [petitionRow.id]);
  const ledger = await db.get(`
    SELECT
      COALESCE(SUM(CASE WHEN direction='IN' THEN amount_eur ELSE 0 END), 0) AS in_total,
      COALESCE(SUM(CASE WHEN direction='OUT' THEN amount_eur ELSE 0 END), 0) AS out_total
    FROM ledger_transactions
    WHERE petition_id = ?
  `, [petitionRow.id]);

  const receipts_total = Number(ledger?.in_total || 0);
  const payouts_total = Number(ledger?.out_total || 0);
  const commissions_total = Number(comm?.total || 0);
  const balance_to_zero = receipts_total - expenses - commissions_total - payouts_total;
  return { receipts_total, payouts_total, commissions_total, expenses_total: expenses, balance_to_zero };
}

}

async function docsSetForPetition(petitionId) {
  const docs = await db.all(`SELECT doc_type FROM documents WHERE petition_id = ?`, [petitionId]);
  return new Set((docs || []).map((d) => d.doc_type));
}

function checklistSummaryText(checklist, maxItems = 3) {
  const parts = [];

  const fields = (checklist.missingFields || []).slice(0, maxItems).map((f) => f.label);
  const docs = (checklist.missingDocs || []).slice(0, maxItems).map((d) => d.doc_type);
  const rules = (checklist.ruleErrors || []).slice(0, maxItems).map((r) => r.message || r.code);

  if (fields.length) parts.push(`Campos: ${fields.join(', ')}`);
  if (docs.length) parts.push(`Docs: ${docs.join(', ')}`);
  if (rules.length) parts.push(`Reglas: ${rules.join(', ')}`);

  return parts.join(' | ');
}

function checklistCounts(checklist) {
  const f = (checklist.missingFields || []).length;
  const d = (checklist.missingDocs || []).length;
  const r = (checklist.ruleErrors || []).length;
  return { missing_fields: f, missing_docs: d, rule_errors: r, total_missing: f + d + r, ok: (f + d + r) === 0 };
}


function normalizeType(t) {
  return String(t || '').trim().toUpperCase();
}

function nowIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function notifyOnce(userId, message, dedupeKey, notifType = 'GENERIC', severity = 'INFO', meta = null) {
  try {
    await db.run(
      `INSERT INTO notifications (user_id, message, dedupe_key, created_at, notif_type, severity, meta_json)
       VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`,
      [userId, message, dedupeKey, notifType, severity, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) {
    if (String(e?.message || '').includes('UNIQUE')) return;
    throw e;
  }
}

async function upsertMembership(userId, { type, status } = {}) {
  await db.run(
    `INSERT OR IGNORE INTO memberships (user_id, type, status, service_puntual_count, created_at, updated_at)
     VALUES (?, COALESCE(?, 'ASOCIADO'), COALESCE(?, 'ACTIVE'), 0, datetime('now'), datetime('now'))`,
    [userId, type, status]
  );

  await db.run(
    `UPDATE memberships
     SET type = COALESCE(?, type),
         status = COALESCE(?, status),
         updated_at = datetime('now')
     WHERE user_id = ?`,
    [type, status, userId]
  );

  const m = await db.get(`SELECT id FROM memberships WHERE user_id = ?`, [userId]);
  if (m?.id) {
    await db.run(
      `INSERT INTO membership_events (membership_id, event_type, payload, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [m.id, 'UPDATED_BY_ADMIN', JSON.stringify({ type, status })]
    );
  }
}

function extractSocioFields(type, data) {
  // Backward compatible: old petition data used root fields
  const legacyArtistName = data.artist_name;
  const legacyEmail = data.email;
  const legacyDesc = data.description;

  if (legacyArtistName && legacyEmail) {
    return { artist_name: legacyArtistName, email: legacyEmail, description: legacyDesc || '' };
  }

  // New: nested
  const artist_name = data?.profile?.artist_name;
  const email = data?.contact?.email;
  const description = data?.profile?.bio || data?.description || '';

  return { artist_name, email, description };
}

exports.listPetitions = async (_req, res) => {
  try {
    const rows = await db.all(
      `SELECT p.*, u.email AS user_email
       FROM petitions p
       JOIN users u ON u.id = p.user_id
       WHERE p.status IN ('ENVIADA', 'PENDIENTE_VALIDACION', 'PENDIENTE_INFO', 'APROBADA', 'LABORAL_EN_CURSO', 'FACTURACION_EN_CURSO', 'FACTURA_EMITIDA', 'COBRO_PENDIENTE', 'COBRO_PARCIAL', 'COBRADA', 'NOMINA_PUBLICADA', 'PAGADA', 'CERRADA_CERO', 'RECHAZADA')
       ORDER BY p.created_at DESC`
    );

    const ids = rows.map((p) => p.id).filter(Boolean);
    const docsByPetition = new Map();

    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      const docs = await db.all(
        `SELECT petition_id, doc_type
         FROM documents
         WHERE petition_id IN (${placeholders})
         GROUP BY petition_id, doc_type`,
        ids
      );
      for (const d of docs || []) {
        if (!docsByPetition.has(d.petition_id)) docsByPetition.set(d.petition_id, new Set());
        docsByPetition.get(d.petition_id).add(d.doc_type);
      }
    }

    rows.forEach((p) => {
      p.data = safeJsonParse(p.data);
      const docsSet = docsByPetition.get(p.id) || new Set();
      const checklist = computeChecklist({ type: p.type, data: p.data, docsByType: docsSet });
      p.summary = checklistCounts(checklist);
      p.summary_preview = checklistSummaryText(checklist);
    });

    rows.sort((a, b) => {
      const aScore = a.status === 'PENDIENTE_INFO' ? 0 : 1;
      const bScore = b.status === 'PENDIENTE_INFO' ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });

    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

exports.requestMoreInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};

    const petition = await db.get(`SELECT * FROM petitions WHERE id = ?`, [id]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const data = safeJsonParse(petition.data);
    const docsByType = await docsSetForPetition(petition.id);
    const checklist = computeChecklist({ type: petition.type, data, docsByType });

    const finalNote = note || 'Faltan datos, por favor revisá el checklist y completá lo faltante.';
    const summary = checklistSummaryText(checklist);

    await db.run(
      `UPDATE petitions
       SET status = 'PENDIENTE_INFO',
           locked = 0,
           admin_note = ?,
           pending_checklist = ?,
           pending_checklist_updated_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`,
      [finalNote, JSON.stringify(checklist), id]
    );

    const msg = summary
      ? `Admin solicita más información en tu petición #${id}. ${finalNote} | ${summary}`
      : `Admin solicita más información en tu petición #${id}. ${finalNote}`;

    await notifyOnce(
      petition.user_id,
      msg,
      `petition:${id}:request-info:${nowIsoDate()}`,
      'PETITION_STATUS',
      'WARN',
      { petition_id: id, route: 'peticiones' }
    );

    return res.json({ ok: true, summary: checklistCounts(checklist) });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

exports.approvePetition = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await db.get(`SELECT * FROM petitions WHERE id = ?`, [id]);
    const fromStatus = petition.status;
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const type = normalizeType(petition.type);
    const data = safeJsonParse(petition.data);

    const isOnboarding = type === 'ONBOARDING_ASSOCIADO' || type === 'ONBOARDING_PUNTUAL';
    const membershipType = type === 'ONBOARDING_PUNTUAL' ? 'PUNTUAL' : 'ASOCIADO';

    await db.transaction(async () => {
      if (isOnboarding) {
        const socioFields = extractSocioFields(type, data);
        if (!socioFields.artist_name || !socioFields.email) {
          throw new Error('Datos obligatorios incompletos para crear socio (nombre artístico + email)');
        }

        const exists = await db.get(`SELECT id FROM socios WHERE user_id = ?`, [petition.user_id]);

        if (!exists) {
          await db.run(
            `INSERT INTO socios (user_id, artist_name, email, description, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            [petition.user_id, socioFields.artist_name, socioFields.email, socioFields.description || '']
          );
        } else {
          await db.run(
            `UPDATE socios
             SET artist_name = COALESCE(?, artist_name),
                 email = COALESCE(?, email),
                 description = COALESCE(?, description),
                 active = 1,
                 updated_at = datetime('now')
             WHERE user_id = ?`,
            [socioFields.artist_name, socioFields.email, socioFields.description || '', petition.user_id]
          );
        }

        await upsertMembership(petition.user_id, { type: membershipType, status: 'ACTIVE' });
      }

      await db.run(
        `UPDATE petitions SET status = 'APROBADA', locked = 1, updated_at = datetime('now') WHERE id = ?`,
        [id]
      );

      const msg =
        isOnboarding
          ? (membershipType === 'PUNTUAL'
              ? 'Tu solicitud fue APROBADA. Ya estás habilitado como PUNTUAL.'
              : 'Tu solicitud fue APROBADA. Ya sos socio.')
          : `Tu petición #${id} fue APROBADA.`;

      await notifyOnce(
        petition.user_id,
        msg,
        `petition:${id}:approved`,
        'PETITION_STATUS',
        'INFO',
        { petition_id: id, route: 'peticiones' }
      );
    });

// Auto-facturación (no rompe aprobación si billing falla)
try {
  const t = String(type || '').toUpperCase();
  const already = petition.billing_invoice_id || (String(petition.billing_status || '').toUpperCase() === 'DRAFT_CREATED');
  if (!already && (t === 'ALTA_FACTURA' || t === 'FORMACION')) {
    await billingOutbox.enqueueAndTry(petition);
  }
} catch (_e) {}

return res.json({ ok: true });

  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

exports.rejectPetition = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const petition = await db.get(`SELECT * FROM petitions WHERE id = ?`, [id]);
    const fromStatus = petition.status;
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    await db.run(
      `UPDATE petitions
       SET status = 'RECHAZADA', locked = 1, rejection_reason = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [reason || null, id]
    );

    await logPetitionEvent({ petitionId: Number(id), actorUserId: req.user.id, actorRole: req.user.role, eventType: 'ADMIN_REQUEST_INFO', fromStatus, toStatus: 'PENDIENTE_INFO', payload: { admin_note: note, checklist } });

    await notifyOnce(
      petition.user_id,
      `Tu solicitud fue RECHAZADA.${reason ? ' Motivo: ' + reason : ''}`,
      `petition:${id}:rejected`,
      'PETITION_STATUS',
      'ERROR',
      { petition_id: id, route: 'peticiones' }
    );

// Auto-facturación (no rompe aprobación si billing falla)
try {
  const t = String(type || '').toUpperCase();
  const already = petition.billing_invoice_id || (String(petition.billing_status || '').toUpperCase() === 'DRAFT_CREATED');
  if (!already && (t === 'ALTA_FACTURA' || t === 'FORMACION')) {
    await billingOutbox.enqueueAndTry(petition);
  }
} catch (_e) {}

return res.json({ ok: true });

  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.listSocios = async (_req, res) => {
  try {
    const socios = await db.all(`SELECT * FROM socios ORDER BY created_at DESC`);
    return res.json(socios);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.listNoSocios = async (_req, res) => {
  try {
    const rows = await db.all(
      `SELECT u.id, u.email, u.role, u.created_at
       FROM users u
       LEFT JOIN socios s ON s.user_id = u.id
       WHERE s.id IS NULL AND UPPER(u.role) != 'ADMIN'
       ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.deactivateSocio = async (req, res) => {
  try {
    const { id } = req.params;

    const socio = await db.get(`SELECT * FROM socios WHERE id = ?`, [id]);
    if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

    if (Number(socio.active) === 0) {
      return res.json({ ok: true, alreadyInactive: true });
    }

    await db.transaction(async () => {
      await db.run(`UPDATE socios SET active = 0, updated_at = datetime('now') WHERE id = ?`, [id]);
      await upsertMembership(socio.user_id, { status: 'INACTIVE' });

      await notifyOnce(
        socio.user_id,
        'Tu membresía fue desactivada por administración.',
        `membership:deactivated:${socio.user_id}`,
        'MEMBERSHIP',
        'WARN',
        { route: 'area-privada' }
      );
    });

    return res.json({ ok: true, alreadyInactive: false });
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

// -------- Memberships --------
exports.listMemberships = async (_req, res) => {
  try {
    const rows = await db.all(
      `SELECT u.id AS user_id, u.email, u.role, m.type, m.status, m.service_puntual_count, m.created_at, m.updated_at
       FROM users u
       LEFT JOIN memberships m ON m.user_id = u.id
       WHERE UPPER(u.role) != 'ADMIN'
       ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.updateMembership = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, status } = req.body || {};

    await db.transaction(async () => {
      await upsertMembership(userId, { type, status });
    });

// Auto-facturación (no rompe aprobación si billing falla)
try {
  const t = String(type || '').toUpperCase();
  const already = petition.billing_invoice_id || (String(petition.billing_status || '').toUpperCase() === 'DRAFT_CREATED');
  if (!already && (t === 'ALTA_FACTURA' || t === 'FORMACION')) {
    await billingOutbox.enqueueAndTry(petition);
  }
} catch (_e) {}

return res.json({ ok: true });

  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};


exports.getPetitionChecklist = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await db.get(
      `SELECT p.*, u.email AS user_email FROM petitions p JOIN users u ON u.id = p.user_id WHERE p.id = ?`,
      [id]
    );
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const data = safeJsonParse(petition.data);
    const docsByType = await docsSetForPetition(petition.id);
    const checklist = computeChecklist({ type: petition.type, data, docsByType });

    return res.json({
      petition: {
        id: petition.id,
        user_id: petition.user_id,
        user_email: petition.user_email,
        type: petition.type,
        status: petition.status,
        admin_note: petition.admin_note || null,
        rejection_reason: petition.rejection_reason || null,
        created_at: petition.created_at,
        updated_at: petition.updated_at,
        last_reminder_at: petition.last_reminder_at || null,
        reminder_count: petition.reminder_count || 0,
        pending_checklist_updated_at: petition.pending_checklist_updated_at || null,
      },
      checklist,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

exports.listPetitionDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await db.get(`SELECT id FROM petitions WHERE id = ?`, [id]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const docs = await db.all(
      `SELECT id, user_id, petition_id, doc_type, original_name, mime_type, size, created_at, is_official, uploaded_by_role
       FROM documents
       WHERE petition_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    return res.json(docs || []);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};


exports.remindPetition = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await db.get(
      `SELECT p.*, u.email AS user_email
       FROM petitions p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [id]
    );
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const data = safeJsonParse(petition.data);
    const docsByType = await docsSetForPetition(petition.id);
    const checklist = computeChecklist({ type: petition.type, data, docsByType });
    const counts = checklistCounts(checklist);
    const summary = checklistSummaryText(checklist);

    const dedupeKey = `admin-reminder:${id}:${nowIsoDate()}`;

    const msg = summary
      ? `Recordatorio de administración: tu petición #${id} sigue incompleta (${petition.status}). ${petition.admin_note || ''} | ${summary}`.trim()
      : `Recordatorio de administración: tu petición #${id} sigue incompleta (${petition.status}). ${petition.admin_note || ''}`.trim();

    await notifyOnce(petition.user_id, msg, dedupeKey, 'CLOSE_BLOCKED', 'ERROR', { petition_id: id, route: 'controles', focus: 'control-total' });

    await db.run(
      `UPDATE petitions
       SET last_reminder_at = datetime('now'),
           reminder_count = COALESCE(reminder_count, 0) + 1,
           updated_at = updated_at
       WHERE id = ?`,
      [id]
    );

    return res.json({ ok: true, summary: counts });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};



exports.getPetitionTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const petition = await db.get(`SELECT id FROM petitions WHERE id = ?`, [id]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });
    const timeline = await listPetitionTimeline(Number(id));
    return res.json({ timeline });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

const LONG_STATUS_TRANSITIONS = {
  APROBADA: ['LABORAL_EN_CURSO', 'FACTURACION_EN_CURSO'],
  LABORAL_EN_CURSO: ['FACTURA_EMITIDA', 'NOMINA_PUBLICADA'],
  FACTURACION_EN_CURSO: ['FACTURA_EMITIDA'],
  FACTURA_EMITIDA: ['COBRO_PENDIENTE', 'NOMINA_PUBLICADA'],
  COBRO_PENDIENTE: ['COBRO_PARCIAL', 'COBRADA'],
  COBRO_PARCIAL: ['COBRADA'],
  COBRADA: ['NOMINA_PUBLICADA'],
  NOMINA_PUBLICADA: ['PAGADA'],
  PAGADA: ['CERRADA_CERO'],
};

exports.updatePetitionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { to_status } = req.body || {};
    if (!to_status) return res.status(400).json({ error: 'to_status requerido' });

    const petition = await db.get(`SELECT * FROM petitions WHERE id = ?`, [id]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const from = petition.status;
    const allowed = (LONG_STATUS_TRANSITIONS[from] || []);
    if (!allowed.includes(to_status)) {
      return res.status(409).json({ error: `Transición no permitida: ${from} -> ${to_status}` });
    }


    if (to_status === 'CERRADA_CERO') {
      const summary = await computeBalanceToZero(petition);
      const tol = Number(process.env.CLOSE_ZERO_TOLERANCE_EUR || 0.01);
      if (Math.abs(Number(summary.balance_to_zero || 0)) > tol) {
        return res.status(409).json({
          error: 'No se puede cerrar: el balance no es cero',
          tolerance_eur: tol,
          summary,
        });
      }
    }

    await db.run(
      `UPDATE petitions SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [to_status, id]
    );

    await logPetitionEvent({
      petitionId: Number(id),
      actorUserId: req.user.id,
      actorRole: req.user.role,
      eventType: 'ADMIN_STATUS_CHANGED',
      fromStatus: from,
      toStatus: to_status,
    });

    return res.json({ ok: true, from_status: from, to_status });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};


exports.assignPetition = async (req, res) => {
  const id = Number(req.params.id);
  const assigned_admin_id = req.body?.assigned_admin_id == null ? null : Number(req.body.assigned_admin_id);
  const priority = req.body?.priority == null ? null : Number(req.body.priority);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const p = await db.get(`SELECT id FROM petitions WHERE id = ?`, [id]);
  if (!p) return res.status(404).json({ error: 'Petición no encontrada' });

  const sets = [];
  const args = [];
  if (priority != null && !Number.isNaN(priority)) { sets.push('priority = ?'); args.push(priority); }
  if (req.body.hasOwnProperty('assigned_admin_id')) { sets.push('assigned_admin_id = ?'); args.push(assigned_admin_id); }
  if (!sets.length) return res.status(400).json({ error: 'no changes' });

  args.push(id);
  await db.run(`UPDATE petitions SET ${sets.join(', ')} WHERE id = ?`, args);

  await logPetitionEvent({
    petitionId: id,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    eventType: 'ASSIGNMENT_UPDATED',
    fromStatus: null,
    toStatus: null,
    payload: { assigned_admin_id, priority },
  });

  return res.json({ ok: true });
};


exports.searchUsers = async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) return res.json({ rows: [] });
  const rows = await db.all(
    `SELECT id, email, role
     FROM users
     WHERE LOWER(email) LIKE ?
     ORDER BY email ASC
     LIMIT 20`,
    [`%${q}%`]
  );
  return res.json({ rows });
};


exports.getPetitionSchema = async (req, res) => {
  const petitionId = Number(req.params.id);
  const row = await db.get(`SELECT id, type FROM petitions WHERE id = ?`, [petitionId]);
  if (!row) return res.status(404).json({ error: 'Petición no encontrada' });
  const { PETITION_TYPES } = require('../petitions/petition.schemas');
  const schema = PETITION_TYPES[String(row.type||'').toUpperCase()];
  if (!schema) return res.status(404).json({ error: 'Schema no encontrado' });
  const fields = (schema.fields || []).map((f) => ({
    path: f.path,
    label: f.label,
    type: f.type || 'text',
    required: !!f.required,
    options: f.options || null,
    placeholder: f.placeholder || null,
  }));
  return res.json({ type: row.type, fields, docs: schema.docs || [], docsByStep: schema.docsByStep || null, steps: schema.steps || null });
};
