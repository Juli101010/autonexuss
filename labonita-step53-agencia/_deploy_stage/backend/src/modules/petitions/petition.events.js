const db = require('../../config/db');

async function logPetitionEvent({
  petitionId,
  actorUserId = null,
  actorRole = null,
  eventType,
  fromStatus = null,
  toStatus = null,
  payload = null,
}) {
  const payloadStr = payload ? JSON.stringify(payload) : null;
  await db.run(
    `INSERT INTO petition_events (petition_id, actor_user_id, actor_role, event_type, from_status, to_status, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [petitionId, actorUserId, actorRole, eventType, fromStatus, toStatus, payloadStr]
  );
}

async function listPetitionTimeline(petitionId) {
  return db.all(
    `SELECT id, petition_id, actor_user_id, actor_role, event_type, from_status, to_status, payload, created_at
     FROM petition_events
     WHERE petition_id = ?
     ORDER BY datetime(created_at) ASC, id ASC`,
    [petitionId]
  );
}

module.exports = { logPetitionEvent, listPetitionTimeline };
