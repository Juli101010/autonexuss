const db = require('../../config/db');
const { PETITION_TYPES, normalizeType, computeChecklist } = require('./petition.validation');
const { logPetitionEvent } = require('./petition.events');

function safeJsonParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

function isEditableStatus(status) {
  return status === 'BORRADOR' || status === 'PENDIENTE_INFO';
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


async function docsSetForPetition(petitionId, userId) {
  const docs = await db.all(
    `SELECT doc_type FROM documents WHERE petition_id = ? AND user_id = ?`,
    [petitionId, userId]
  );
  return new Set(docs.map((d) => d.doc_type));
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

exports.listTypes = async (_req, res) => {
  const types = Object.entries(PETITION_TYPES).map(([key, v]) => ({
    type: key,
    label: v.label,
    required_docs: v.docs || [],
    required_fields: (v.fields || []).map((f) => ({ path: f.path, label: f.label, type: f.type || 'string', required: f.required !== false, mustBeTrue: f.mustBeTrue === true })),
  }));
  return res.json(types);
};

exports.create = async (req, res) => {
  try {
    const type = normalizeType(req.body?.type || 'ONBOARDING_ASSOCIADO');

    if (!PETITION_TYPES[type]) {
      return res.status(400).json({ error: 'Tipo de petición inválido' });
    }

    const r = await db.run(
      `INSERT INTO petitions (user_id, type, data, status, locked, created_at, updated_at)
       VALUES (?, ?, ?, 'BORRADOR', 0, datetime('now'), datetime('now'))`,
      [req.user.id, type, JSON.stringify({})]
    );
    return res.json({ id: r.lastID });
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.my = async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT * FROM petitions WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    const ids = rows.map((p) => p.id).filter(Boolean);
    const docsByPetition = new Map();

    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      const docs = await db.all(
        `SELECT petition_id, doc_type
         FROM documents
         WHERE user_id = ? AND petition_id IN (${placeholders})
         GROUP BY petition_id, doc_type`,
        [req.user.id, ...ids]
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

    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

exports.listByUser = exports.my;

exports.getMine = async (req, res) => {
  try {
    const row = await db.get(
      `SELECT * FROM petitions WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'Petición no encontrada' });
    row.data = safeJsonParse(row.data);
    return res.json(row);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;

    if (!patch || typeof patch !== 'object') return res.status(400).json({ error: 'Invalid data' });

    const petition = await db.get(
      `SELECT id, type, data, status, locked FROM petitions WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    if (!isEditableStatus(petition.status) || petition.locked) {
      return res.status(409).json({ error: 'Petición no editable en este estado' });
    }

    const current = safeJsonParse(petition.data);
    const merged = { ...current, ...patch };

    const fromStatus = petition.status;

    await db.run(
      `UPDATE petitions SET data = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      [JSON.stringify(merged), id, req.user.id]
    );

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.checklistMine = async (req, res) => {
  try {
    const { id } = req.params;
    const petition = await db.get(
      `SELECT id, type, data, status, locked FROM petitions WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const data = safeJsonParse(petition.data);
    const docsByType = await docsSetForPetition(petition.id, req.user.id);
    const checklist = computeChecklist({ type: petition.type, data, docsByType });

    const canSend =
      petition.status === 'BORRADOR' || petition.status === 'PENDIENTE_INFO'
        ? checklist.missingFields.length === 0 && checklist.missingDocs.length === 0 && checklist.ruleErrors.length === 0
        : false;

    return res.json({ ...checklist, canSend });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

exports.send = async (req, res) => {
  try {
    const { id } = req.params;

    const petition = await db.get(
      `SELECT * FROM petitions WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    if (!isEditableStatus(petition.status) || petition.locked) {
      return res.status(409).json({ error: 'Petición no editable en este estado' });
    }

    const data = safeJsonParse(petition.data);

    // Default IRPF for puntual if missing
    if (normalizeType(petition.type) === 'ONBOARDING_PUNTUAL') {
      data.fiscal = data.fiscal || {};
      if (data.fiscal.irpf_rate === undefined || data.fiscal.irpf_rate === null || data.fiscal.irpf_rate === '') {
        data.fiscal.irpf_rate = 0.02;
      }
      await db.run(
        `UPDATE petitions SET data = ?, updated_at = datetime('now') WHERE id = ?`,
        [JSON.stringify(data), id]
      );
    }

    const docsByType = await docsSetForPetition(petition.id, req.user.id);
    const checklist = computeChecklist({ type: petition.type, data, docsByType });
    // Allow sending even with missing requirements: goes to PENDIENTE_VALIDACION
    const fromStatus = petition.status;

    await db.run(
      `UPDATE petitions
       SET status = 'PENDIENTE_VALIDACION',
           locked = 1,
           pending_checklist = ?,
           pending_checklist_updated_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`,
      [JSON.stringify(checklist), id]
    );

    await logPetitionEvent({ petitionId: Number(id), actorUserId: req.user.id, actorRole: req.user.role, eventType: 'PETITION_SUBMITTED', fromStatus, toStatus: 'PENDIENTE_VALIDACION', payload: { checklist } });

    await notifyOnce(
      req.user.id,
      `Tu petición #${id} fue ENVIADA y está esperando validación.`,
      `petition:${id}:sent`, 'PETITION_STATUS', 'INFO', { petition_id: id, route: 'peticiones' }
    );

    return res.json({ ok: true, status: 'PENDIENTE_VALIDACION', checklist });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};


/**
 * Convert a PRESUPUESTO petition into a new ALTA_FACTURA petition (draft).
 * Intended to "send you to plantilla de alta" from the map.
 *
 * Admin-only: keeps original budget, creates a new petition for the same artist.
 */
exports.convertBudgetToAltaFactura = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const petition = await db.get('SELECT * FROM petitions WHERE id = ?', [id]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });
    if (petition.type !== 'PRESUPUESTO') return res.status(409).json({ error: 'Solo se puede convertir una petición PRESUPUESTO' });

    const srcData = safeJsonParse(petition.data, {});
    const mapped = {
      request: { date: srcData?.request?.date || null, responsible_name: srcData?.request?.responsible_name || null },
      event: {
        company_show: srcData?.event?.company_show || null,
        reference: srcData?.event?.reference || null,
        country: srcData?.event?.country || null,
        city: srcData?.event?.city || null,
        dates_text: srcData?.event?.dates_text || srcData?.event?.dates_text || null,
      },
      invoice: {
        // Budget client is not full fiscal data; artist/admin will complete later
        razon_social: srcData?.budget?.client_name || '',
        tax_id: '',
        vies: '',
        address: '',
        postal_code: '',
        city: '',
        province: '',
        country: '',
        concept: srcData?.budget?.concept || '',
        amount_without_vat: Number(srcData?.budget?.amount_without_vat || 0),
      },
      vat: { type: srcData?.budget?.vat_type || '', other: '' },
      comments: srcData?.comments || '',
    };

    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO petitions (user_id, type, status, data, locked, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [petition.user_id, 'ALTA_FACTURA', 'BORRADOR', JSON.stringify(mapped), 0, now]
    );

    const newId = result.lastID;

    await logPetitionEvent({
      petitionId: id,
      actorUserId: req.user.id,
      actorRole: req.user.role,
      eventType: 'BUDGET_CONVERTED',
      fromStatus: petition.status,
      toStatus: petition.status,
      payload: { new_petition_id: newId },
    });

    await logPetitionEvent({
      petitionId: newId,
      actorUserId: req.user.id,
      actorRole: req.user.role,
      eventType: 'PETITION_CREATED_FROM_BUDGET',
      fromStatus: 'BORRADOR',
      toStatus: 'BORRADOR',
      payload: { source_budget_id: id },
    });

    return res.json({ ok: true, new_petition_id: newId });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};


exports.getSchema = async (req, res) => {
  const type = String(req.query.type || '').toUpperCase();
  const { PETITION_TYPES } = require('./petition.schemas');
  const schema = PETITION_TYPES[type];
  if (!schema) return res.status(404).json({ error: 'unknown type' });

  // Return only what UI needs: fields (path/label/type/options/required) + docs list
  const fields = (schema.fields || []).map((f) => ({
    path: f.path,
    label: f.label,
    type: f.type || 'text',
    required: !!f.required,
    options: f.options || null,
    placeholder: f.placeholder || null,
  }));
  return res.json({ type, fields, docs: schema.docs || [], docsByStep: schema.docsByStep || null, steps: schema.steps || null });
};
