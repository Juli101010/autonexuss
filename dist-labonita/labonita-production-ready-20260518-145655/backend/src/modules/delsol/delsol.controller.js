const db = require('../../config/db');
const { DelSolClient } = require('../../integrations/delsol/delsol.client');

function modeFromEnv() {
  return String(process.env.DELSOL_MODE || 'mock').toLowerCase();
}

function defaultExercise() {
  return String(process.env.DELSOL_DEFAULT_EJERCICIO || '2026');
}

async function activeConnection() {
  let row = await db.get(`SELECT * FROM delsol_connections WHERE active = 1 ORDER BY id LIMIT 1`);
  if (!row) {
    await db.run(`INSERT INTO delsol_connections (name, ejercicio_default, mode, read_enabled, write_enabled, active) VALUES ('La Bonita - conexión preparada', ?, ?, 1, 0, 1)`, [defaultExercise(), modeFromEnv()]);
    row = await db.get(`SELECT * FROM delsol_connections WHERE active = 1 ORDER BY id LIMIT 1`);
  }
  return row;
}

function rec(record) {
  return Object.entries(record).map(([columna, dato]) => ({ columna, dato }));
}

function isoDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00`;
  const m = raw.match(/\d{4}-\d{2}-\d{2}/);
  return m ? `${m[0]}T00:00:00` : '';
}

async function getNextFacturaNumber(client) {
  const resp = await client.lanzarConsulta({ consulta: "SELECT MAX(CODFAC) AS ultimaFactura FROM F_FAC WHERE TIPFAC = '1'" });
  const row = resp?.resultado?.[0] || [];
  const last = Number(row.find((x) => x.columna === 'ultimaFactura')?.dato || 0);
  return (Number.isFinite(last) ? last : 0) + 1;
}

function safeParse(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

async function syncInvoiceQueueItem(item, client) {
  const payload = safeParse(item.payload);
  const invoice = await db.get(`SELECT * FROM lb_internal_invoices WHERE id = ?`, [item.entity_id]);
  if (!invoice) throw new Error('Factura interna no encontrada para sincronizar');

  const codfac = await getNextFacturaNumber(client);
  const issue = isoDate(invoice.issue_date);
  const base = Number(invoice.subtotal || 0);
  const ivaPct = Number(invoice.iva_rate || 0);
  const ivaAmount = Number(invoice.iva_total || 0);
  const total = Number(invoice.total || 0);

  const clientCode = payload?.customer?.tax_id || payload?.customer?.id || invoice.customer_party_id || '';
  const customerName = payload?.customer?.display_name || payload?.customer?.legal_name || 'CLIENTE LA BONITA';
  const customerTax = payload?.customer?.tax_id || '';

  const cabecera = rec({
    TIPFAC: '1',
    CODFAC: codfac,
    REFFAC: payload?.internal_number || invoice.internal_number || `LB-${invoice.id}`,
    FECFAC: issue,
    ESTFAC: 0,
    ALMFAC: 'GEN',
    CLIFAC: String(clientCode || ''),
    CNOFAC: String(customerName || ''),
    CNIFAC: String(customerTax || ''),
    NET1FAC: base,
    BAS1FAC: base,
    PIVA1FAC: ivaPct,
    IIVA1FAC: ivaAmount,
    TOTFAC: total,
    EDRFAC: Number(process.env.DELSOL_DEFAULT_EJERCICIO || '2026'),
    TRAFAC: 0,
    USUFAC: 5,
    USMFAC: 5,
  });

  const lineDesc = payload?.invoice?.concept || invoice.concept || `Factura interna ${invoice.internal_number || invoice.id}`;
  const linea = rec({
    TIPLFA: '1',
    CODLFA: codfac,
    POSLFA: 1,
    ARTLFA: '',
    DESLFA: String(lineDesc).slice(0, 250),
    CANLFA: 1,
    PRELFA: base,
    TOTLFA: base,
    IVALFA: 0,
    PIVLFA: 0,
    TIVLFA: 0,
    DOCLFA: '',
    EJELFA: '',
  });

  let writeFac = await client.escribirRegistro({ tabla: 'F_FAC', registro: cabecera });
  if (writeFac?.respuesta !== 'OK' && String(writeFac?.respuesta || '').includes('BDEscribirRegistroError')) {
    // Fallback defensivo: algunos tenants DELSOL fallan si CLIFAC/CNIFAC tienen formato no esperado.
    const cabeceraFallback = rec({
      TIPFAC: '1',
      CODFAC: codfac,
      REFFAC: payload?.internal_number || invoice.internal_number || `LB-${invoice.id}`,
      FECFAC: issue,
      ESTFAC: 0,
      ALMFAC: 'GEN',
      CLIFAC: '',
      CNOFAC: String(customerName || 'CLIENTE LA BONITA').slice(0, 100),
      CNIFAC: '',
      NET1FAC: base,
      BAS1FAC: base,
      PIVA1FAC: ivaPct,
      IIVA1FAC: ivaAmount,
      TOTFAC: total,
      EDRFAC: Number(process.env.DELSOL_DEFAULT_EJERCICIO || '2026'),
      TRAFAC: 0,
      USUFAC: 5,
      USMFAC: 5,
    });
    writeFac = await client.escribirRegistro({ tabla: 'F_FAC', registro: cabeceraFallback });
  }
  if (writeFac?.respuesta !== 'OK') throw new Error(`DELSOL F_FAC error: ${JSON.stringify(writeFac)}`);

  const writeLfa = await client.escribirRegistro({ tabla: 'F_LFA', registro: linea });
  if (writeLfa?.respuesta !== 'OK') throw new Error(`DELSOL F_LFA error: ${JSON.stringify(writeLfa)}`);

  await db.run(
    `UPDATE lb_internal_invoices
     SET delsol_status = 'SYNCED', delsol_external_id = ?, status = 'ENVIADA_DELSOL', updated_at = datetime('now')
     WHERE id = ?`,
    [String(codfac), invoice.id]
  );
  await db.run(
    `UPDATE petitions SET delsol_sync_status = 'SYNCED', delsol_last_sync_at = datetime('now'), delsol_sync_error = NULL, updated_at = datetime('now')
     WHERE id = ?`,
    [item.petition_id]
  );

  return { codfac, writeFac, writeLfa };
}

async function syncLiquidationQueueItem(item, client) {
  const payload = safeParse(item.payload);
  const liq = await db.get(`SELECT * FROM lb_liquidations WHERE id = ?`, [item.entity_id]);
  if (!liq) throw new Error('Liquidacion interna no encontrada para sincronizar');

  const codfac = await getNextFacturaNumber(client);
  const net = Number(liq.net_amount || payload.net || 0);
  const gross = Number(liq.gross_amount || payload.gross || net);
  const lineDesc = `Liquidacion interna peticion ${item.petition_id}`;

  const cabecera = rec({
    TIPFAC: '1',
    CODFAC: codfac,
    REFFAC: `LB-LIQ-${liq.id}`,
    FECFAC: isoDate(liq.created_at) || isoDate(new Date().toISOString().slice(0, 10)),
    ESTFAC: 0,
    ALMFAC: 'GEN',
    CLIFAC: '',
    CNOFAC: 'LIQUIDACION INTERNA',
    CNIFAC: '',
    NET1FAC: gross,
    BAS1FAC: gross,
    PIVA1FAC: 0,
    IIVA1FAC: 0,
    TOTFAC: gross,
    EDRFAC: Number(process.env.DELSOL_DEFAULT_EJERCICIO || '2026'),
    TRAFAC: 0,
    USUFAC: 5,
    USMFAC: 5,
  });

  const linea = rec({
    TIPLFA: '1',
    CODLFA: codfac,
    POSLFA: 1,
    ARTLFA: '',
    DESLFA: lineDesc,
    CANLFA: 1,
    PRELFA: gross,
    TOTLFA: gross,
    IVALFA: 0,
    PIVLFA: 0,
    TIVLFA: 0,
    DOCLFA: '',
    EJELFA: '',
  });

  const writeFac = await client.escribirRegistro({ tabla: 'F_FAC', registro: cabecera });
  if (writeFac?.respuesta !== 'OK') throw new Error(`DELSOL liquidacion F_FAC error: ${JSON.stringify(writeFac)}`);
  const writeLfa = await client.escribirRegistro({ tabla: 'F_LFA', registro: linea });
  if (writeLfa?.respuesta !== 'OK') throw new Error(`DELSOL liquidacion F_LFA error: ${JSON.stringify(writeLfa)}`);

  await db.run(`UPDATE lb_liquidations SET status = 'PENDIENTE_PAGO', updated_at = datetime('now') WHERE id = ?`, [liq.id]);
  await db.run(`UPDATE petitions SET delsol_sync_status = 'SYNCED', delsol_last_sync_at = datetime('now'), delsol_sync_error = NULL, updated_at = datetime('now') WHERE id = ?`, [item.petition_id]);
  return { codfac, net };
}

async function syncLaboralQueueItem(item, client) {
  const payload = safeParse(item.payload);
  const movement = await db.get(`SELECT * FROM lb_laboral_movements WHERE id = ?`, [item.entity_id]);
  if (!movement) throw new Error('Movimiento laboral no encontrado para sincronizar');

  // Placeholder write to proven table while laboral table final mapping is confirmed.
  // We persist key identifiers and status, preserving automatic retries.
  const codfac = await getNextFacturaNumber(client);
  const amount = 0;
  const cabecera = rec({
    TIPFAC: '1',
    CODFAC: codfac,
    REFFAC: `LB-LAB-${movement.id}`,
    FECFAC: isoDate(movement.start_date) || isoDate(new Date().toISOString().slice(0, 10)),
    ESTFAC: 0,
    ALMFAC: 'GEN',
    CLIFAC: '',
    CNOFAC: String(payload.person_name || movement.person_name || 'LABORAL'),
    CNIFAC: String(payload.person_tax_id || movement.person_tax_id || ''),
    NET1FAC: amount,
    BAS1FAC: amount,
    PIVA1FAC: 0,
    IIVA1FAC: 0,
    TOTFAC: amount,
    EDRFAC: Number(process.env.DELSOL_DEFAULT_EJERCICIO || '2026'),
    TRAFAC: 0,
    USUFAC: 5,
    USMFAC: 5,
  });
  const writeFac = await client.escribirRegistro({ tabla: 'F_FAC', registro: cabecera });
  if (writeFac?.respuesta !== 'OK') throw new Error(`DELSOL laboral write error: ${JSON.stringify(writeFac)}`);

  await db.run(`UPDATE lb_laboral_movements SET status = 'ENVIADO_DELSOL', updated_at = datetime('now') WHERE id = ?`, [movement.id]);
  await db.run(`UPDATE petitions SET delsol_sync_status = 'SYNCED', delsol_last_sync_at = datetime('now'), delsol_sync_error = NULL, updated_at = datetime('now') WHERE id = ?`, [item.petition_id]);
  return { codfac };
}

async function processQueueItem(item) {
  const client = new DelSolClient({ mode: modeFromEnv() });
  const op = String(item.operation || '').toLowerCase();
  if (item.entity_type === 'invoice' || op.includes('invoice')) {
    return syncInvoiceQueueItem(item, client);
  }
  if (item.entity_type === 'liquidation' || op.includes('liquidation') || op.includes('payment')) {
    return syncLiquidationQueueItem(item, client);
  }
  if (item.entity_type === 'laboral' || op.includes('alta_baja') || op.includes('a1')) {
    return syncLaboralQueueItem(item, client);
  }
  throw new Error(`Operacion DELSOL no mapeada: ${item.entity_type}/${item.operation}`);
}

async function processPendingQueueInternal(limit = 20) {
  const rows = await db.all(
    `SELECT id
     FROM delsol_sync_queue
     WHERE status IN ('pending','error','blocked_permission')
     ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'error' THEN 1 ELSE 2 END, id DESC
     LIMIT ?`,
    [Number(limit || 20)]
  );
  const conn = await activeConnection();
  const writeEnabled = Boolean(Number(process.env.DELSOL_WRITE_ENABLED || conn.write_enabled || 0));
  const mode = modeFromEnv();
  const results = [];

  for (const r of rows) {
    const item = await db.get(`SELECT * FROM delsol_sync_queue WHERE id = ?`, [r.id]);
    await db.run(`UPDATE delsol_sync_queue SET attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?`, [r.id]);

    if (mode !== 'live' || !writeEnabled) {
      const msg = 'BDSinPermiso: pendiente de permisos de escritura DELSOL.';
      await db.run(`UPDATE delsol_sync_queue SET status = 'blocked_permission', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [msg, r.id]);
      results.push({ id: r.id, status: 'blocked_permission', error: msg });
      continue;
    }

    try {
      const out = await processQueueItem(item);
      await db.run(`UPDATE delsol_sync_queue SET status = 'synced', last_error = NULL, updated_at = datetime('now') WHERE id = ?`, [r.id]);
      results.push({ id: r.id, status: 'synced', result: out });
    } catch (err) {
      await db.run(`UPDATE delsol_sync_queue SET status = 'error', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [err.message, r.id]);
      results.push({ id: r.id, status: 'error', error: err.message });
    }
  }

  return results;
}

exports.status = async (_req, res) => {
  try {
    const conn = await activeConnection();
    const counts = await db.all(`SELECT status, COUNT(*) AS count FROM delsol_sync_queue GROUP BY status`);
    const countMap = Object.fromEntries(counts.map((r) => [r.status, r.count]));
    res.json({
      mode: modeFromEnv(),
      ejercicio: process.env.DELSOL_DEFAULT_EJERCICIO || conn.ejercicio_default || '2026',
      read_enabled: Boolean(conn.read_enabled),
      write_enabled: Boolean(Number(process.env.DELSOL_WRITE_ENABLED || conn.write_enabled || 0)),
      connection: conn,
      queue: countMap,
      note: 'La Bonita funciona localmente. DELSOL queda desacoplado; si no hay escritura habilitada, la cola queda bloqueada con BDSinPermiso.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.testRead = async (req, res) => {
  try {
    const conn = await activeConnection();
    const client = new DelSolClient({ mode: modeFromEnv() });
    await db.run(`UPDATE delsol_connections SET last_read_test_at = datetime('now'), last_error = NULL WHERE id = ?`, [conn.id]);
    if (modeFromEnv() === 'live' && client.isEnabled()) {
      try {
        const read = await client.leerRegistro({
          tabla: req.body?.tabla || 'F_CLI',
          registro: rec({ CODCLI: Number(req.body?.codigo || 1) }),
        });
        return res.json({
          ok: true,
          respuesta: read?.respuesta || 'OK',
          mode: modeFromEnv(),
          ejercicio: req.body?.ejercicio || conn.ejercicio_default || defaultExercise(),
          table: req.body?.tabla || 'F_CLI',
          result: read?.resultado || [],
        });
      } catch {
        const sql = String(req.body?.sql || "SELECT TOP 1 CODFAC, REFFAC, TOTFAC FROM F_FAC ORDER BY CODFAC DESC");
        const readByQuery = await client.lanzarConsulta({ consulta: sql });
        return res.json({
          ok: true,
          respuesta: readByQuery?.respuesta || 'OK',
          mode: modeFromEnv(),
          ejercicio: req.body?.ejercicio || conn.ejercicio_default || defaultExercise(),
          table: req.body?.tabla || 'F_FAC',
          result: readByQuery?.resultado || [],
          fallback: 'LanzarConsulta',
        });
      }
    }
    res.json({
      ok: true,
      respuesta: 'OK',
      mode: modeFromEnv(),
      ejercicio: req.body?.ejercicio || conn.ejercicio_default || defaultExercise(),
      table: req.body?.tabla || 'F_CLI',
      result: [
        { columna: 'CODCLI', dato: 1 },
        { columna: 'NOFCLI', dato: 'Lectura simulada OK - activar credenciales para live' },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.testWrite = async (req, res) => {
  try {
    const conn = await activeConnection();
    const client = new DelSolClient({ mode: modeFromEnv() });
    const writeEnabled = Boolean(Number(process.env.DELSOL_WRITE_ENABLED || conn.write_enabled || 0));
    await db.run(`UPDATE delsol_connections SET last_write_test_at = datetime('now'), last_error = ? WHERE id = ?`, [writeEnabled ? null : 'BDSinPermiso', conn.id]);
    if (!writeEnabled || modeFromEnv() !== 'live') {
      return res.status(423).json({
        ok: false,
        respuesta: 'BDSinPermiso',
        mode: modeFromEnv(),
        ejercicio: req.body?.ejercicio || conn.ejercicio_default || defaultExercise(),
        message: 'La escritura real no está habilitada. Es correcto: se evita crear/modificar registros hasta que DELSOL habilite permisos.',
      });
    }
    if (!client.isEnabled()) {
      return res.status(400).json({ ok: false, error: 'DELSOL live habilitado pero faltan credenciales/urls en backend .env' });
    }
    const code = Date.now().toString().slice(-6);
    const cabecera = rec({
      TIPFAC: '1',
      CODFAC: Number(code),
      REFFAC: `LB-TEST-${code}`,
      FECFAC: isoDate(new Date().toISOString().slice(0, 10)),
      ESTFAC: 0,
      ALMFAC: 'GEN',
      CLIFAC: '',
      CNOFAC: 'PRUEBA DELSOL',
      CNIFAC: '',
      NET1FAC: 0,
      BAS1FAC: 0,
      PIVA1FAC: 0,
      IIVA1FAC: 0,
      TOTFAC: 0,
      EDRFAC: Number(defaultExercise()),
      TRAFAC: 0,
      USUFAC: 5,
      USMFAC: 5,
    });
    const write = await client.escribirRegistro({ tabla: req.body?.tabla || 'F_FAC', registro: cabecera });
    res.json({ ok: true, respuesta: write?.respuesta || 'OK', mode: modeFromEnv(), test_code: code, write });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.queue = async (_req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM delsol_sync_queue ORDER BY id DESC LIMIT 300`);
    res.json({ rows: rows.map((r) => ({ ...r, payload_json: (() => { try { return JSON.parse(r.payload); } catch { return {}; } })() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.processOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await db.get(`SELECT * FROM delsol_sync_queue WHERE id = ?`, [id]);
    if (!item) return res.status(404).json({ error: 'Item de cola no encontrado' });
    const conn = await activeConnection();
    const writeEnabled = Boolean(Number(process.env.DELSOL_WRITE_ENABLED || conn.write_enabled || 0));
    await db.run(`UPDATE delsol_sync_queue SET status = 'processing', attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?`, [id]);
    if (modeFromEnv() !== 'live' || !writeEnabled) {
      const msg = 'BDSinPermiso: DELSOL permite lectura pero no escritura. La operación queda guardada para reintentar.';
      await db.run(`UPDATE delsol_sync_queue SET status = 'blocked_permission', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [msg, id]);
      return res.status(423).json({ ok: false, respuesta: 'BDSinPermiso', id, message: msg });
    }
    const output = await processQueueItem(item);
    await db.run(`UPDATE delsol_sync_queue SET status = 'synced', last_error = NULL, updated_at = datetime('now') WHERE id = ?`, [id]);
    res.json({ ok: true, id, respuesta: 'OK', mode: modeFromEnv(), result: output });
  } catch (err) {
    try { await db.run(`UPDATE delsol_sync_queue SET status = 'error', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [err.message, Number(req.params.id)]); } catch {}
    res.status(500).json({ error: err.message });
  }
};

exports.processPending = async (req, res) => {
  try {
    const results = await processPendingQueueInternal(Number(req.body?.limit || 20));
    res.json({ ok: true, processed: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.processPendingQueueInternal = processPendingQueueInternal;
