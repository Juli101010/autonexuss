const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const express = require('express');
const { z } = require('zod');

const { getDb } = require('./db');
const { requireAdmin } = require('./auth');
const { taxContextForCustomer, computeInvoiceTotals, computeSettlement } = require('./tax');
const { buildInvoicePdf, buildSettlementPdf } = require('./pdf');
const { isoDateOnly, daysBetween } = require('./utils');

const router = express.Router();

/* ================= Schemas ================= */
const customerSchema = z.object({
  name: z.string().min(1),
  tax_id: z.string().optional().nullable(),
  vat_id: z.string().optional().nullable(),
  country_code: z.string().min(2).max(2).default('ES'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postal: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  vies_valid: z.number().int().optional().nullable()
});

const artistSchema = z.object({
  name: z.string().min(1),
  stage_name: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  country_code: z.string().min(2).max(2).default('ES'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postal: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  is_member: z.number().int().optional().default(0),
  default_irpf_rate: z.number().optional().nullable()
});

const lineSchema = z.object({
  kind: z.enum(['SERVICE','EXPENSE','OTHER']).optional().default('SERVICE'),
  description: z.string().min(1),
  qty: z.number().positive().optional().default(1),
  unit_price: z.number(),
  discount: z.number().nonnegative().optional().default(0),
  vat_rate: z.number().nonnegative().optional().nullable()
});

const draftSchema = z.object({
  customer_id: z.number().int().positive(),
  issue_date: z.string().optional().nullable(),
  service_date_from: z.string().optional().nullable(),
  service_date_to: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  currency: z.string().optional().default('EUR'),
  notes: z.string().optional().nullable(),
  commission_rate: z.number().nonnegative().optional().default(0),
  expenses_to_artist: z.number().int().optional().default(1),
  lines: z.array(lineSchema).min(1)
});

const updateInvoiceSchema = z.object({
  issue_date: z.string().optional().nullable(),
  service_date_from: z.string().optional().nullable(),
  service_date_to: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  commission_rate: z.number().nonnegative().optional().nullable(),
  expenses_to_artist: z.number().int().optional().nullable()
});

const splitsSchema = z.object({
  splits: z.array(z.object({
    artist_id: z.number().int().positive(),
    share_percent: z.number().positive(),
    irpf_rate: z.number().nonnegative().optional().nullable()
  })).min(1)
});

/* ================= Helpers ================= */
function issuerSnapshot() {
  return {
    name: process.env.ISSUER_NAME || 'LaBonita',
    nif: process.env.ISSUER_NIF || '',
    address: process.env.ISSUER_ADDRESS || '',
    city: process.env.ISSUER_CITY || '',
    postal: process.env.ISSUER_POSTAL || '',
    country: process.env.ISSUER_COUNTRY || 'ES',
    email: process.env.ISSUER_EMAIL || ''
  };
}

function stableHash(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

async function addEvent(db, invoiceId, eventType, payload, actorUserId) {
  await db.run(
    `INSERT INTO invoice_events (invoice_id, event_type, payload, actor_user_id) VALUES (?, ?, ?, ?)`,
    [invoiceId, eventType, payload ? JSON.stringify(payload) : null, actorUserId || null]
  );
}

async function loadInvoice(db, id) {
  const invoice = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!invoice) return null;

  const lines = await db.all(`SELECT * FROM invoice_lines WHERE invoice_id=? ORDER BY id ASC`, [id]);
  const splits = await db.all(`
    SELECT s.*, a.name AS artist_name, a.stage_name AS artist_stage_name, a.iban AS artist_iban
    FROM invoice_splits s
    JOIN artists a ON a.id = s.artist_id
    WHERE s.invoice_id=?
    ORDER BY s.id ASC`, [id]);
  const events = await db.all(`SELECT * FROM invoice_events WHERE invoice_id=? ORDER BY id DESC`, [id]);
  const payments = await db.all(`SELECT * FROM payments WHERE invoice_id=? ORDER BY id DESC`, [id]);
  const payouts = await db.all(`
    SELECT p.*, a.name AS artist_name, a.stage_name AS artist_stage_name
    FROM payouts p JOIN artists a ON a.id=p.artist_id
    WHERE p.invoice_id=? ORDER BY p.id DESC`, [id]);

  return { invoice, lines, splits, events, payments, payouts };
}

async function recomputeAndPersist(db, invoiceId, actorUserId) {
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [invoiceId]);
  if (!inv) throw new Error('Invoice not found');

  const lines = await db.all(`SELECT * FROM invoice_lines WHERE invoice_id=? ORDER BY id ASC`, [invoiceId]);

  let customer = inv.customer_id ? await db.get(`SELECT * FROM customers WHERE id=?`, [inv.customer_id]) : null;
  if (!customer) customer = JSON.parse(inv.customer_snapshot);

  const taxCtx = taxContextForCustomer(customer, Number(process.env.DEFAULT_VAT_RATE || 21));
  const totals = computeInvoiceTotals(lines, taxCtx);
  totals.default_vat_rate = taxCtx.default_vat_rate;

  const rawSplits = await db.all(`SELECT * FROM invoice_splits WHERE invoice_id=? ORDER BY id ASC`, [invoiceId]);
  const settlement = computeSettlement({
    lines,
    commission_rate: inv.commission_rate,
    expenses_to_artist: inv.expenses_to_artist,
    splits: rawSplits.map(s => ({ artist_id: s.artist_id, share_percent: s.share_percent, irpf_rate: s.irpf_rate }))
  });

  const totalsSnapshot = {
    ...totals,
    settlement: {
      service_base: settlement.service_base,
      expenses_base: settlement.expenses_base,
      commission_rate: settlement.commission_rate,
      commission_amount: settlement.commission_amount,
      payout_pool: settlement.payout_pool,
      artist_gross_total: settlement.artist_gross_total,
      artist_withholding_total: settlement.artist_withholding_total,
      artist_net_total: settlement.artist_net_total
    }
  };

  await db.run(
    `UPDATE invoices
     SET customer_snapshot=?, tax_context_snapshot=?, totals_snapshot=?, updated_at=datetime('now')
     WHERE id=?`,
    [JSON.stringify(customer), JSON.stringify(taxCtx), JSON.stringify(totalsSnapshot), invoiceId]
  );

  for (const s of settlement.splits) {
    await db.run(
      `UPDATE invoice_splits
       SET gross_amount=?, withholding_amount=?, net_amount=?, updated_at=datetime('now')
       WHERE invoice_id=? AND artist_id=?`,
      [s.gross_amount, s.withholding_amount, s.net_amount, invoiceId, s.artist_id]
    );
  }

  await addEvent(db, invoiceId, 'RECOMPUTED', { totalsSnapshot }, actorUserId);
}

/* ================= AUTH ================= */
router.post('/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  const db = getDb();
  const user = await db.get(`SELECT id,email,password_hash,role FROM users WHERE email=?`, [email]);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
  return res.json({ token });
});

router.get('/health', (_req, res) => res.json({ ok: true }));

/* ================= SERIES ================= */
router.get('/series', requireAdmin, async (_req, res) => {
  const db = getDb();
  const rows = await db.all(`SELECT * FROM invoice_series ORDER BY year DESC, code ASC`);
  return res.json(rows);
});

router.post('/series', requireAdmin, async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const year = Number(req.body?.year || new Date().getFullYear());
  const next_number = Number(req.body?.next_number || 1);
  if (!code) return res.status(400).json({ error: 'code requerido' });

  const db = getDb();
  await db.run(
    `INSERT INTO invoice_series (code, year, next_number, active) VALUES (?,?,?,1)
     ON CONFLICT(code,year) DO UPDATE SET next_number=excluded.next_number`,
    [code, year, next_number]
  );
  const row = await db.get(`SELECT * FROM invoice_series WHERE code=? AND year=?`, [code, year]);
  return res.json(row);
});

router.put('/series/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const next_number = req.body?.next_number !== undefined ? Number(req.body.next_number) : null;
  const active = req.body?.active !== undefined ? Number(req.body.active) : null;

  const db = getDb();
  const exists = await db.get(`SELECT * FROM invoice_series WHERE id=?`, [id]);
  if (!exists) return res.status(404).json({ error: 'No encontrado' });

  await db.run(
    `UPDATE invoice_series
     SET next_number=COALESCE(?, next_number),
         active=COALESCE(?, active)
     WHERE id=?`,
    [Number.isFinite(next_number) ? next_number : null, (active === 0 || active === 1) ? active : null, id]
  );

  return res.json(await db.get(`SELECT * FROM invoice_series WHERE id=?`, [id]));
});

/* ================= CUSTOMERS ================= */
router.get('/customers', requireAdmin, async (_req, res) => {
  const db = getDb();
  return res.json(await db.all(`SELECT * FROM customers ORDER BY id DESC`));
});

router.post('/customers', requireAdmin, async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const c = parsed.data;

  const db = getDb();
  const r = await db.run(
    `INSERT INTO customers (name,tax_id,vat_id,country_code,address,city,postal,email,vies_valid,vies_checked_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))`,
    [
      c.name,
      c.tax_id || null,
      c.vat_id || null,
      String(c.country_code || 'ES').toUpperCase(),
      c.address || null,
      c.city || null,
      c.postal || null,
      c.email || null,
      Number(c.vies_valid || 0) ? 1 : 0,
      Number(c.vies_valid || 0) ? new Date().toISOString() : null
    ]
  );
  return res.json(await getDb().get(`SELECT * FROM customers WHERE id=?`, [r.lastID]));
});

router.put('/customers/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const c = parsed.data;

  const db = getDb();
  const exists = await db.get(`SELECT id FROM customers WHERE id=?`, [id]);
  if (!exists) return res.status(404).json({ error: 'No encontrado' });

  await db.run(
    `UPDATE customers
     SET name=?,tax_id=?,vat_id=?,country_code=?,address=?,city=?,postal=?,email=?,vies_valid=?,vies_checked_at=?,updated_at=datetime('now')
     WHERE id=?`,
    [
      c.name,
      c.tax_id || null,
      c.vat_id || null,
      String(c.country_code || 'ES').toUpperCase(),
      c.address || null,
      c.city || null,
      c.postal || null,
      c.email || null,
      Number(c.vies_valid || 0) ? 1 : 0,
      Number(c.vies_valid || 0) ? new Date().toISOString() : null,
      id
    ]
  );

  return res.json(await db.get(`SELECT * FROM customers WHERE id=?`, [id]));
});

/* ================= ARTISTS ================= */
router.get('/artists', requireAdmin, async (_req, res) => {
  const db = getDb();
  const rows = await db.all(`SELECT * FROM artists ORDER BY id DESC`);
  return res.json(rows);
});

router.post('/artists', requireAdmin, async (req, res) => {
  const parsed = artistSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const a = parsed.data;

  const memberDefault = Number(process.env.IRPF_DEFAULT_MEMBER || 15);
  const nonMemberDefault = Number(process.env.IRPF_DEFAULT_NON_MEMBER || 2);
  const defaultIrpf = a.default_irpf_rate ?? (Number(a.is_member || 0) ? memberDefault : nonMemberDefault);

  const db = getDb();
  const r = await db.run(
    `INSERT INTO artists
     (name,stage_name,tax_id,email,phone,country_code,address,city,postal,iban,is_member,default_irpf_rate,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`,
    [
      a.name,
      a.stage_name || null,
      a.tax_id || null,
      a.email || null,
      a.phone || null,
      String(a.country_code || 'ES').toUpperCase(),
      a.address || null,
      a.city || null,
      a.postal || null,
      a.iban || null,
      Number(a.is_member || 0) ? 1 : 0,
      Number(defaultIrpf)
    ]
  );
  return res.json(await db.get(`SELECT * FROM artists WHERE id=?`, [r.lastID]));
});

router.put('/artists/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = artistSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const a = parsed.data;

  const db = getDb();
  const exists = await db.get(`SELECT * FROM artists WHERE id=?`, [id]);
  if (!exists) return res.status(404).json({ error: 'No encontrado' });

  const memberDefault = Number(process.env.IRPF_DEFAULT_MEMBER || 15);
  const nonMemberDefault = Number(process.env.IRPF_DEFAULT_NON_MEMBER || 2);
  const defaultIrpf = a.default_irpf_rate ?? (Number(a.is_member || 0) ? memberDefault : nonMemberDefault);

  await db.run(
    `UPDATE artists
     SET name=?,stage_name=?,tax_id=?,email=?,phone=?,country_code=?,address=?,city=?,postal=?,iban=?,is_member=?,default_irpf_rate=?,updated_at=datetime('now')
     WHERE id=?`,
    [
      a.name,
      a.stage_name || null,
      a.tax_id || null,
      a.email || null,
      a.phone || null,
      String(a.country_code || 'ES').toUpperCase(),
      a.address || null,
      a.city || null,
      a.postal || null,
      a.iban || null,
      Number(a.is_member || 0) ? 1 : 0,
      Number(defaultIrpf),
      id
    ]
  );

  return res.json(await db.get(`SELECT * FROM artists WHERE id=?`, [id]));
});

/* ================= INVOICES ================= */
router.get('/invoices', requireAdmin, async (_req, res) => {
  const db = getDb();
  return res.json(await db.all(`
    SELECT i.id,i.type,i.status,i.legal_number,i.issue_date,i.due_date,i.currency,i.created_at,
           i.reminder_count, i.last_reminder_at,
           c.name AS customer_name
    FROM invoices i
    LEFT JOIN customers c ON c.id=i.customer_id
    ORDER BY i.id DESC
  `));
});

router.post('/invoices/draft', requireAdmin, async (req, res) => {
  const parsed = draftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const d = parsed.data;

  const db = getDb();
  const customer = await db.get(`SELECT * FROM customers WHERE id=?`, [d.customer_id]);
  if (!customer) return res.status(400).json({ error: 'customer_id inválido' });

  const taxCtx = taxContextForCustomer(customer, Number(process.env.DEFAULT_VAT_RATE || 21));
  const totals = computeInvoiceTotals(d.lines, taxCtx);
  totals.default_vat_rate = taxCtx.default_vat_rate;

  const issuer = issuerSnapshot();
  const seriesCode = String(process.env.DEFAULT_SERIES || 'A').trim() || 'A';
  const year = new Date().getFullYear();

  const totalsSnapshot = { ...totals, settlement: { service_base: 0, expenses_base: 0, commission_rate: d.commission_rate, commission_amount: 0, payout_pool: 0, artist_gross_total: 0, artist_withholding_total: 0, artist_net_total: 0 } };

  const r = await db.run(
    `INSERT INTO invoices
      (series_code,year,status,issue_date,service_date_from,service_date_to,due_date,currency,notes,customer_id,
       customer_snapshot,issuer_snapshot,tax_context_snapshot,totals_snapshot,commission_rate,expenses_to_artist,
       created_at,updated_at)
     VALUES
      (?,?, 'DRAFT', ?,?,?,?,?, ?,?, ?, ?,?,?,?, ?,?, datetime('now'), datetime('now'))`,
    [
      seriesCode, year,
      d.issue_date || null,
      d.service_date_from || null,
      d.service_date_to || null,
      d.due_date || null,
      d.currency || 'EUR',
      d.notes || null,
      d.customer_id,
      JSON.stringify(customer),
      JSON.stringify(issuer),
      JSON.stringify(taxCtx),
      JSON.stringify(totalsSnapshot),
      Number(d.commission_rate || 0),
      Number(d.expenses_to_artist || 0) ? 1 : 0
    ]
  );

  const invoiceId = r.lastID;
  for (const l of d.lines) {
    await db.run(
      `INSERT INTO invoice_lines (invoice_id,kind,description,qty,unit_price,discount,vat_rate)
       VALUES (?,?,?,?,?,?,?)`,
      [
        invoiceId,
        String(l.kind || 'SERVICE').toUpperCase(),
        l.description,
        Number(l.qty ?? 1),
        Number(l.unit_price ?? 0),
        Number(l.discount ?? 0),
        (l.vat_rate === undefined ? null : l.vat_rate)
      ]
    );
  }

  await addEvent(db, invoiceId, 'DRAFT_CREATED', { totals }, req.user.id);
  await recomputeAndPersist(db, invoiceId, req.user.id);

  return res.json(await loadInvoice(db, invoiceId));
});

router.get('/invoices/:id', requireAdmin, async (req, res) => {
  const db = getDb();
  const out = await loadInvoice(db, Number(req.params.id));
  if (!out) return res.status(404).json({ error: 'No encontrado' });
  return res.json(out);
});

router.put('/invoices/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const db = getDb();
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });
  if (!['DRAFT','PENDING_REVIEW'].includes(inv.status)) return res.status(400).json({ error: 'Solo editable en DRAFT/PENDING_REVIEW' });

  const u = parsed.data;

  await db.run(
    `UPDATE invoices
     SET issue_date=COALESCE(?, issue_date),
         service_date_from=COALESCE(?, service_date_from),
         service_date_to=COALESCE(?, service_date_to),
         due_date=COALESCE(?, due_date),
         currency=COALESCE(?, currency),
         notes=COALESCE(?, notes),
         commission_rate=COALESCE(?, commission_rate),
         expenses_to_artist=COALESCE(?, expenses_to_artist),
         updated_at=datetime('now')
     WHERE id=?`,
    [
      u.issue_date ?? null,
      u.service_date_from ?? null,
      u.service_date_to ?? null,
      u.due_date ?? null,
      u.currency ?? null,
      u.notes ?? null,
      (u.commission_rate === undefined || u.commission_rate === null) ? null : Number(u.commission_rate),
      (u.expenses_to_artist === undefined || u.expenses_to_artist === null) ? null : (Number(u.expenses_to_artist) ? 1 : 0),
      id
    ]
  );

  await recomputeAndPersist(db, id, req.user.id);
  return res.json(await loadInvoice(db, id));
});

router.put('/invoices/:id/lines', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = z.object({ lines: z.array(lineSchema).min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const db = getDb();
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });
  if (!['DRAFT','PENDING_REVIEW'].includes(inv.status)) return res.status(400).json({ error: 'Solo editable en DRAFT/PENDING_REVIEW' });

  await db.run(`DELETE FROM invoice_lines WHERE invoice_id=?`, [id]);
  for (const l of parsed.data.lines) {
    await db.run(
      `INSERT INTO invoice_lines (invoice_id,kind,description,qty,unit_price,discount,vat_rate)
       VALUES (?,?,?,?,?,?,?)`,
      [
        id,
        String(l.kind || 'SERVICE').toUpperCase(),
        l.description,
        Number(l.qty ?? 1),
        Number(l.unit_price ?? 0),
        Number(l.discount ?? 0),
        (l.vat_rate === undefined ? null : l.vat_rate)
      ]
    );
  }

  await recomputeAndPersist(db, id, req.user.id);
  return res.json(await loadInvoice(db, id));
});

router.put('/invoices/:id/splits', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = splitsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const db = getDb();
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });
  if (!['DRAFT','PENDING_REVIEW'].includes(inv.status)) return res.status(400).json({ error: 'Solo editable en DRAFT/PENDING_REVIEW' });

  const sum = parsed.data.splits.reduce((acc, s) => acc + Number(s.share_percent || 0), 0);
  if (Math.abs(sum - 100) > 0.01) return res.status(400).json({ error: 'El reparto debe sumar 100%' });

  await db.run(`DELETE FROM invoice_splits WHERE invoice_id=?`, [id]);

  for (const s of parsed.data.splits) {
    const a = await db.get(`SELECT * FROM artists WHERE id=?`, [s.artist_id]);
    if (!a) return res.status(400).json({ error: `artist_id inválido: ${s.artist_id}` });

    const memberDefault = Number(process.env.IRPF_DEFAULT_MEMBER || 15);
    const nonMemberDefault = Number(process.env.IRPF_DEFAULT_NON_MEMBER || 2);
    const irpf = (s.irpf_rate === null || s.irpf_rate === undefined)
      ? Number(a.default_irpf_rate ?? (a.is_member ? memberDefault : nonMemberDefault))
      : Number(s.irpf_rate);

    await db.run(
      `INSERT INTO invoice_splits (invoice_id,artist_id,share_percent,irpf_rate,gross_amount,withholding_amount,net_amount,updated_at)
       VALUES (?,?,?,?,0,0,0,datetime('now'))`,
      [id, s.artist_id, Number(s.share_percent), irpf]
    );
  }

  await recomputeAndPersist(db, id, req.user.id);
  return res.json(await loadInvoice(db, id));
});

router.post('/invoices/:id/issue', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const bundle = await loadInvoice(db, id);
  if (!bundle) return res.status(404).json({ error: 'No encontrado' });
  if (!['DRAFT', 'PENDING_REVIEW'].includes(bundle.invoice.status)) return res.status(400).json({ error: 'Solo desde DRAFT/PENDING_REVIEW' });

  if (!bundle.splits || bundle.splits.length === 0) return res.status(400).json({ error: 'Definí reparto de artistas antes de emitir' });

  await recomputeAndPersist(db, id, req.user.id);

  await db.exec('BEGIN IMMEDIATE;');
  try {
    const seriesCode = bundle.invoice.series_code;
    const year = bundle.invoice.year;

    const series = await db.get(`SELECT * FROM invoice_series WHERE code=? AND year=?`, [seriesCode, year]);
    if (!series) {
      await db.run(`INSERT INTO invoice_series (code, year, next_number, active) VALUES (?,?,1,1)`, [seriesCode, year]);
    }

    const s2 = await db.get(`SELECT * FROM invoice_series WHERE code=? AND year=?`, [seriesCode, year]);
    if (Number(s2.active || 0) !== 1) throw new Error('Serie inactiva');

    const next = Number(s2.next_number);
    const legalNumber = `${seriesCode}-${year}-${String(next).padStart(6, '0')}`;

    const invNow = await loadInvoice(db, id);
    const hash = stableHash({ legal_number: legalNumber, invoice: invNow.invoice, lines: invNow.lines, splits: invNow.splits });

    await db.run(
      `UPDATE invoices
       SET number=?, legal_number=?, status='ISSUED', locked_at=datetime('now'), locked_by_user_id=?, hash=?, updated_at=datetime('now')
       WHERE id=?`,
      [next, legalNumber, req.user.id, hash, id]
    );

    await db.run(`UPDATE invoice_series SET next_number=next_number+1 WHERE id=?`, [s2.id]);

    await addEvent(db, id, 'ISSUED', { legalNumber, hash }, req.user.id);

    await db.run(
      `INSERT INTO sync_outbox (entity_type,entity_id,operation,payload,status,tries,created_at,updated_at)
       VALUES ('INVOICE', ?, 'UPSERT', ?, 'PENDING', 0, datetime('now'), datetime('now'))`,
      [id, JSON.stringify({ invoice_id: id, legal_number: legalNumber, hash })]
    );

    await db.exec('COMMIT;');
  } catch (e) {
    await db.exec('ROLLBACK;');
    return res.status(500).json({ error: String(e?.message || e) });
  }

  return res.json(await loadInvoice(db, id));
});

router.get('/invoices/:id/pdf', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const bundle = await loadInvoice(db, id);
  if (!bundle) return res.status(404).json({ error: 'No encontrado' });

  const invoice = bundle.invoice;
  const lines = bundle.lines;
  const issuer = JSON.parse(invoice.issuer_snapshot);
  const customer = JSON.parse(invoice.customer_snapshot);
  const taxCtx = JSON.parse(invoice.tax_context_snapshot);
  const totals = JSON.parse(invoice.totals_snapshot);
  totals.default_vat_rate = taxCtx.default_vat_rate;

  res.setHeader('Content-Type', 'application/pdf');
  const filename = invoice.legal_number ? `${invoice.legal_number}.pdf` : `invoice-${invoice.id}.pdf`;
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const doc = buildInvoicePdf({ invoice, lines, issuer, customer, taxCtx, totals });
  doc.pipe(res);
});

router.get('/invoices/:id/settlement-pdf', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const bundle = await loadInvoice(db, id);
  if (!bundle) return res.status(404).json({ error: 'No encontrado' });

  const invoice = bundle.invoice;
  const issuer = JSON.parse(invoice.issuer_snapshot);
  const totals = JSON.parse(invoice.totals_snapshot);
  const settlementTotals = totals.settlement || {};
  const settlement = {
    ...settlementTotals,
    expenses_to_artist: Number(invoice.expenses_to_artist || 0) ? 1 : 0,
    splits: bundle.splits.map(s => ({
      artist_id: s.artist_id,
      share_percent: s.share_percent,
      irpf_rate: s.irpf_rate,
      gross_amount: s.gross_amount,
      withholding_amount: s.withholding_amount,
      net_amount: s.net_amount
    }))
  };

  const artists = new Map();
  for (const s of bundle.splits) {
    artists.set(String(s.artist_id), { name: s.artist_name, stage_name: s.artist_stage_name });
  }

  res.setHeader('Content-Type', 'application/pdf');
  const filename = invoice.legal_number ? `${invoice.legal_number}-LIQUIDACION.pdf` : `invoice-${invoice.id}-LIQUIDACION.pdf`;
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const doc = buildSettlementPdf({ invoice, issuer, settlement, artists });
  doc.pipe(res);
});

router.post('/invoices/:id/send', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });
  if (inv.status !== 'ISSUED') return res.status(400).json({ error: 'Solo desde ISSUED' });

  await db.run(`UPDATE invoices SET status='SENT', updated_at=datetime('now') WHERE id=?`, [id]);
  await addEvent(db, id, 'SENT', {}, req.user.id);
  return res.json(await loadInvoice(db, id));
});

router.post('/invoices/:id/payments', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });

  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'amount inválido' });

  const method = String(req.body?.method || 'TRANSFER');
  const reference = String(req.body?.reference || '').trim() || null;

  await db.run(`INSERT INTO payments (invoice_id,method,amount,reference) VALUES (?,?,?,?)`, [id, method, amount, reference]);
  await addEvent(db, id, 'PAYMENT_ADDED', { amount, method, reference }, req.user.id);

  const totals = JSON.parse(inv.totals_snapshot);
  const paid = await db.get(`SELECT COALESCE(SUM(amount),0) AS sum FROM payments WHERE invoice_id=?`, [id]);

  if (Number(paid.sum || 0) >= Number(totals.total || 0) && inv.status !== 'PAID') {
    await db.run(`UPDATE invoices SET status='PAID', updated_at=datetime('now') WHERE id=?`, [id]);
    await addEvent(db, id, 'PAID', { paid: paid.sum }, req.user.id);
  }

  return res.json(await loadInvoice(db, id));
});

router.post('/invoices/:id/payouts', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const artist_id = Number(req.body?.artist_id);
  const amount = req.body?.amount !== undefined ? Number(req.body.amount) : null;

  if (!artist_id) return res.status(400).json({ error: 'artist_id requerido' });

  const db = getDb();
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });

  const split = await db.get(`SELECT * FROM invoice_splits WHERE invoice_id=? AND artist_id=?`, [id, artist_id]);
  if (!split) return res.status(400).json({ error: 'Split no encontrado para ese artista' });

  const payAmount = Number.isFinite(amount) ? amount : Number(split.net_amount || 0);
  if (!Number.isFinite(payAmount) || payAmount <= 0) return res.status(400).json({ error: 'amount inválido' });

  const method = String(req.body?.method || 'TRANSFER');
  const reference = String(req.body?.reference || '').trim() || null;

  await db.run(`INSERT INTO payouts (invoice_id,artist_id,amount,method,reference) VALUES (?,?,?,?,?)`, [id, artist_id, payAmount, method, reference]);
  await addEvent(db, id, 'PAYOUT_ADDED', { artist_id, amount: payAmount, method, reference }, req.user.id);

  return res.json(await loadInvoice(db, id));
});

router.post('/invoices/:id/credit-note', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const bundle = await loadInvoice(db, id);
  if (!bundle) return res.status(404).json({ error: 'No encontrado' });
  if (!['ISSUED', 'SENT', 'PAID'].includes(bundle.invoice.status)) return res.status(400).json({ error: 'Solo rectifica emitidas' });

  const reason = String(req.body?.reason || '').trim() || 'Rectificativa';

  const issuer = JSON.parse(bundle.invoice.issuer_snapshot);
  const customer = JSON.parse(bundle.invoice.customer_snapshot);
  const taxCtx = JSON.parse(bundle.invoice.tax_context_snapshot);

  const negLines = bundle.lines.map((l) => ({
    kind: String(l.kind || 'SERVICE').toUpperCase(),
    description: `RECTIF: ${l.description}`,
    qty: Number(l.qty ?? 1),
    unit_price: -Number(l.unit_price ?? 0),
    discount: 0,
    vat_rate: l.vat_rate
  }));

  const totals = computeInvoiceTotals(negLines, taxCtx);
  totals.default_vat_rate = taxCtx.default_vat_rate;

  const seriesCode = String(process.env.DEFAULT_SERIES || 'A').trim() || 'A';
  const year = new Date().getFullYear();

  const r = await db.run(
    `INSERT INTO invoices
      (type, related_invoice_id, series_code, year, status, issue_date, currency, notes,
       customer_id, customer_snapshot, issuer_snapshot, tax_context_snapshot, totals_snapshot,
       commission_rate, expenses_to_artist,
       created_at, updated_at)
     VALUES
      ('CREDIT_NOTE', ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))`,
    [
      id,
      seriesCode,
      year,
      isoDateOnly(new Date()),
      bundle.invoice.currency,
      reason,
      bundle.invoice.customer_id,
      JSON.stringify(customer),
      JSON.stringify(issuer),
      JSON.stringify(taxCtx),
      JSON.stringify({ ...totals, settlement: { service_base: 0, expenses_base: 0, commission_rate: 0, commission_amount: 0, payout_pool: 0, artist_gross_total: 0, artist_withholding_total: 0, artist_net_total: 0 } })
    ]
  );

  const creditId = r.lastID;

  for (const l of negLines) {
    await db.run(
      `INSERT INTO invoice_lines (invoice_id,kind,description,qty,unit_price,discount,vat_rate)
       VALUES (?,?,?,?,?,?,?)`,
      [creditId, l.kind, l.description, l.qty, l.unit_price, l.discount, l.vat_rate ?? null]
    );
  }

  await addEvent(db, creditId, 'CREDIT_NOTE_CREATED', { related_invoice_id: id }, req.user.id);
  await recomputeAndPersist(db, creditId, req.user.id);

  return res.json(await loadInvoice(db, creditId));
});

/* ================= REMINDERS (email outbox) ================= */
router.get('/reminders/overdue', requireAdmin, async (_req, res) => {
  const db = getDb();
  const today = isoDateOnly(new Date());

  const rows = await db.all(`
    SELECT i.id,i.status,i.legal_number,i.issue_date,i.due_date,i.currency,i.reminder_count,i.last_reminder_at,
           c.name AS customer_name, c.email AS customer_email
    FROM invoices i
    JOIN customers c ON c.id=i.customer_id
    WHERE i.type='INVOICE'
      AND i.status IN ('ISSUED','SENT')
      AND i.due_date IS NOT NULL
      AND i.due_date < ?
    ORDER BY i.due_date ASC
  `, [today]);

  return res.json({ today, rows });
});

router.post('/invoices/:id/remind', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const inv = await db.get(`SELECT * FROM invoices WHERE id=?`, [id]);
  if (!inv) return res.status(404).json({ error: 'No encontrado' });

  const customer = inv.customer_id ? await db.get(`SELECT * FROM customers WHERE id=?`, [inv.customer_id]) : null;
  if (!customer || !customer.email) return res.status(400).json({ error: 'Cliente sin email' });

  const today = isoDateOnly(new Date());
  const due = inv.due_date;
  const daysLate = due ? daysBetween(due, today) : 0;

  const subject = `Recordatorio de pago - ${inv.legal_number || `Factura #${inv.id}`}`;
  const body = [
    `Hola ${customer.name},`,
    '',
    `Te recordamos el pago de la factura ${inv.legal_number || `#${inv.id}`}.`,
    `Vencimiento: ${due || '-'}.`,
    `Días de atraso: ${daysLate}.`,
    '',
    'Gracias.',
    String(process.env.ISSUER_NAME || 'LaBonita')
  ].join('\\n');

  await db.run(
    `INSERT INTO email_outbox (to_email, subject, body, related_invoice_id) VALUES (?,?,?,?)`,
    [customer.email, subject, body, id]
  );

  await db.run(
    `UPDATE invoices SET reminder_count=reminder_count+1, last_reminder_at=datetime('now'), updated_at=datetime('now') WHERE id=?`,
    [id]
  );

  await addEvent(db, id, 'REMINDER_QUEUED', { to: customer.email, daysLate }, req.user.id);
  return res.json({ ok: true });
});

/* ================= EMAIL OUTBOX ================= */
router.get('/emails', requireAdmin, async (_req, res) => {
  const db = getDb();
  const rows = await db.all(`SELECT * FROM email_outbox ORDER BY id DESC LIMIT 500`);
  return res.json(rows);
});

router.post('/emails/:id/mark-sent', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const exists = await db.get(`SELECT * FROM email_outbox WHERE id=?`, [id]);
  if (!exists) return res.status(404).json({ error: 'No encontrado' });

  await db.run(`UPDATE email_outbox SET status='SENT', sent_at=datetime('now') WHERE id=?`, [id]);
  return res.json({ ok: true });
});

/* ================= DELSOL PREP (no integration) ================= */
router.get('/sync/outbox', requireAdmin, async (_req, res) => {
  const db = getDb();
  return res.json(await db.all(`SELECT * FROM sync_outbox ORDER BY id DESC LIMIT 500`));
});

router.post('/sync/run', requireAdmin, async (_req, res) => {
  return res.status(501).json({ error: 'DelSol sync no implementado. Outbox preparado.' });
});


/* ================= INTEGRATIONS (CORE) ================= */
const integrationCreateDraftSchema = z.object({
  origin: z.string().min(1),
  petition_id: z.number().int().positive().optional(),
  petition_type: z.string().optional(),
  customer: customerSchema,
  invoice: z.object({
    issue_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    currency: z.string().optional().default('EUR'),
    notes: z.string().optional().nullable(),
    commission_rate: z.number().optional().default(0),
    expenses_to_artist: z.number().int().optional().default(1),
    lines: z.array(lineSchema).min(1)
  })
});

async function upsertCustomerByTaxOrName(db, c) {
  const tax = String(c.tax_id || '').trim();
  const name = String(c.name || '').trim();

  let existing = null;
  if (tax) existing = await db.get(`SELECT * FROM customers WHERE tax_id=?`, [tax]);
  if (!existing && name) existing = await db.get(`SELECT * FROM customers WHERE name=?`, [name]);

  if (!existing) {
    const r = await db.run(
      `INSERT INTO customers (name,tax_id,vat_id,country_code,address,city,postal,email,vies_valid,vies_checked_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?, datetime('now'), datetime('now'))`,
      [
        name,
        tax || null,
        c.vat_id || null,
        String(c.country_code || 'ES').toUpperCase(),
        c.address || null,
        c.city || null,
        c.postal || null,
        c.email || null,
        Number(c.vies_valid || 0) ? 1 : 0,
        Number(c.vies_valid || 0) ? isoDateOnly(new Date()) : null
      ]
    );
    return await db.get(`SELECT * FROM customers WHERE id=?`, [r.lastID]);
  }

  await db.run(
    `UPDATE customers
     SET name=COALESCE(?, name),
         tax_id=COALESCE(?, tax_id),
         vat_id=COALESCE(?, vat_id),
         country_code=COALESCE(?, country_code),
         address=COALESCE(?, address),
         city=COALESCE(?, city),
         postal=COALESCE(?, postal),
         email=COALESCE(?, email),
         vies_valid=COALESCE(?, vies_valid),
         vies_checked_at=CASE WHEN ?=1 THEN COALESCE(vies_checked_at, ?) ELSE vies_checked_at END,
         updated_at=datetime('now')
     WHERE id=?`,
    [
      name || null,
      tax || null,
      c.vat_id || null,
      (c.country_code ? String(c.country_code).toUpperCase() : null),
      c.address || null,
      c.city || null,
      c.postal || null,
      c.email || null,
      (c.vies_valid === undefined || c.vies_valid === null) ? null : (Number(c.vies_valid) ? 1 : 0),
      (c.vies_valid === undefined || c.vies_valid === null) ? 0 : (Number(c.vies_valid) ? 1 : 0),
      isoDateOnly(new Date()),
      existing.id
    ]
  );

  return await db.get(`SELECT * FROM customers WHERE id=?`, [existing.id]);
}

router.post('/integrations/core/create-draft', requireAdmin, async (req, res) => {
  const parsed = integrationCreateDraftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const p = parsed.data;

  const db = getDb();

  const existing = await db.get(`SELECT id FROM invoices WHERE origin=?`, [p.origin]);
  if (existing) return res.json({ ok: true, invoice_id: existing.id, existed: true });

  const customer = await upsertCustomerByTaxOrName(db, p.customer);

  const taxCtx = taxContextForCustomer(customer, Number(process.env.DEFAULT_VAT_RATE || 21));
  const totals = computeInvoiceTotals(p.invoice.lines, taxCtx);
  totals.default_vat_rate = taxCtx.default_vat_rate;

  const issuer = issuerSnapshot();
  const seriesCode = String(process.env.DEFAULT_SERIES || 'A').trim() || 'A';
  const year = new Date().getFullYear();

  const totalsSnapshot = { ...totals, settlement: { service_base: 0, expenses_base: 0, commission_rate: Number(p.invoice.commission_rate || 0), commission_amount: 0, payout_pool: 0, artist_gross_total: 0, artist_withholding_total: 0, artist_net_total: 0 } };

  const r = await db.run(
    `INSERT INTO invoices
      (origin,series_code,year,status,issue_date,due_date,currency,notes,customer_id,
       customer_snapshot,issuer_snapshot,tax_context_snapshot,totals_snapshot,commission_rate,expenses_to_artist,
       created_at,updated_at)
     VALUES
      (?,?,?, 'DRAFT', ?,?,?, ?,?, ?, ?,?,?, ?,?, datetime('now'), datetime('now'))`,
    [
      p.origin,
      seriesCode, year,
      p.invoice.issue_date || null,
      p.invoice.due_date || null,
      p.invoice.currency || 'EUR',
      p.invoice.notes || null,
      customer.id,
      JSON.stringify(customer),
      JSON.stringify(issuer),
      JSON.stringify(taxCtx),
      JSON.stringify(totalsSnapshot),
      Number(p.invoice.commission_rate || 0),
      Number(p.invoice.expenses_to_artist || 0) ? 1 : 0
    ]
  );

  const invoiceId = r.lastID;

  for (const l of p.invoice.lines) {
    await db.run(
      `INSERT INTO invoice_lines (invoice_id,kind,description,qty,unit_price,discount,vat_rate)
       VALUES (?,?,?,?,?,?,?)`,
      [
        invoiceId,
        String(l.kind || 'SERVICE').toUpperCase(),
        l.description,
        Number(l.qty ?? 1),
        Number(l.unit_price ?? 0),
        Number(l.discount ?? 0),
        (l.vat_rate === undefined ? null : l.vat_rate)
      ]
    );
  }

  await addEvent(db, invoiceId, 'DRAFT_CREATED', { totals, origin: p.origin }, req.user.id);
  await recomputeAndPersist(db, invoiceId, req.user.id);

  return res.json({ ok: true, invoice_id: invoiceId });
});


module.exports = router;
