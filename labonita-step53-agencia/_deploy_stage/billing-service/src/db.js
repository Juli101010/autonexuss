const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

let db;

function dbPath() {
  return process.env.DB_PATH || path.join(process.cwd(), 'billing.sqlite');
}

async function ensureColumn(table, column, ddl) {
  try {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  } catch (e) {
    const msg = String(e?.message || '').toLowerCase();
    if (!msg.includes('duplicate') && !msg.includes('exists')) {
      if (!msg.includes('duplicate column')) throw e;
    }
  }
}

async function initDb() {
  if (db) return db;

  const filename = dbPath();
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = await open({ filename, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tax_id TEXT,
      vat_id TEXT,
      country_code TEXT NOT NULL DEFAULT 'ES',
      address TEXT,
      city TEXT,
      postal TEXT,
      email TEXT,
      vies_valid INTEGER NOT NULL DEFAULT 0,
      vies_checked_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      stage_name TEXT,
      tax_id TEXT,
      email TEXT,
      phone TEXT,
      country_code TEXT NOT NULL DEFAULT 'ES',
      address TEXT,
      city TEXT,
      postal TEXT,
      iban TEXT,
      is_member INTEGER NOT NULL DEFAULT 0,
      default_irpf_rate REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      year INTEGER NOT NULL,
      next_number INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      UNIQUE(code, year)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'INVOICE', -- INVOICE | CREDIT_NOTE
      origin TEXT,
      series_code TEXT NOT NULL,
      year INTEGER NOT NULL,
      number INTEGER,
      legal_number TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT|PENDING_REVIEW|ISSUED|SENT|PAID|VOID
      issue_date TEXT,
      service_date_from TEXT,
      service_date_to TEXT,
      due_date TEXT,
      currency TEXT NOT NULL DEFAULT 'EUR',
      notes TEXT,
      customer_id INTEGER,
      customer_snapshot TEXT NOT NULL,
      issuer_snapshot TEXT NOT NULL,
      tax_context_snapshot TEXT NOT NULL,
      totals_snapshot TEXT NOT NULL,
      commission_rate REAL NOT NULL DEFAULT 0,
      expenses_to_artist INTEGER NOT NULL DEFAULT 1,
      locked_at TEXT,
      locked_by_user_id INTEGER,
      hash TEXT,
      related_invoice_id INTEGER,
      last_reminder_at TEXT,
      reminder_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY(locked_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(related_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      kind TEXT NOT NULL DEFAULT 'SERVICE', -- SERVICE|EXPENSE|OTHER
      description TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      vat_rate REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoice_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      artist_id INTEGER NOT NULL,
      share_percent REAL NOT NULL,
      irpf_rate REAL NOT NULL,
      gross_amount REAL NOT NULL DEFAULT 0,
      withholding_amount REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(invoice_id, artist_id),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      artist_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL DEFAULT 'TRANSFER',
      reference TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      method TEXT NOT NULL DEFAULT 'TRANSFER',
      amount REAL NOT NULL,
      reference TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoice_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT,
      actor_user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS email_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|SENT|FAILED
      related_invoice_id INTEGER,
      last_error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      sent_at TEXT,
      FOREIGN KEY(related_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, -- INVOICE|PAYMENT|CUSTOMER
      entity_id INTEGER NOT NULL,
      operation TEXT NOT NULL DEFAULT 'UPSERT',
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|PROCESSING|SYNCED|FAILED
      tries INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_system TEXT NOT NULL DEFAULT 'DELSOL',
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      external_id TEXT,
      external_number TEXT,
      synced_at TEXT,
      last_seen_hash TEXT,
      UNIQUE(external_system, entity_type, entity_id)
    );
  `);

  await ensureColumn('invoices', 'commission_rate', 'REAL NOT NULL DEFAULT 0');
  await ensureColumn('invoices', 'expenses_to_artist', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('invoices', 'last_reminder_at', 'TEXT');
  await ensureColumn('invoices', 'reminder_count', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('invoice_lines', 'kind', "TEXT NOT NULL DEFAULT 'SERVICE'");

  const code = String(process.env.DEFAULT_SERIES || 'A').trim() || 'A';
  const year = new Date().getFullYear();
  await db.run(
    `INSERT OR IGNORE INTO invoice_series (code, year, next_number, active) VALUES (?, ?, 1, 1)`,
    [code, year]
  );

  return db;
}

function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

module.exports = { initDb, getDb };
