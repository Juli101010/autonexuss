const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const { logPetitionEvent } = require('../petitions/petition.events');
const { generatePresupuestoPdf } = require('../../services/presupuesto.service');
const { generateFacturaPdf } = require('../../services/factura.service');
const { generateContratoPdf } = require('../../services/contrato.service');
const { generateNominaPdf } = require('../../services/nomina.service');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function safeName(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function safeJsonParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

function isEditableStatus(status) {
  return status === 'BORRADOR' || status === 'PENDIENTE_INFO';
}

exports.uploadForPetition = async (req, res) => {
  try {
    const userId = req.user.id;
    const petitionId = Number(req.params.id);
    const { doc_type } = req.body || {};

    if (!petitionId || !doc_type) return res.status(400).json({ error: 'petitionId y doc_type son requeridos' });
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const petition = await db.get(`SELECT id, status, locked FROM petitions WHERE id = ? AND user_id = ?`, [petitionId, userId]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    if (!isEditableStatus(petition.status) || petition.locked) {
      return res.status(409).json({ error: 'No se pueden subir documentos en este estado' });
    }

    const uploadRoot = path.join(__dirname, '../../../uploads');
    const userDir = path.join(uploadRoot, String(userId));
    ensureDir(userDir);

    const original = safeName(req.file.originalname);
    const filename = `${Date.now()}_${original}`;
    const storagePath = path.join(userDir, filename);

    fs.writeFileSync(storagePath, req.file.buffer);

    const r = await db.run(
      `INSERT INTO documents (user_id, petition_id, doc_type, original_name, filename, mime_type, size, storage_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, petitionId, String(doc_type).trim().toUpperCase(), original, filename, req.file.mimetype || null, req.file.size || null, storagePath]
    );

    return res.json({ ok: true, id: r.lastID });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};


exports.uploadOfficialForPetition = async (req, res) => {
  try {
    const adminId = req.user.id;
    const petitionId = Number(req.params.id);
    const { doc_type } = req.body || {};

    if (!petitionId || !doc_type) return res.status(400).json({ error: 'petitionId y doc_type son requeridos' });
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const petition = await db.get(`SELECT id FROM petitions WHERE id = ?`, [petitionId]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const uploadRoot = path.join(__dirname, '../../../uploads');
    const userDir = path.join(uploadRoot, String(adminId));
    ensureDir(userDir);

    const original = safeName(req.file.originalname);
    const filename = `${Date.now()}_${original}`;
    const storagePath = path.join(userDir, filename);

    fs.writeFileSync(storagePath, req.file.buffer);

    const r = await db.run(
      `INSERT INTO documents (user_id, petition_id, doc_type, original_name, filename, mime_type, size, storage_path, is_official, uploaded_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'ADMIN')`,
      [adminId, petitionId, doc_type, original, filename, req.file.mimetype, req.file.size, storagePath]
    );

    await logPetitionEvent({
      petitionId,
      actorUserId: adminId,
      actorRole: 'ADMIN',
      eventType: 'DOCUMENT_PUBLISHED',
      fromStatus: null,
      toStatus: null,
      payload: { doc_id: r.lastID, doc_type }
    });

    return res.json({ ok: true, id: r.lastID });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};


exports.listForPetition = async (req, res) => {
  try {
    const userId = req.user.id;
    const petitionId = Number(req.params.id);

    const petition = await db.get(`SELECT id FROM petitions WHERE id = ? AND user_id = ?`, [petitionId, userId]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const rows = await db.all(
      `SELECT id, doc_type, original_name, mime_type, size, created_at, is_official, uploaded_by_role, user_id
       FROM documents
       WHERE petition_id = ? AND (user_id = ? OR is_official = 1)
       ORDER BY created_at DESC`,
      [petitionId, userId]
    );

    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.download = async (req, res) => {
  try {
    const docId = Number(req.params.docId);
    const row = await db.get(`SELECT * FROM documents WHERE id = ?`, [docId]);
    if (!row) return res.status(404).json({ error: 'Documento no encontrado' });

    const isOwner = row.user_id === req.user.id;
    const isAdmin = String(req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isOwner && !isAdmin) {
      const isArtist = String(req.user.role || '').toUpperCase() === 'ARTIST';
      if (!isArtist || !row.is_official) return res.status(403).json({ error: 'Forbidden' });

      const p = await db.get(`SELECT user_id FROM petitions WHERE id = ?`, [row.petition_id]);
      if (!p || p.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(row.storage_path)) return res.status(404).json({ error: 'Archivo no encontrado en disco' });

    return res.download(row.storage_path, row.original_name);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
};


/**
 * Generate and publish an official PRESUPUESTO PDF for a petition.
 * Admin-only.
 */
exports.emitPresupuestoPdf = async (req, res) => {
  try {
    const adminId = req.user.id;
    const petitionId = Number(req.params.id);
    if (!petitionId) return res.status(400).json({ error: 'petitionId requerido' });

    const petition = await db.get(`SELECT id, user_id, type, data FROM petitions WHERE id = ?`, [petitionId]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });
    if (petition.type !== 'PRESUPUESTO') return res.status(409).json({ error: 'Solo PRESUPUESTO puede emitir PDF' });

    const data = safeJsonParse(petition.data, {});
    const uploadRoot = path.join(__dirname, '../../../uploads');
    const userDir = path.join(uploadRoot, String(adminId));
    ensureDir(userDir);

    const original = `presupuesto_peticion_${petitionId}.pdf`;
    const filename = `${Date.now()}_${original}`;
    const storagePath = path.join(userDir, filename);

    await generatePresupuestoPdf({ outputPath: storagePath, data, petitionId });

    const stat = fs.statSync(storagePath);

    const r = await db.run(
      `INSERT INTO documents (user_id, petition_id, doc_type, original_name, filename, mime_type, size, storage_path, is_official, uploaded_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'ADMIN')`,
      [adminId, petitionId, 'PRESUPUESTO_PDF', original, filename, 'application/pdf', stat.size, storagePath]
    );

    await logPetitionEvent({
      petitionId,
      actorUserId: adminId,
      actorRole: 'ADMIN',
      eventType: 'DOCUMENT_PUBLISHED',
      fromStatus: null,
      toStatus: null,
      payload: { doc_id: r.lastID, doc_type: 'PRESUPUESTO_PDF' }
    });

    return res.json({ ok: true, id: r.lastID });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};


exports.emitOfficialPdf = async (req, res) => {
  try {
    const adminId = req.user.id;
    const petitionId = Number(req.params.id);
    const kind = String(req.params.kind || '').toUpperCase();
    if (!petitionId || !kind) return res.status(400).json({ error: 'petitionId/kind requerido' });

    const petition = await db.get(`SELECT id, user_id, type, data FROM petitions WHERE id = ?`, [petitionId]);
    if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

    const data = safeJsonParse(petition.data, {});
    const uploadRoot = path.join(__dirname, '../../../uploads');
    const userDir = path.join(uploadRoot, String(adminId));
    ensureDir(userDir);

    let docType = null;
    let original = null;
    const filenameBase = `${Date.now()}_${kind.toLowerCase()}_peticion_${petitionId}.pdf`;
    const storagePath = path.join(userDir, filenameBase);

    // totals from controls if needed (nomina)
    const totals = await db.get(
      `SELECT
        COALESCE(SUM(CASE WHEN direction='IN' THEN amount_eur ELSE 0 END),0) AS ledger_in,
        COALESCE(SUM(CASE WHEN direction='OUT' THEN amount_eur ELSE 0 END),0) AS ledger_out
       FROM ledger_transactions WHERE petition_id = ?`,
      [petitionId]
    );
    const expenses = await db.get(`SELECT COALESCE(SUM(amount),0) AS expenses_total FROM lb_expenses WHERE petition_id = ?`, [petitionId]);
    const commissions = await db.get(`SELECT COALESCE(SUM(amount_eur),0) AS commissions_total FROM commissions WHERE petition_id = ?`, [petitionId]);

    const totalsPack = {
      ledgerIn: Number(totals?.ledger_in || 0),
      ledgerOut: Number(totals?.ledger_out || 0),
      expensesTotal: Number(expenses?.expenses_total || 0),
      commissionsTotal: Number(commissions?.commissions_total || 0),
    };

    if (kind === 'FACTURA') {
      docType = 'FACTURA_PDF';
      original = `factura_peticion_${petitionId}.pdf`;
      await generateFacturaPdf({ outputPath: storagePath, data, petitionId });
    } else if (kind === 'CONTRATO') {
      docType = 'CONTRATO_PDF';
      original = `contrato_peticion_${petitionId}.pdf`;
      await generateContratoPdf({ outputPath: storagePath, data, petitionId });
    } else if (kind === 'NOMINA') {
      docType = 'NOMINA_PDF';
      original = `nomina_peticion_${petitionId}.pdf`;
      await generateNominaPdf({ outputPath: storagePath, data, petitionId, totals: totalsPack });
    } else if (kind === 'PRESUPUESTO') {
      docType = 'PRESUPUESTO_PDF';
      original = `presupuesto_peticion_${petitionId}.pdf`;
      await generatePresupuestoPdf({ outputPath: storagePath, data, petitionId });
    } else {
      return res.status(409).json({ error: 'kind no soportado' });
    }

    const stat = fs.statSync(storagePath);

    const r = await db.run(
      `INSERT INTO documents (user_id, petition_id, doc_type, original_name, filename, mime_type, size, storage_path, is_official, uploaded_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'ADMIN')`,
      [adminId, petitionId, docType, original, filenameBase, 'application/pdf', stat.size, storagePath]
    );

    await logPetitionEvent({
      petitionId,
      actorUserId: adminId,
      actorRole: 'ADMIN',
      eventType: 'DOCUMENT_PUBLISHED',
      fromStatus: null,
      toStatus: null,
      payload: { doc_id: r.lastID, doc_type: docType, kind }
    });

    return res.json({ ok: true, id: r.lastID, doc_type: docType });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'emit error' });
  }
};
