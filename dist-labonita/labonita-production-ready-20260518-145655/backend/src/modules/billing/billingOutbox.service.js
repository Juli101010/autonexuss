const db = require('../../config/db');

function safeJsonParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

function nowIso() {
  return new Date().toISOString();
}

function vatRateFromOption(vatType, vatOther) {
  const t = String(vatType || '').trim().toUpperCase();
  if (t === 'IVA_21') return 21;
  if (t === 'IVA_4') return 4;
  if (t === 'EXENTO_UE_VIES') return 0;
  if (t === 'EXENTO_NO_UE') return 0;
  if (t === 'EXENTO_FORMACION') return 0;
  if (t === 'OTRO') {
    const m = String(vatOther || '').match(/(\d+(?:[\.,]\d+)?)/);
    return m ? Number(String(m[1]).replace(',', '.')) : 21;
  }
  // fallback
  return 21;
}

function baseFromTotal(totalWithVat, vatRate) {
  const total = Number(totalWithVat || 0);
  const r = Number(vatRate || 0);
  if (total <= 0) return 0;
  if (r <= 0) return total;
  return Math.round((total / (1 + r / 100)) * 100) / 100;
}

function buildBillingDraftPayload(petition) {
  const type = String(petition.type || '').toUpperCase();
  const data = safeJsonParse(petition.data);

  if (type === 'ALTA_FACTURA') {
    const vatType = data?.vat?.type;
    const vatOther = data?.vat?.other;
    const vatRate = vatRateFromOption(vatType, vatOther);

    const customer = {
      name: String(data?.invoice?.razon_social || '').trim(),
      tax_id: String(data?.invoice?.tax_id || '').trim() || null,
      vat_id: String(data?.invoice?.vies || '').trim() || null,
      country_code: String(data?.invoice?.country || 'ES').trim().slice(0,2).toUpperCase() || 'ES',
      address: String(data?.invoice?.address || '').trim() || null,
      city: String(data?.invoice?.city || '').trim() || null,
      postal: String(data?.invoice?.postal_code || '').trim() || null,
      email: null,
      vies_valid: (String(vatType || '').toUpperCase() === 'EXENTO_UE_VIES') ? 1 : 0
    };

    const lines = [];
    const concept = String(data?.invoice?.concept || `Servicio ${data?.event?.reference || ''}` ).trim();
    const base = Number(data?.invoice?.amount_without_vat || 0);
    lines.push({ kind: 'SERVICE', description: concept || 'Servicio', qty: 1, unit_price: base, discount: 0, vat_rate: vatRate });

    const gp = Number(data?.expenses?.gastos_puntuales_total || 0);
    if (gp > 0) {
      lines.push({
        kind: 'EXPENSE',
        description: 'Gastos puntuales (total con IVA)',
        qty: 1,
        unit_price: baseFromTotal(gp, vatRate),
        discount: 0,
        vat_rate: vatRate
      });
    }

    const gr = Number(data?.expenses?.gastos_representacion_total || 0);
    if (gr > 0) {
      lines.push({
        kind: 'EXPENSE',
        description: 'Gastos de representación (total con IVA)',
        qty: 1,
        unit_price: baseFromTotal(gr, vatRate),
        discount: 0,
        vat_rate: vatRate
      });
    }

    const notes = [
      `Origen: petición ${petition.id} (ALTA+FACTURA)`,
      data?.event?.company_show ? `Compañía/espectáculo: ${data.event.company_show}` : null,
      data?.event?.reference ? `Referencia: ${data.event.reference}` : null,
      data?.event?.country ? `País: ${data.event.country}` : null,
      data?.event?.city ? `Ciudad: ${data.event.city}` : null,
      data?.event?.dates_text ? `Fechas: ${data.event.dates_text}` : null,
      data?.comments ? `Comentarios: ${data.comments}` : null,
      String(vatType || '') ? `IVA: ${vatType}${vatOther ? ` (${vatOther})` : ''}` : null,
    ].filter(Boolean).join('\n');

    return {
      origin: `petition:${petition.id}`,
      petition_id: petition.id,
      petition_type: type,
      customer,
      invoice: {
        issue_date: null,
        due_date: null,
        currency: 'EUR',
        notes,
        commission_rate: 0,
        expenses_to_artist: 1,
        lines
      },
      splits: [] // reparto se implementa en un paso siguiente (mantener sin romper)
    };
  }

  if (type === 'FORMACION') {
    const customer = {
      name: String(data?.invoice?.razon_social || '').trim(),
      tax_id: String(data?.invoice?.tax_id || '').trim() || null,
      vat_id: String(data?.invoice?.vies || '').trim() || null,
      country_code: String(data?.invoice?.country || 'ES').trim().slice(0,2).toUpperCase() || 'ES',
      address: String(data?.invoice?.address || '').trim() || null,
      city: String(data?.invoice?.city || '').trim() || null,
      postal: String(data?.invoice?.postal_code || '').trim() || null,
      email: null,
      vies_valid: 0
    };

    const total = Number(data?.invoice?.total_amount || 0);
    const concept = String(data?.invoice?.concept || `Formación ${data?.training?.reference || ''}`).trim();

    const notes = [
      `Origen: petición ${petition.id} (FORMACIÓN)`,
      data?.training?.reference ? `Referencia: ${data.training.reference}` : null,
      data?.training?.period_start ? `Periodo inicio: ${data.training.period_start}` : null,
      data?.training?.period_end ? `Periodo fin: ${data.training.period_end}` : null,
      data?.training?.invoice_when ? `Factura: ${data.training.invoice_when}` : null,
      data?.training?.notes ? `Notas: ${data.training.notes}` : null,
    ].filter(Boolean).join('\n');

    return {
      origin: `petition:${petition.id}`,
      petition_id: petition.id,
      petition_type: type,
      customer,
      invoice: {
        issue_date: null,
        due_date: null,
        currency: 'EUR',
        notes,
        commission_rate: 0,
        expenses_to_artist: 1,
        lines: [{ kind: 'SERVICE', description: concept || 'Formación', qty: 1, unit_price: total, discount: 0, vat_rate: 0 }]
      },
      splits: []
    };
  }

  return null;
}

async function callBillingCreateDraft(payload) {
  const base = String(process.env.BILLING_BASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(process.env.BILLING_INTERNAL_KEY || '').trim();
  if (!base || !key) throw new Error('Billing env missing (BILLING_BASE_URL/BILLING_INTERNAL_KEY)');

  const res = await fetch(`${base}/api/integrations/core/create-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Key': key },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let msg = `Billing error (${res.status})`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function enqueueAndTry(petition) {
  const payload = buildBillingDraftPayload(petition);
  if (!payload) return { skipped: true };

  const r = await db.run(
    `INSERT INTO billing_outbox (petition_id, action, payload, status, attempts, created_at, updated_at)
     VALUES (?, 'CREATE_DRAFT', ?, 'PENDING', 0, datetime('now'), datetime('now'))`,
    [petition.id, JSON.stringify(payload)]
  );
  const outboxId = r.lastID;

  try {
    await db.run(
      `UPDATE petitions SET billing_status='PENDING', billing_error=NULL, billing_last_attempt_at=? WHERE id=?`,
      [nowIso(), petition.id]
    );
    const out = await callBillingCreateDraft(payload);
    await db.run(
      `UPDATE billing_outbox SET status='DONE', last_error=NULL, updated_at=datetime('now') WHERE id=?`,
      [outboxId]
    );
    await db.run(
      `UPDATE petitions SET billing_status='DRAFT_CREATED', billing_invoice_id=?, billing_error=NULL, billing_last_attempt_at=? WHERE id=?`,
      [out.invoice_id || null, nowIso(), petition.id]
    );
    return { ok: true, outbox_id: outboxId, invoice_id: out.invoice_id || null };
  } catch (e) {
    const msg = String(e?.message || 'Billing error');
    await db.run(
      `UPDATE billing_outbox
       SET status='FAILED', attempts=attempts+1, last_error=?, updated_at=datetime('now')
       WHERE id=?`,
      [msg, outboxId]
    );
    await db.run(
      `UPDATE petitions SET billing_status='FAILED', billing_error=?, billing_last_attempt_at=? WHERE id=?`,
      [msg, nowIso(), petition.id]
    );
    return { ok: false, outbox_id: outboxId, error: msg };
  }
}

async function listOutbox() {
  return db.all(`SELECT * FROM billing_outbox ORDER BY id DESC`);
}

async function processOne(id) {
  const item = await db.get(`SELECT * FROM billing_outbox WHERE id=?`, [id]);
  if (!item) throw new Error('Outbox item not found');
  const payload = safeJsonParse(item.payload);
  const petitionId = Number(item.petition_id);

  try {
    await db.run(`UPDATE billing_outbox SET status='PENDING', updated_at=datetime('now') WHERE id=?`, [id]);
    const out = await callBillingCreateDraft(payload);
    await db.run(`UPDATE billing_outbox SET status='DONE', last_error=NULL, updated_at=datetime('now') WHERE id=?`, [id]);
    await db.run(
      `UPDATE petitions SET billing_status='DRAFT_CREATED', billing_invoice_id=?, billing_error=NULL, billing_last_attempt_at=? WHERE id=?`,
      [out.invoice_id || null, nowIso(), petitionId]
    );
    return { ok: true, invoice_id: out.invoice_id || null };
  } catch (e) {
    const msg = String(e?.message || 'Billing error');
    await db.run(
      `UPDATE billing_outbox SET status='FAILED', attempts=attempts+1, last_error=?, updated_at=datetime('now') WHERE id=?`,
      [msg, id]
    );
    await db.run(
      `UPDATE petitions SET billing_status='FAILED', billing_error=?, billing_last_attempt_at=? WHERE id=?`,
      [msg, nowIso(), petitionId]
    );
    return { ok: false, error: msg };
  }
}

async function processPending(limit = 20) {
  const items = await db.all(
    `SELECT * FROM billing_outbox WHERE status IN ('PENDING','FAILED') ORDER BY id ASC LIMIT ?`,
    [Number(limit)]
  );
  const results = [];
  for (const it of items) {
    results.push({ id: it.id, ...(await processOne(it.id)) });
  }
  return results;
}

module.exports = {
  buildBillingDraftPayload,
  enqueueAndTry,
  listOutbox,
  processOne,
  processPending
};
