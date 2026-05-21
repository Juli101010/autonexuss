/**
 * Internal messaging:
 * - Petition thread messages: admin <-> petition owner
 * - Admin announcements: broadcast to users or segments
 *
 * NOTE: This is "internal inbox" (notifications table) + persistent message thread table.
 */
const db = require('../../config/db');

function assertRole(user, role) {
  if (!user || user.role !== role) {
    const e = new Error('Forbidden');
    e.status = 403;
    throw e;
  }
}

async function canAccessPetition(user, petitionId) {
  if (user.role === 'ADMIN') return true;
  const p = await db.get(`SELECT id, user_id FROM petitions WHERE id = ?`, [petitionId]);
  return p && p.user_id === user.id;
}

exports.listPetitionMessages = async (req, res) => {
  const petitionId = Number(req.params.id);
  if (!petitionId) return res.status(400).json({ error: 'invalid petition id' });

  const ok = await canAccessPetition(req.user, petitionId);
  if (!ok) return res.status(403).json({ error: 'Forbidden' });

  const rows = await db.all(
    `SELECT m.id, m.petition_id, m.from_user_id, m.from_role, m.to_user_id, m.body, m.kind, m.created_at,
            CASE WHEN r.read_at IS NULL THEN 0 ELSE 1 END AS is_read
     FROM petition_messages m
     LEFT JOIN petition_message_reads r ON r.message_id = m.id AND r.user_id = ?
     WHERE m.petition_id = ?
     ORDER BY id ASC`,
    [req.user.id, petitionId]
  );
  return res.json({ rows });
};

exports.postPetitionMessage = async (req, res) => {
  const petitionId = Number(req.params.id);
  const body = String(req.body?.body || '').trim();
  const kind = String(req.body?.kind || 'CHAT').toUpperCase();
  if (!petitionId) return res.status(400).json({ error: 'invalid petition id' });
  if (!body) return res.status(400).json({ error: 'body requerido' });

  const ok = await canAccessPetition(req.user, petitionId);
  if (!ok) return res.status(403).json({ error: 'Forbidden' });

  const petition = await db.get(`SELECT id, user_id FROM petitions WHERE id = ?`, [petitionId]);
  if (!petition) return res.status(404).json({ error: 'Petición no encontrada' });

  let toUserId = null;
  if (req.user.role === 'ADMIN') {
    toUserId = petition.user_id;
  }

  await db.run(
    `INSERT INTO petition_messages (petition_id, from_user_id, from_role, to_user_id, body, kind)
     VALUES (?,?,?,?,?,?)`,
    [petitionId, req.user.id, req.user.role, toUserId, body, (kind === 'AVISO' ? 'AVISO' : 'CHAT')]
  );

  // Create notification for recipient
  if (toUserId) {
    await db.run(
      `INSERT INTO notifications (user_id, message, dedupe_key, notif_type, severity, meta_json) VALUES (?,?,?,?,?,?)`,
      [toUserId, `[Petición #${petitionId}] ${body}`.slice(0, 500), `msg:${petitionId}:${Date.now()}`, 'PETITION_MESSAGE', kind === 'AVISO' ? 'WARN' : 'INFO', JSON.stringify({ petition_id: petitionId, route: 'peticiones' })]
    );
  } else if (req.user.role !== 'ADMIN') {
    // message from artist to admin: notify all admins
    const admins = await db.all(`SELECT id FROM users WHERE role = 'ADMIN'`);
    for (const a of admins) {
      await db.run(
        `INSERT INTO notifications (user_id, message, dedupe_key, notif_type, severity, meta_json) VALUES (?,?,?,?,?,?)`,
        [a.id, `[Petición #${petitionId}] ${body}`.slice(0, 500), `msg:${petitionId}:${a.id}:${Date.now()}`, 'PETITION_MESSAGE', kind === 'AVISO' ? 'WARN' : 'INFO', JSON.stringify({ petition_id: petitionId, route: 'peticiones' })]
      );
    }
  }

  return res.json({ ok: true });
};

exports.createAnnouncement = async (req, res) => {
  assertRole(req.user, 'ADMIN');

  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  const scope = String(req.body?.scope || '').toUpperCase();
  const scope_value = req.body?.scope_value == null ? null : String(req.body.scope_value);

  if (!title || !body) return res.status(400).json({ error: 'title/body requeridos' });
  if (!['ALL','ARTISTS','ADMIN','USER','PETITION_TYPE','GROUP'].includes(scope)) return res.status(400).json({ error: 'scope inválido' });

  const r = await db.run(
    `INSERT INTO announcements (created_by_user_id, title, body, scope, scope_value)
     VALUES (?,?,?,?,?)`,
    [req.user.id, title, body, scope, scope_value]
  );

  let users = [];
  if (scope === 'ALL') users = await db.all(`SELECT id FROM users`);
  if (scope === 'ARTISTS') users = await db.all(`SELECT id FROM users WHERE role = 'ARTIST'`);
  if (scope === 'ADMIN') users = await db.all(`SELECT id FROM users WHERE role = 'ADMIN'`);
  if (scope === 'USER') users = await db.all(`SELECT id FROM users WHERE id = ?`, [Number(scope_value)]);
  if (scope === 'GROUP') {
    users = await db.all(`SELECT user_id AS id FROM user_group_members WHERE group_id = ?`, [Number(scope_value)]);
  }
  if (scope === 'PETITION_TYPE') {
    // users who have petitions of that type
    users = await db.all(`SELECT DISTINCT user_id AS id FROM petitions WHERE type = ?`, [scope_value]);
  }

  for (const u of users) {
    await db.run(
      `INSERT INTO notifications (user_id, message, dedupe_key, notif_type, severity, meta_json) VALUES (?,?,?,?,?,?)`,
      [u.id, `[AVISO] ${title}: ${body}`.slice(0, 500), `ann:${r.lastID}:u:${u.id}`, 'ANNOUNCEMENT', 'INFO', JSON.stringify({ announcement_id: r.lastID, route: 'avisos' })]
    );
  }

  return res.json({ ok: true, id: r.lastID, recipients: users.length });
};

exports.listAnnouncements = async (req, res) => {
  // Everyone can list (admin created). Filtering is via notifications; announcements list is global.
  const rows = await db.all(
    `SELECT id, title, body, scope, scope_value, created_at
     FROM announcements
     ORDER BY id DESC
     LIMIT 100`
  );
  return res.json({ rows });
};


exports.markPetitionMessagesRead = async (req, res) => {
  const petitionId = Number(req.params.id);
  if (!petitionId) return res.status(400).json({ error: 'invalid petition id' });

  const ok = await canAccessPetition(req.user, petitionId);
  if (!ok) return res.status(403).json({ error: 'Forbidden' });

  const ids = await db.all(`SELECT id FROM petition_messages WHERE petition_id = ?`, [petitionId]);
  for (const r of ids) {
    try {
      await db.run(
        `INSERT INTO petition_message_reads (message_id, user_id) VALUES (?,?)`,
        [r.id, req.user.id]
      );
    } catch {}
  }
  return res.json({ ok: true });
};

exports.listThreads = async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const where = isAdmin ? '' : 'WHERE p.user_id = ?';
  const args = isAdmin ? [] : [req.user.id];

  const rows = await db.all(
    `SELECT p.id AS petition_id, p.type, p.status,
            (SELECT body FROM petition_messages m WHERE m.petition_id = p.id ORDER BY m.id DESC LIMIT 1) AS last_body,
            (SELECT created_at FROM petition_messages m WHERE m.petition_id = p.id ORDER BY m.id DESC LIMIT 1) AS last_at,
            (SELECT COUNT(1)
               FROM petition_messages m
               LEFT JOIN petition_message_reads r ON r.message_id = m.id AND r.user_id = ?
              WHERE m.petition_id = p.id AND r.read_at IS NULL) AS unread_count
     FROM petitions p
     ${where}
     ORDER BY COALESCE(last_at, p.created_at) DESC
     LIMIT 200`,
    [req.user.id, ...args]
  );

  return res.json({ rows });
};


// Backwards-compatible aliases (routes.js expects these names)
exports.listThread = exports.listPetitionMessages;
exports.sendMessage = exports.postPetitionMessage;
