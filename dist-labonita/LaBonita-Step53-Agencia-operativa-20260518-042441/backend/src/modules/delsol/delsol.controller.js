const db = require('../../config/db');

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
    await db.run(`UPDATE delsol_connections SET last_read_test_at = datetime('now'), last_error = NULL WHERE id = ?`, [conn.id]);
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
    res.json({ ok: true, respuesta: 'OK', message: 'Modo live con escritura habilitada. Implementar llamada HTTP real a DELSOL.' });
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
    // Safe placeholder: live mode can later call api.sdelsol.com here without changing app logic.
    await db.run(`UPDATE delsol_sync_queue SET status = 'synced', last_error = NULL, updated_at = datetime('now') WHERE id = ?`, [id]);
    res.json({ ok: true, id, respuesta: 'OK', message: 'Marcado como sincronizado en modo live preparado.' });
  } catch (err) {
    try { await db.run(`UPDATE delsol_sync_queue SET status = 'error', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [err.message, Number(req.params.id)]); } catch {}
    res.status(500).json({ error: err.message });
  }
};

exports.processPending = async (req, res) => {
  try {
    const rows = await db.all(`SELECT id FROM delsol_sync_queue WHERE status IN ('pending','error','blocked_permission') ORDER BY id LIMIT ?`, [Number(req.body?.limit || 20)]);
    const results = [];
    for (const r of rows) {
      req.params.id = String(r.id);
      // Inline minimal processing to avoid nested res usage.
      const conn = await activeConnection();
      const writeEnabled = Boolean(Number(process.env.DELSOL_WRITE_ENABLED || conn.write_enabled || 0));
      await db.run(`UPDATE delsol_sync_queue SET attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?`, [r.id]);
      if (modeFromEnv() !== 'live' || !writeEnabled) {
        const msg = 'BDSinPermiso: pendiente de permisos de escritura DELSOL.';
        await db.run(`UPDATE delsol_sync_queue SET status = 'blocked_permission', last_error = ?, updated_at = datetime('now') WHERE id = ?`, [msg, r.id]);
        results.push({ id: r.id, status: 'blocked_permission', error: msg });
      } else {
        await db.run(`UPDATE delsol_sync_queue SET status = 'synced', last_error = NULL, updated_at = datetime('now') WHERE id = ?`, [r.id]);
        results.push({ id: r.id, status: 'synced' });
      }
    }
    res.json({ ok: true, processed: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
