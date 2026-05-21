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

function externalCodeFromResult(result) {
  if (!result) return null;
  if (result.codfac != null) return String(result.codfac);
  if (result.codigo != null) return String(result.codigo);
  if (result.id != null) return String(result.id);
  return null;
}

function safeResultJson(result) {
  return JSON.stringify(result || {});
}

function sqlString(value) {
  return String(value || '').replace(/'/g, "''").slice(0, 120);
}

function facturacionClient() {
  return new DelSolClient({ mode: modeFromEnv(), area: 'facturacion' });
}

function laboralClient() {
  return new DelSolClient({ mode: modeFromEnv(), area: 'laboral' });
}

function areaForQueueItem(item) {
  const op = String(item?.operation || '').toLowerCase();
  if (item?.entity_type === 'laboral' || op.includes('alta_baja') || op.includes('a1')) return 'laboral';
  return 'facturacion';
}

function areaWriteEnabled(area, conn) {
  const specific = area === 'laboral' ? process.env.DELSOL_LABORAL_WRITE_ENABLED : process.env.DELSOL_FACTURACION_WRITE_ENABLED;
  return Boolean(Number(specific || process.env.DELSOL_WRITE_ENABLED || conn?.write_enabled || 0));
}

function splitName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { nom: 'LA BONITA', ap1: 'SIN', ap2: 'NOMBRE' };
  const nom = parts.shift() || 'LA BONITA';
  const ap1 = parts.shift() || 'SIN';
  const ap2 = parts.join(' ') || 'NOMBRE';
  return { nom: String(nom).toUpperCase(), ap1: String(ap1).toUpperCase(), ap2: String(ap2).toUpperCase() };
}

function sanitizeTaxId(tax) {
  return String(tax || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function normalizeProfileType(value) {
  return String(value || '').toUpperCase() === 'ASOCIADA' ? 'ASOCIADA' : 'PUNTUAL';
}

function workerDedupeKey(taxId, profileType) {
  return `${String(taxId || '').trim().toUpperCase()}::${normalizeProfileType(profileType)}`;
}

function blockError(message, result = {}) {
  const err = new Error(message);
  err.code = 'WORKER_DEDUPE_BLOCKED';
  err.result = result;
  return err;
}

function classifyQueueError(err) {
  const msg = String(err?.message || '');
  if (err?.code === 'WORKER_DEDUPE_BLOCKED') {
    return { status: 'blocked_permission', code: 'WORKER_DEDUPE_BLOCKED', action: 'Completar/corregir DNI-NIE y perfil para continuar sin duplicados.' };
  }
  if (err?.code === 'PENDING_MANUAL_REVIEW') {
    return { status: 'blocked_permission', code: 'PENDING_MANUAL_REVIEW', action: 'Revisión manual requerida por política de seguridad.' };
  }
  if (msg.includes('BDEscribirRegistroError')) {
    return { status: 'error', code: 'DELSOL_WRITE_ERROR', action: 'Revisar mapeo/campos obligatorios DELSOL y reintentar desde cola.' };
  }
  if (msg.includes('SQLITE_CONSTRAINT')) {
    return { status: 'error', code: 'LOCAL_CONSTRAINT_ERROR', action: 'Revisar datos locales de liquidación/estado antes de reintentar.' };
  }
  return { status: 'error', code: 'UNCLASSIFIED_ERROR', action: 'Revisar detalle técnico y reintentar.' };
}

function rowToObject(row) {
  if (Array.isArray(row)) {
    return row.reduce((acc, cell) => {
      if (cell?.columna) acc[cell.columna] = cell.dato;
      return acc;
    }, {});
  }
  return row || {};
}

function rowsToObjects(resp) {
  return (Array.isArray(resp?.resultado) ? resp.resultado : []).map(rowToObject);
}

function toRec(obj) {
  return Object.entries(obj).map(([columna, dato]) => ({ columna, dato }));
}

async function queryRows(client, sql) {
  const q = await client.lanzarConsulta({ consulta: sql });
  return rowsToObjects(q);
}

function sqlEscape(value) {
  return String(value || '').replace(/'/g, "''");
}

async function nextCode(client, table, field) {
  const rows = await queryRows(client, `SELECT MAX(${field}) AS M FROM ${table}`);
  const current = Number(rows?.[0]?.M || 0);
  return current + 1;
}

async function cloneTemplate(client, table, keyField) {
  const rows = await queryRows(client, `SELECT TOP 1 * FROM ${table} ORDER BY ${keyField} DESC`);
  if (!rows.length) {
    const err = new Error(`Template base no encontrado para ${table}`);
    err.code = 'NOMINASOL_TEMPLATE_MISSING';
    throw err;
  }
  return { ...rows[0] };
}

async function ensureWorkerNominasol(client, payload = {}) {
  const taxId = sanitizeTaxId(payload.person_tax_id || payload.worker_tax_id || payload.nif || '');
  const profileType = normalizeProfileType(payload.profile_type);
  if (!taxId) {
    throw blockError('DNI/NIE obligatorio para deduplicacion segura en NominaSOL.', {
      reason: 'MISSING_TAX_ID',
      profile_type: profileType,
    });
  }
  const dedupeKey = workerDedupeKey(taxId, profileType);
  const fullName = payload.person_name || payload.worker_name || payload.responsible_name || 'La Bonita';
  const { nom, ap1, ap2 } = splitName(fullName);
  const startDate = payload.start_date || payload.service_date || payload.date || null;

  let codtra = null;
  let dedupeStatus = 'reused';
  let dedupeSource = 'registry';
  const registry = await db.get(`SELECT codtra FROM nominasol_worker_registry WHERE dedupe_key = ? LIMIT 1`, [dedupeKey]);
  if (registry?.codtra) codtra = Number(registry.codtra);

  if (!codtra) {
    const conflictingProfile = await db.get(
      `SELECT dedupe_key, codtra, profile_type
       FROM nominasol_worker_registry
       WHERE tax_id = ? AND profile_type <> ?
       ORDER BY updated_at DESC
       LIMIT 1`,
      [taxId, profileType]
    );
    if (conflictingProfile?.codtra) {
      throw blockError('DNI/NIE ya registrado en otro tipo de perfil. Revision manual requerida.', {
        reason: 'CROSS_PROFILE_CONFLICT',
        tax_id: taxId,
        requested_profile_type: profileType,
        existing_profile_type: conflictingProfile.profile_type,
        existing_codtra: Number(conflictingProfile.codtra),
        existing_dedupe_key: conflictingProfile.dedupe_key,
      });
    }
  }
  if (!codtra) {
    const found = await queryRows(client, `SELECT TOP 1 CODTRA FROM F_TRA WHERE DNITRA = '${sqlEscape(taxId)}' ORDER BY CODTRA DESC`);
    if (found.length) {
      codtra = Number(found[0].CODTRA);
      dedupeStatus = 'reused';
      dedupeSource = 'remote_f_tra';
    }
  }

  if (!codtra) {
    const row = await cloneTemplate(client, 'F_TRA', 'CODTRA');
    const newCode = await nextCode(client, 'F_TRA', 'CODTRA');
    row.CODTRA = newCode;
    if ('DNITRA' in row) row.DNITRA = taxId;
    if ('NOMTRA' in row) row.NOMTRA = nom;
    if ('AP1TRA' in row) row.AP1TRA = ap1;
    if ('AP2TRA' in row) row.AP2TRA = ap2;
    if ('EMATRA' in row) row.EMATRA = payload.email || `nomina+${newCode}@labonita.local`;
    if ('FALTRA' in row && startDate) row.FALTRA = `${String(startDate).slice(0, 10)}T00:00:00`;
    if ('FBJTRA' in row && payload.end_date) row.FBJTRA = `${String(payload.end_date).slice(0, 10)}T00:00:00`;
    const write = await client.escribirRegistro({ tabla: 'F_TRA', registro: toRec(row) });
    if (write?.respuesta !== 'OK') throw new Error(`Error escritura F_TRA: ${write?.respuesta || 'sin detalle'}`);
    codtra = newCode;
    dedupeStatus = 'created';
    dedupeSource = 'create_f_tra';
  } else {
    const patch = { CODTRA: codtra, NOMTRA: nom, AP1TRA: ap1, AP2TRA: ap2 };
    patch.DNITRA = taxId;
    const upd = await client.actualizarRegistro({ tabla: 'F_TRA', registro: toRec(patch) });
    if (upd?.respuesta !== 'OK') throw new Error(`Error actualización F_TRA: ${upd?.respuesta || 'sin detalle'}`);
  }

  await db.run(
    `INSERT INTO nominasol_worker_registry (dedupe_key, codtra, tax_id, profile_type, source, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(dedupe_key) DO UPDATE SET codtra=excluded.codtra, tax_id=excluded.tax_id, profile_type=excluded.profile_type, source=excluded.source, updated_at=datetime('now')`,
    [dedupeKey, codtra, taxId, profileType, dedupeSource]
  );

  return {
    codtra,
    tax_id: taxId,
    profile_type: profileType,
    dedupe_key: dedupeKey,
    dedupe_status: dedupeStatus,
    dedupe_source: dedupeSource,
  };
}

async function writeContractNominasol(client, payload = {}, codtra) {
  const { nom, ap1, ap2 } = splitName(payload.person_name || payload.worker_name || 'La Bonita');
  const row = await cloneTemplate(client, 'F_CON', 'CODCON');
  const codcon = await nextCode(client, 'F_CON', 'CODCON');
  row.CODCON = codcon;
  row.TRACON = codtra;
  if ('NOMCON' in row) row.NOMCON = nom;
  if ('AP1CON' in row) row.AP1CON = ap1;
  if ('AP2CON' in row) row.AP2CON = ap2;
  if ('FINCON' in row && payload.start_date) row.FINCON = `${String(payload.start_date).slice(0, 10)}T00:00:00`;
  if ('FFICON' in row && payload.end_date) row.FFICON = `${String(payload.end_date).slice(0, 10)}T00:00:00`;
  const write = await client.escribirRegistro({ tabla: 'F_CON', registro: toRec(row) });
  if (write?.respuesta !== 'OK') throw new Error(`Error escritura F_CON: ${write?.respuesta || 'sin detalle'}`);
  return { codcon };
}

async function writeNominaNominasol(client, payload = {}, codtra) {
  const row = await cloneTemplate(client, 'F_NOM', 'CODNOM');
  const codnom = await nextCode(client, 'F_NOM', 'CODNOM');
  row.CODNOM = codnom;
  row.TRANOM = codtra;
  if ('FECNOM' in row) {
    const d = payload.nomina_date || payload.date || payload.payment_date || new Date().toISOString().slice(0, 10);
    row.FECNOM = `${String(d).slice(0, 10)}T00:00:00`;
  }
  if ('TOTNOM' in row) row.TOTNOM = Number(payload.net || payload.net_amount || payload.total || 0);
  const write = await client.escribirRegistro({ tabla: 'F_NOM', registro: toRec(row) });
  if (write?.respuesta !== 'OK') throw new Error(`Error escritura F_NOM: ${write?.respuesta || 'sin detalle'}`);
  return { codnom };
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

  const writeConfirmed = String(process.env.DELSOL_NOMINASOL_WRITE_CONFIRMED || '0') === '1';
  if (!writeConfirmed) {
    const err = new Error('PENDING_MANUAL_REVIEW: liquidacion/nomina interna creada, pero no se escribe como factura DelSol. Falta mapeo confirmado de pago/nomina en Nominasol/Contasol.');
    err.code = 'PENDING_MANUAL_REVIEW';
    err.result = {
      liquidation_id: liq.id,
      net: Number(liq.net_amount || payload.net || 0),
      expected_tables: ['F_NOM', 'F_TRA', 'F_CON'],
    };
    throw err;
  }

  const worker = await ensureWorkerNominasol(client, payload);
  const nomina = await writeNominaNominasol(client, payload, worker.codtra);
  return {
    dedupe: {
      status: worker.dedupe_status,
      source: worker.dedupe_source,
      key: worker.dedupe_key,
      tax_id: worker.tax_id,
      profile_type: worker.profile_type,
    },
    codtra: worker.codtra,
    codnom: nomina.codnom,
    net: Number(liq.net_amount || payload.net || 0),
    source: 'F_NOM',
  };
}

async function syncLaboralQueueItem(item, client) {
  const payload = safeParse(item.payload);
  const movement = await db.get(`SELECT * FROM lb_laboral_movements WHERE id = ?`, [item.entity_id]);
  if (!movement) throw new Error('Movimiento laboral no encontrado para sincronizar');

  const personTax = sqlString(payload.person_tax_id || movement.person_tax_id || '');
  let readonlyCheck = { checked: false };
  if (client.isEnabled() && personTax) {
    const check = await client.lanzarConsulta({
      consulta: `SELECT COUNT(*) AS total FROM F_TRA WHERE DNITRA = '${personTax}'`
    });
    const row = check?.resultado?.[0] || [];
    readonlyCheck = {
      checked: true,
      table: 'F_TRA',
      key: 'DNITRA',
      matches: Number(row.find((x) => x.columna === 'total')?.dato || 0),
    };
  }

  const writeConfirmed = String(process.env.DELSOL_NOMINASOL_WRITE_CONFIRMED || '0') === '1';
  if (!writeConfirmed) {
    const err = new Error('PENDING_MANUAL_REVIEW: Nominasol confirmado en lectura (F_TRA/F_CON/F_NOM), pero la escritura de alta/baja/nomina queda bloqueada hasta prueba controlada autorizada.');
    err.code = 'PENDING_MANUAL_REVIEW';
    err.result = { readonlyCheck, tables: ['F_TRA', 'F_CON', 'F_NOM'] };
    throw err;
  }

  const worker = await ensureWorkerNominasol(client, payload);
  const contract = await writeContractNominasol(client, payload, worker.codtra);
  return {
    dedupe: {
      status: worker.dedupe_status,
      source: worker.dedupe_source,
      key: worker.dedupe_key,
      tax_id: worker.tax_id,
      profile_type: worker.profile_type,
    },
    codtra: worker.codtra,
    codcon: contract.codcon,
    readonlyCheck,
    tables: ['F_TRA', 'F_CON'],
  };
}

async function processQueueItem(item) {
  const op = String(item.operation || '').toLowerCase();
  if (item.entity_type === 'invoice' || op.includes('invoice')) {
    return syncInvoiceQueueItem(item, facturacionClient());
  }
  if (item.entity_type === 'liquidation' || op.includes('liquidation') || op.includes('payment')) {
    return syncLiquidationQueueItem(item, laboralClient());
  }
  if (item.entity_type === 'laboral' || op.includes('alta_baja') || op.includes('a1')) {
    return syncLaboralQueueItem(item, laboralClient());
  }
  throw new Error(`Operacion DELSOL no mapeada: ${item.entity_type}/${item.operation}`);
}

async function processPendingQueueInternal(limit = 20) {
  const rows = await db.all(
    `SELECT id
     FROM delsol_sync_queue
     WHERE status IN ('pending','error','blocked_permission')
     ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'error' THEN 1 ELSE 2 END, id ASC
     LIMIT ?`,
    [Number(limit || 20)]
  );
  const conn = await activeConnection();
  const mode = modeFromEnv();
  const results = [];

  for (const r of rows) {
    const item = await db.get(`SELECT * FROM delsol_sync_queue WHERE id = ?`, [r.id]);
    await db.run(`UPDATE delsol_sync_queue SET attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?`, [r.id]);

    const area = areaForQueueItem(item);
    if (mode !== 'live' || !areaWriteEnabled(area, conn)) {
      const msg = 'BDSinPermiso: pendiente de permisos de escritura DELSOL.';
      await db.run(`UPDATE delsol_sync_queue SET status = 'blocked_permission', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [msg, r.id]);
      results.push({ id: r.id, status: 'blocked_permission', error: msg });
      continue;
    }

    try {
      const out = await processQueueItem(item);
      await db.run(
        `UPDATE delsol_sync_queue
         SET status = 'synced',
             external_code = ?,
             result_json = ?,
             last_error = NULL,
             updated_at = datetime('now')
         WHERE id = ?`,
        [externalCodeFromResult(out), safeResultJson(out), r.id]
      );
      results.push({ id: r.id, status: 'synced', result: out });
    } catch (err) {
      const classified = classifyQueueError(err);
      await db.run(
        `UPDATE delsol_sync_queue SET status = ?, last_error = ?, result_json = ?, updated_at = datetime('now') WHERE id = ?`,
        [classified.status, err.message, safeResultJson({ ...(err.result || {}), classification: classified }), r.id]
      );
      results.push({ id: r.id, status: classified.status, error: err.message, result: err.result || null, classification: classified });
    }
  }

  return results;
}

exports.status = async (_req, res) => {
  try {
    const conn = await activeConnection();
    const counts = await db.all(`SELECT status, COUNT(*) AS count FROM delsol_sync_queue GROUP BY status`);
    const countMap = Object.fromEntries(counts.map((r) => [r.status, r.count]));
    const facturacion = facturacionClient().publicStatus();
    const laboral = laboralClient().publicStatus();
    let nominasol = { readable: false, tables: [] };
    if (modeFromEnv() === 'live' && laboral.enabled) {
      try {
        const rows = await laboralClient().lanzarConsulta({
          consulta: "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('F_TRA','F_CON','F_NOM','F_EMP') ORDER BY TABLE_NAME"
        });
        nominasol = {
          readable: rows?.respuesta === 'OK',
          tables: (rows?.resultado || []).map((row) => row.find((x) => x.columna === 'TABLE_NAME')?.dato).filter(Boolean),
          write_confirmed: String(process.env.DELSOL_NOMINASOL_WRITE_CONFIRMED || '0') === '1',
        };
      } catch (err) {
        nominasol = { readable: false, tables: [], error: err.message };
      }
    }
    res.json({
      mode: modeFromEnv(),
      ejercicio: process.env.DELSOL_DEFAULT_EJERCICIO || conn.ejercicio_default || '2026',
      read_enabled: Boolean(conn.read_enabled),
      write_enabled: Boolean(Number(process.env.DELSOL_WRITE_ENABLED || conn.write_enabled || 0)),
      facturacion,
      laboral,
      nominasol,
      connection: conn,
      queue: countMap,
      note: 'La Bonita funciona localmente. DELSOL queda desacoplado; si no hay escritura habilitada, la cola queda bloqueada con BDSinPermiso.',
    });
  } catch (err) {
    res.status(err.code === 'PENDING_MANUAL_REVIEW' ? 423 : 500).json({ error: err.message, result: err.result || null });
  }
};

exports.testRead = async (req, res) => {
  try {
    const conn = await activeConnection();
    const client = new DelSolClient({ mode: modeFromEnv(), area: req.body?.area === 'laboral' ? 'laboral' : 'facturacion' });
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
    res.status(err.code === 'PENDING_MANUAL_REVIEW' ? 423 : 500).json({ error: err.message, result: err.result || null });
  }
};

exports.testWrite = async (req, res) => {
  try {
    const conn = await activeConnection();
    const area = req.body?.area === 'laboral' ? 'laboral' : 'facturacion';
    const client = area === 'laboral' ? laboralClient() : facturacionClient();
    const writeEnabled = areaWriteEnabled(area, conn);
    if (area === 'laboral') {
      if (String(process.env.DELSOL_NOMINASOL_WRITE_CONFIRMED || '0') !== '1') {
        return res.status(423).json({
          ok: false,
          respuesta: 'PENDING_MANUAL_REVIEW',
          mode: modeFromEnv(),
          ejercicio: req.body?.ejercicio || conn.ejercicio_default || defaultExercise(),
          message: 'Nominasol esta confirmado en lectura, pero la escritura laboral requiere prueba controlada especifica fuera del flujo normal.',
        });
      }
      if (!writeEnabled || modeFromEnv() !== 'live') {
        return res.status(423).json({
          ok: false,
          respuesta: 'BDSinPermiso',
          mode: modeFromEnv(),
          ejercicio: req.body?.ejercicio || conn.ejercicio_default || defaultExercise(),
          message: 'La escritura laboral no estÃ¡ habilitada en DELSOL.',
        });
      }
      const worker = await ensureWorkerNominasol(client, {
        person_name: 'LABONITA TEST WRITE',
        person_tax_id: `LBWRITE${Date.now().toString().slice(-6)}`,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        email: 'write.test@labonita.local',
      });
      const contract = await writeContractNominasol(client, {
        person_name: 'LABONITA TEST WRITE',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
      }, worker.codtra);
      const nomina = await writeNominaNominasol(client, {
        net_amount: 0,
        nomina_date: new Date().toISOString().slice(0, 10),
      }, worker.codtra);
      return res.json({
        ok: true,
        respuesta: 'OK',
        mode: modeFromEnv(),
        area: 'laboral',
        result: { codtra: worker.codtra, codcon: contract.codcon, codnom: nomina.codnom },
      });
    }
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
    res.json({ rows: rows.map((r) => ({
      ...r,
      payload_json: (() => { try { return JSON.parse(r.payload); } catch { return {}; } })(),
      result: (() => { try { return JSON.parse(r.result_json || '{}'); } catch { return {}; } })()
    })) });
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
    const area = areaForQueueItem(item);
    const writeEnabled = areaWriteEnabled(area, conn);
    await db.run(`UPDATE delsol_sync_queue SET status = 'processing', attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?`, [id]);
    if (modeFromEnv() !== 'live' || !writeEnabled) {
      const msg = 'BDSinPermiso: DELSOL permite lectura pero no escritura. La operación queda guardada para reintentar.';
      await db.run(`UPDATE delsol_sync_queue SET status = 'blocked_permission', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [msg, id]);
      return res.status(423).json({ ok: false, respuesta: 'BDSinPermiso', id, message: msg });
    }
    const output = await processQueueItem(item);
    await db.run(
      `UPDATE delsol_sync_queue
       SET status = 'synced',
           external_code = ?,
           result_json = ?,
           last_error = NULL,
           updated_at = datetime('now')
       WHERE id = ?`,
      [externalCodeFromResult(output), safeResultJson(output), id]
    );
    res.json({ ok: true, id, respuesta: 'OK', mode: modeFromEnv(), result: output });
  } catch (err) {
    try {
      const classified = classifyQueueError(err);
      await db.run(
        `UPDATE delsol_sync_queue SET status = ?, last_error = ?, result_json = ?, updated_at = datetime('now') WHERE id = ?`,
        [classified.status, err.message, safeResultJson({ ...(err.result || {}), classification: classified }), Number(req.params.id)]
      );
    } catch {}
    res.status(err.code === 'PENDING_MANUAL_REVIEW' ? 423 : 500).json({ error: err.message, result: err.result || null });
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
