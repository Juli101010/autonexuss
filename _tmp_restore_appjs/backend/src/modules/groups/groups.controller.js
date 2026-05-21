/**
 * Admin user groups (segments) used for announcements targeting.
 */
const db = require('../../config/db');

exports.list = async (_req, res) => {
  const rows = await db.all(`SELECT id, name, description, created_at FROM user_groups ORDER BY name ASC`);
  return res.json({ rows });
};

exports.create = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const description = req.body?.description == null ? null : String(req.body.description);
  if (!name) return res.status(400).json({ error: 'name requerido' });
  try {
    const r = await db.run(`INSERT INTO user_groups (name, description) VALUES (?,?)`, [name, description]);
    return res.json({ ok: true, id: r.lastID });
  } catch (e) {
    return res.status(409).json({ error: 'grupo ya existe' });
  }
};

exports.members = async (req, res) => {
  const groupId = Number(req.params.id);
  if (!groupId) return res.status(400).json({ error: 'invalid group id' });
  const rows = await db.all(
    `SELECT u.id, u.email, u.role
     FROM user_group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ?
     ORDER BY u.email ASC`,
    [groupId]
  );
  return res.json({ rows });
};

exports.addMember = async (req, res) => {
  const groupId = Number(req.params.id);
  const userId = Number(req.body?.user_id);
  if (!groupId || !userId) return res.status(400).json({ error: 'group_id/user_id requeridos' });
  try {
    await db.run(`INSERT INTO user_group_members (group_id, user_id) VALUES (?,?)`, [groupId, userId]);
  } catch {}
  return res.json({ ok: true });
};

exports.removeMember = async (req, res) => {
  const groupId = Number(req.params.id);
  const userId = Number(req.params.userId);
  if (!groupId || !userId) return res.status(400).json({ error: 'invalid ids' });
  await db.run(`DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?`, [groupId, userId]);
  return res.json({ ok: true });
};
