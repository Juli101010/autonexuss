const bcrypt = require('bcrypt');
const db = require('../src/config/db');

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npm run bootstrap-admin -- <email> <password>');
    process.exit(1);
  }

  await db.migrate();

  const exists = await db.get(`SELECT id FROM users WHERE email = ?`, [email]);
  if (exists) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hash = bcrypt.hashSync(password, 12);

  await db.run(
    `INSERT INTO users (email, password, role, created_at, updated_at)
     VALUES (?, ?, 'ADMIN', datetime('now'), datetime('now'))`,
    [email, hash]
  );

  console.log('Admin created:', email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
