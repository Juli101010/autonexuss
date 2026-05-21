const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const raw = new sqlite3.Database(dbPath);

raw.serialize(() => {
  raw.run('PRAGMA foreign_keys = ON');
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    raw.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    raw.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    raw.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    raw.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

async function tableExists(name) {
  const row = await get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
    [name]
  );
  return !!row;
}

async function tableInfo(table) {
  return all(`PRAGMA table_info(${table})`);
}

async function hasColumn(table, column) {
  const cols = await tableInfo(table);
  return cols.some((c) => c.name === column);
}

async function ensureColumn(table, column, alterSql) {
  if (await hasColumn(table, column)) return;
  await run(alterSql);
}

async function ensureIndex(sql) {
  await run(sql);
}

async function migrate() {
  // USERS
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ARTIST',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await ensureColumn('users', 'role', `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'ARTIST'`);
  await ensureColumn('users', 'created_at', `ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT (datetime('now'))`);
  await ensureColumn('users', 'updated_at', `ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`);

  // LEGACY SOCIOS (compatibilidad; la verdad futura es memberships)
  await run(`
    CREATE TABLE IF NOT EXISTS socios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      artist_name TEXT,
      email TEXT,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('socios', 'active', `ALTER TABLE socios ADD COLUMN active INTEGER DEFAULT 1`);
  await ensureColumn('socios', 'created_at', `ALTER TABLE socios ADD COLUMN created_at TEXT DEFAULT (datetime('now'))`);
  await ensureColumn('socios', 'updated_at', `ALTER TABLE socios ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`);

  // PROFILES
  await run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      artist_name TEXT,
      legal_name TEXT,
      phone TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT,
      region TEXT,
      postal_code TEXT,
      country TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // FISCAL PROFILES
  await run(`
    CREATE TABLE IF NOT EXISTS fiscal_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      tax_id TEXT,
      vat_number TEXT,
      residence_country TEXT,
      irpf_rate REAL DEFAULT 0.02,
      bank_iban TEXT,
      bank_bic TEXT,
      fiscal_address_line1 TEXT,
      fiscal_address_line2 TEXT,
      fiscal_city TEXT,
      fiscal_region TEXT,
      fiscal_postal_code TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // MEMBERSHIPS
  await run(`
    CREATE TABLE IF NOT EXISTS memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      service_puntual_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS membership_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(membership_id) REFERENCES memberships(id) ON DELETE CASCADE
    )
  `);

  // PETITIONS
  await run(`
    CREATE TABLE IF NOT EXISTS petitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'ONBOARDING_ASSOCIADO',
      data TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'BORRADOR',
      admin_note TEXT,
      rejection_reason TEXT,
      locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('petitions', 'type', `ALTER TABLE petitions ADD COLUMN type TEXT NOT NULL DEFAULT 'ONBOARDING_ASSOCIADO'`);
  await ensureColumn('petitions', 'admin_note', `ALTER TABLE petitions ADD COLUMN admin_note TEXT`);
  await ensureColumn('petitions', 'rejection_reason', `ALTER TABLE petitions ADD COLUMN rejection_reason TEXT`);
  await ensureColumn('petitions', 'locked', `ALTER TABLE petitions ADD COLUMN locked INTEGER NOT NULL DEFAULT 0`);
  await ensureColumn('petitions', 'created_at', `ALTER TABLE petitions ADD COLUMN created_at TEXT DEFAULT (datetime('now'))`);
  await ensureColumn('petitions', 'updated_at', `ALTER TABLE petitions ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`);
  // STEP 4: Tracking & reminders
  await ensureColumn('petitions', 'pending_checklist', `ALTER TABLE petitions ADD COLUMN pending_checklist TEXT`);
  await ensureColumn('petitions', 'pending_checklist_updated_at', `ALTER TABLE petitions ADD COLUMN pending_checklist_updated_at TEXT`);
  await ensureColumn('petitions', 'last_reminder_at', `ALTER TABLE petitions ADD COLUMN last_reminder_at TEXT`);
  await ensureColumn('petitions', 'reminder_count', `ALTER TABLE petitions ADD COLUMN reminder_count INTEGER NOT NULL DEFAULT 0`);

// Billing integration tracking (petitions -> billing outbox)
await ensureColumn('petitions', 'billing_status', `ALTER TABLE petitions ADD COLUMN billing_status TEXT`);
await ensureColumn('petitions', 'billing_invoice_id', `ALTER TABLE petitions ADD COLUMN billing_invoice_id INTEGER`);
await ensureColumn('petitions', 'billing_error', `ALTER TABLE petitions ADD COLUMN billing_error TEXT`);
await ensureColumn('petitions', 'billing_last_attempt_at', `ALTER TABLE petitions ADD COLUMN billing_last_attempt_at TEXT`);

// DelSol integration (prepared, not enabled yet)
await ensureColumn('petitions', 'delsol_customer_id', `ALTER TABLE petitions ADD COLUMN delsol_customer_id TEXT`);
await ensureColumn('petitions', 'delsol_invoice_id', `ALTER TABLE petitions ADD COLUMN delsol_invoice_id TEXT`);
await ensureColumn('petitions', 'delsol_laboral_id', `ALTER TABLE petitions ADD COLUMN delsol_laboral_id TEXT`);
await ensureColumn('petitions', 'delsol_sync_status', `ALTER TABLE petitions ADD COLUMN delsol_sync_status TEXT`);
await ensureColumn('petitions', 'delsol_last_sync_at', `ALTER TABLE petitions ADD COLUMN delsol_last_sync_at TEXT`);
await ensureColumn('petitions', 'delsol_sync_error', `ALTER TABLE petitions ADD COLUMN delsol_sync_error TEXT`);

await run(`
  CREATE TABLE IF NOT EXISTS billing_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petition_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|FAILED|DONE
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE
  )
`);


  // NOTIFICATIONS (con dedupe)
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      dedupe_key TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);


// Email outbox (prepared). Not sent by default; used to later connect SMTP/Sendgrid/etc.
  await exec(`
  CREATE TABLE IF NOT EXISTS email_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    to_email TEXT NOT NULL,
    template_key TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENT','FAILED')),
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status);
  CREATE INDEX IF NOT EXISTS idx_email_outbox_created_at ON email_outbox(created_at);
`);

  await ensureColumn('notifications', 'dedupe_key', `ALTER TABLE notifications ADD COLUMN dedupe_key TEXT`);
  await ensureIndex(`CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe ON notifications(user_id, dedupe_key)`);

  
  // PETITION EVENTS (audit timeline)
  await run(`
    CREATE TABLE IF NOT EXISTS petition_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      actor_user_id INTEGER,
      actor_role TEXT,
      event_type TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      payload TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE
    )
  `);
  await ensureIndex(`CREATE INDEX IF NOT EXISTS idx_petition_events_petition_id ON petition_events(petition_id)`);
  await ensureIndex(`CREATE INDEX IF NOT EXISTS idx_petition_events_created_at ON petition_events(created_at)`);
// DOCUMENTS
  await run(`
    CREATE TABLE IF NOT EXISTS documents (
      external_system TEXT,
      external_id TEXT,
      external_series TEXT,
      external_number TEXT,
      sync_status TEXT,
      sync_payload TEXT,

      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      petition_id INTEGER,
      doc_type TEXT NOT NULL,
      original_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      storage_path TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE SET NULL
    )
  `);
  await ensureColumn('documents', 'is_official', `ALTER TABLE documents ADD COLUMN is_official INTEGER DEFAULT 0`);
  await ensureColumn('documents', 'uploaded_by_role', `ALTER TABLE documents ADD COLUMN uploaded_by_role TEXT DEFAULT 'ARTIST'`);


  
  // MESSAGES (thread per petition)
  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      sender_user_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE,
      FOREIGN KEY(sender_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await ensureIndex(`CREATE INDEX IF NOT EXISTS idx_messages_petition_created ON messages(petition_id, created_at)`);

// Backfill memberships desde socios
  if (await tableExists('socios')) {
    await run(`
      INSERT OR IGNORE INTO memberships (user_id, type, status, service_puntual_count, created_at, updated_at)
      SELECT
        s.user_id,
        'ASOCIADO',
        CASE WHEN COALESCE(s.active, 1) = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END,
        0,
        datetime('now'),
        datetime('now')
      FROM socios s
      WHERE s.user_id IS NOT NULL
    `);
  }
}

async function transaction(fn) {
  await exec('BEGIN IMMEDIATE');
  try {
    const result = await fn();
    await exec('COMMIT');
    return result;
  } catch (err) {
    await exec('ROLLBACK');
    throw err;
  }
}


// Commissions (monthly) - manual entries used by Control Total exports.
exec(`
  CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petition_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    label TEXT NOT NULL,
    amount_eur REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_commissions_petition_id ON commissions(petition_id);
  CREATE INDEX IF NOT EXISTS idx_commissions_month ON commissions(month);
`);


// Ledger transactions: real cash movements (collections, payouts, adjustments)
// Used by Control Total to reconcile projects to zero.
exec(`
  CREATE TABLE IF NOT EXISTS ledger_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petition_id INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('IN','OUT')),
    category TEXT NOT NULL CHECK(category IN ('COBRO','PAGO','AJUSTE')),
    amount_eur REAL NOT NULL,
    occurred_at TEXT NOT NULL,
    note TEXT,
    created_by_user_id INTEGER,
    created_by_role TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_ledger_petition_id ON ledger_transactions(petition_id);
  CREATE INDEX IF NOT EXISTS idx_ledger_occurred_at ON ledger_transactions(occurred_at);
  CREATE INDEX IF NOT EXISTS idx_ledger_category ON ledger_transactions(category);
`);


// Friday payouts proposals (manual approval)
exec(`
  CREATE TABLE IF NOT EXISTS payout_batch_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petition_id INTEGER NOT NULL,
    occurred_at TEXT NOT NULL,
    proposed_amount_eur REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
    note TEXT,
    created_by_role TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    decided_by_user_id INTEGER,
    decided_at TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS ux_payout_batch_petition_day ON payout_batch_items(petition_id, occurred_at);
  CREATE INDEX IF NOT EXISTS idx_payout_batch_status ON payout_batch_items(status);
`);


// Non-breaking schema upgrades (safe to run multiple times)
async function upgrade() {
  // --- Messaging tables used by messages.controller.js ---
  await exec(`
    CREATE TABLE IF NOT EXISTS petition_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      from_user_id INTEGER,
      from_role TEXT,
      to_user_id INTEGER,
      body TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'CHAT' CHECK(kind IN ('CHAT','AVISO')),
      created_at TEXT DEFAULT (datetime('now')),
      read_at TEXT,
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_petition_messages_petition ON petition_messages(petition_id, id);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS petition_message_reads (
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (message_id, user_id),
      FOREIGN KEY(message_id) REFERENCES petition_messages(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_msg_reads_user ON petition_message_reads(user_id);
  `);

  // --- Announcements + groups (premium inbox targeting) ---
  await exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_by_user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      scope TEXT NOT NULL CHECK(scope IN ('ALL','ARTISTS','ADMIN','USER','PETITION_TYPE','GROUP')),
      scope_value TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS user_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_group_members (
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY(group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // --- Notifications enrichments ---
  await ensureColumn('notifications', 'notif_type', `ALTER TABLE notifications ADD COLUMN notif_type TEXT DEFAULT 'GENERIC'`);
  await ensureColumn('notifications', 'severity', `ALTER TABLE notifications ADD COLUMN severity TEXT DEFAULT 'INFO'`);
  await ensureColumn('notifications', 'meta_json', `ALTER TABLE notifications ADD COLUMN meta_json TEXT DEFAULT '{}'`);
  await ensureColumn('notifications', 'dedupe_key', `ALTER TABLE notifications ADD COLUMN dedupe_key TEXT`);
  await ensureIndex(`CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_dedupe ON notifications(dedupe_key) WHERE dedupe_key IS NOT NULL`);

  // --- DelSol reconcile prep ---
  await exec(`
    CREATE TABLE IF NOT EXISTS invoice_reconciliations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      doc_id INTEGER,
      system TEXT NOT NULL,
      mode TEXT NOT NULL,
      external_id TEXT,
      external_series TEXT,
      external_number TEXT,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      reconciled_by INTEGER,
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_invoice_recon_petition ON invoice_reconciliations(petition_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_recon_system ON invoice_reconciliations(system);
  `);

  // --- La Bonita operational core 2026: system first, DelSol as sync target ---
  await exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lb_parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK(kind IN ('ARTISTA','ASOCIADA','PUNTUAL','AUTONOMO','CLIENTE','COMPANIA','PROVEEDOR')),
      legal_name TEXT NOT NULL,
      display_name TEXT,
      tax_id TEXT,
      email TEXT,
      phone TEXT,
      address_json TEXT NOT NULL DEFAULT '{}',
      country TEXT DEFAULT 'ES',
      delsol_table TEXT,
      delsol_code TEXT,
      sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK(sync_status IN ('LOCAL','PENDING','SYNCED','ERROR','BLOCKED_PERMISSION')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_lb_parties_kind ON lb_parties(kind);
    CREATE INDEX IF NOT EXISTS idx_lb_parties_tax_id ON lb_parties(tax_id);

    CREATE TABLE IF NOT EXISTS lb_internal_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      internal_number TEXT NOT NULL UNIQUE,
      customer_party_id INTEGER,
      issue_date TEXT NOT NULL,
      service_date TEXT,
      concept TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      iva_rate REAL NOT NULL DEFAULT 0,
      iva_total REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      commission_rate REAL NOT NULL DEFAULT 0.10,
      commission_amount REAL NOT NULL DEFAULT 0,
      irpf_rate REAL NOT NULL DEFAULT 0.02,
      irpf_amount REAL NOT NULL DEFAULT 0,
      net_artist REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'BORRADOR_INTERNO' CHECK(status IN ('BORRADOR_INTERNO','PENDIENTE_DELSOL','ENVIADA_DELSOL','CONFIRMADA_DELSOL','ERROR_SINCRONIZACION','ANULADA')),
      delsol_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(delsol_status IN ('PENDING','SYNCED','ERROR','BLOCKED_PERMISSION','NOT_REQUIRED')),
      delsol_external_id TEXT,
      delsol_payload TEXT NOT NULL DEFAULT '{}',
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE,
      FOREIGN KEY(customer_party_id) REFERENCES lb_parties(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_lb_invoices_petition ON lb_internal_invoices(petition_id);
    CREATE INDEX IF NOT EXISTS idx_lb_invoices_status ON lb_internal_invoices(status);

    CREATE TABLE IF NOT EXISTS lb_invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      concept TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      iva_rate REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(invoice_id) REFERENCES lb_internal_invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lb_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      contract_type TEXT NOT NULL DEFAULT 'COLABORACION',
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'BORRADOR' CHECK(status IN ('BORRADOR','PENDIENTE_FIRMA','FIRMADO','ARCHIVADO','ANULADO')),
      signed_at TEXT,
      file_path TEXT,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lb_contracts_petition ON lb_contracts(petition_id);

    CREATE TABLE IF NOT EXISTS lb_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'GENERAL',
      amount REAL NOT NULL DEFAULT 0,
      paid_by TEXT,
      receipt_ref TEXT,
      occurred_at TEXT NOT NULL DEFAULT (date('now')),
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lb_expenses_petition ON lb_expenses(petition_id);

    CREATE TABLE IF NOT EXISTS lb_laboral_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL DEFAULT 'ALTA_BAJA' CHECK(movement_type IN ('ALTA','BAJA','ALTA_BAJA','A1','CONTRATO_LABORAL','OTRO')),
      person_name TEXT NOT NULL,
      person_tax_id TEXT,
      start_date TEXT,
      end_date TEXT,
      requires_a1 INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(status IN ('PENDIENTE','PREPARADO','ENVIADO_DELSOL','CONFIRMADO','ERROR','NO_REQUIERE')),
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lb_laboral_petition ON lb_laboral_movements(petition_id);

    CREATE TABLE IF NOT EXISTS lb_liquidations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petition_id INTEGER NOT NULL,
      person_party_id INTEGER,
      gross_amount REAL NOT NULL DEFAULT 0,
      commission_amount REAL NOT NULL DEFAULT 0,
      irpf_amount REAL NOT NULL DEFAULT 0,
      expense_reimbursements REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'BORRADOR' CHECK(status IN ('BORRADOR','PENDIENTE_PAGO','PAGADA','ANULADA')),
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE CASCADE,
      FOREIGN KEY(person_party_id) REFERENCES lb_parties(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_lb_liquidations_petition ON lb_liquidations(petition_id);

    CREATE TABLE IF NOT EXISTS delsol_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ejercicio_default TEXT NOT NULL DEFAULT '2026',
      company_code TEXT,
      company_area TEXT,
      mode TEXT NOT NULL DEFAULT 'mock' CHECK(mode IN ('mock','read_only','live')),
      read_enabled INTEGER NOT NULL DEFAULT 1,
      write_enabled INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      last_read_test_at TEXT,
      last_write_test_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS delsol_sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      petition_id INTEGER,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','synced','error','blocked_permission','skipped')),
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(petition_id) REFERENCES petitions(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_delsol_queue_status ON delsol_sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_delsol_queue_petition ON delsol_sync_queue(petition_id);

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_role TEXT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      petition_id INTEGER,
      before_json TEXT,
      after_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_petition ON audit_log(petition_id);
    CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_log(module);
  `);


  await ensureColumn('lb_internal_invoices', 'extra_fees_amount', `ALTER TABLE lb_internal_invoices ADD COLUMN extra_fees_amount REAL NOT NULL DEFAULT 0`);
  await ensureColumn('lb_internal_invoices', 'extra_fees_reason', `ALTER TABLE lb_internal_invoices ADD COLUMN extra_fees_reason TEXT`);

  await run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('DELSOL_DEFAULT_EJERCICIO', '2026')`);
  await run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('DELSOL_MODE', 'mock')`);
  await run(`INSERT OR IGNORE INTO delsol_connections (name, ejercicio_default, mode, read_enabled, write_enabled, active)
             VALUES ('La Bonita - conexión preparada', '2026', 'mock', 1, 0, 1)`);

}

module.exports = {
  raw,
  run,
  get,
  all,
  exec,
  migrate,
  upgrade,
  transaction,
  tableExists,
  ensureColumn,
  ensureIndex,
};

