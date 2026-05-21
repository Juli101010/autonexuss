const bcrypt = require('bcrypt');
const db = require('../../config/db');
const { BACKUP_FILENAME, backupPath, createBackup, statBackup } = require('./backups.service');

exports.createManual = async (req, res) => {
  try {
    const backup = await createBackup({ actorUserId: req.user?.id || null, reason: 'manual' });
    res.status(201).json(backup);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'No se pudo crear el backup' });
  }
};

exports.download = async (req, res) => {
  try {
    const password = String(req.body?.password || '');
    if (!password) return res.status(400).json({ error: 'La contraseña admin es obligatoria' });

    const user = await db.get(`SELECT id, password, role FROM users WHERE id = ?`, [req.user?.id]);
    if (!user || String(user.role || '').toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Contraseña inválida' });
    }

    const backup = await statBackup();
    if (!backup.exists) return res.status(404).json({ error: 'No hay backup disponible' });

    await db.run(
      `INSERT INTO audit_log (user_id, user_role, module, action, entity_type, entity_id, after_json)
       VALUES (?, 'ADMIN', 'backups', 'download_backup', 'backup', NULL, ?)`,
      [req.user.id, JSON.stringify({ filename: BACKUP_FILENAME })]
    ).catch(() => {});

    res.download(backupPath(), BACKUP_FILENAME);
  } catch (err) {
    if (res.headersSent) return;
    res.status(500).json({ error: err.message || 'No se pudo descargar el backup' });
  }
};
