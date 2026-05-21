/**
 * Email service (prepared).
 *
 * By default, the system only creates in-app notifications.
 * When EMAIL_OUTBOX_ENABLED=1, we enqueue an email into email_outbox.
 *
 * A real sender worker (SMTP/API) can be added later without breaking changes.
 */
const db = require('../../config/db');

async function enqueueEmail({ userId, toEmail, templateKey, payload }) {
  if (process.env.EMAIL_OUTBOX_ENABLED !== '1') return { enqueued: false };

  await db.run(
    `INSERT INTO email_outbox (user_id, to_email, template_key, payload_json)
     VALUES (?,?,?,?)`,
    [userId || null, toEmail, templateKey, JSON.stringify(payload || {})]
  );
  return { enqueued: true };
}

module.exports = { enqueueEmail };
