const fs = require('fs/promises');
const path = require('path');
const db = require('../../config/db');

const BACKUP_FILENAME = 'labonita-backup.sqlite';
let backupInProgress = false;

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function backendRoot() {
  return path.resolve(__dirname, '../../..');
}

function backupDir() {
  const configured = String(process.env.BACKUP_DIR || 'backups').trim() || 'backups';
  const root = backendRoot();
  const resolved = path.resolve(root, configured);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return path.join(root, 'backups');
  }
  return resolved;
}

function backupPath() {
  return path.join(backupDir(), BACKUP_FILENAME);
}

async function statBackup() {
  const file = backupPath();
  try {
    const stat = await fs.stat(file);
    return {
      exists: true,
      filename: BACKUP_FILENAME,
      size_bytes: stat.size,
      created_at: stat.mtime.toISOString(),
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { exists: false, filename: BACKUP_FILENAME };
    }
    throw err;
  }
}

async function createBackup({ actorUserId = null, reason = 'manual' } = {}) {
  if (backupInProgress) {
    const err = new Error('Ya hay un backup en curso');
    err.statusCode = 409;
    throw err;
  }

  backupInProgress = true;
  const dir = backupDir();
  const finalPath = backupPath();
  const tmpPath = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);

  try {
    await fs.mkdir(dir, { recursive: true });
    await db.exec(`VACUUM INTO ${sqlString(tmpPath.split(path.sep).join('/'))}`);
    await fs.rename(tmpPath, finalPath);
    const stat = await fs.stat(finalPath);

    await db.run(
      `INSERT INTO audit_log (user_id, user_role, module, action, entity_type, entity_id, after_json)
       VALUES (?, 'ADMIN', 'backups', 'create_backup', 'backup', NULL, ?)`,
      [actorUserId, JSON.stringify({ reason, filename: BACKUP_FILENAME, size_bytes: stat.size })]
    ).catch(() => {});

    return {
      ok: true,
      filename: BACKUP_FILENAME,
      size_bytes: stat.size,
      created_at: stat.mtime.toISOString(),
    };
  } catch (err) {
    await fs.rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  } finally {
    backupInProgress = false;
  }
}

module.exports = {
  BACKUP_FILENAME,
  backupPath,
  createBackup,
  statBackup,
};
