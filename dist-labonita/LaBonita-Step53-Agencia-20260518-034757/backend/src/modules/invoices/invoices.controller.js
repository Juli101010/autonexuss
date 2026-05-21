/**
 * Invoice reconciliation endpoints.
 * Prepared for DelSol integration: we store external IDs/series/number but do NOT enforce numbering until sync.
 */
const db = require('../../config/db');
const { logPetitionEvent } = require('../petitions/petition.events');

function nowIso() { return new Date().toISOString(); }

exports.listInvoices = async (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const rows = await db.all(
    `SELECT d.id AS doc_id, d.petition_id, d.doc_type, d.original_name, d.created_at,
            d.external_system, d.external_id, d.external_series, d.external_number, d.sync_status,
            p.type AS petition_type, p.status AS petition_status
     FROM documents d
     JOIN petitions p ON p.id = d.petition_id
     WHERE d.doc_type = 'FACTURA_PDF'
     ${status ? 'AND COALESCE(d.sync_status,\'\') = ?' : ''}
     ORDER BY d.created_at DESC
     LIMIT 500`,
    status ? [status] : []
  );
  return res.json({ rows });
};

exports.reconcileInvoice = async (req, res) => {
  const petitionId = Number(req.params.id);
  const system = String(req.body.system || 'DELSOL').toUpperCase();
  const mode = String(req.body.mode || 'MANUAL').toUpperCase();
  const externalId = req.body.external_id ? String(req.body.external_id) : null;
  const series = req.body.external_series ? String(req.body.external_series) : null;
  const number = req.body.external_number ? String(req.body.external_number) : null;
  const note = req.body.note ? String(req.body.note) : null;

  if (!petitionId) return res.status(400).json({ error: 'petition_id requerido' });

  const doc = await db.get(
    `SELECT id, petition_id FROM documents
     WHERE petition_id = ? AND doc_type = 'FACTURA_PDF'
     ORDER BY created_at DESC
     LIMIT 1`,
    [petitionId]
  );
  if (!doc) return res.status(409).json({ error: 'No hay FACTURA_PDF para conciliar' });

  // Save reconciliation record (history)
  const r = await db.run(
    `INSERT INTO invoice_reconciliations
      (petition_id, doc_id, system, mode, external_id, external_series, external_number, status, note, reconciled_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [petitionId, doc.id, system, mode, externalId, series, number, 'MATCHED', note, req.user.id]
  );

  // Update latest invoice doc with external refs (prep for auto sync)
  await db.run(
    `UPDATE documents
     SET external_system = ?, external_id = ?, external_series = ?, external_number = ?,
         sync_status = 'MATCHED', sync_payload = COALESCE(sync_payload, ?)
     WHERE id = ?`,
    [system, externalId, series, number, JSON.stringify({ reconciled_at: nowIso(), mode }), doc.id]
  );

  await logPetitionEvent({
    petitionId,
    actorUserId: req.user.id,
    actorRole: 'ADMIN',
    eventType: 'INVOICE_RECONCILED',
    payload: { system, mode, external_id: externalId, external_series: series, external_number: number, doc_id: doc.id }
  });

  return res.json({ ok: true, reconciliation_id: r.lastID, doc_id: doc.id });
};
