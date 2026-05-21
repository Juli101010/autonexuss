require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDb, getDb } = require('../src/db');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const password = String(process.argv[3] || '').trim();

  if (!email || !password) {
    console.error('Usage: npm run bootstrap-admin -- <email> <password>');
    process.exit(1);
  }

  await initDb();
  const db = getDb();

  const exists = await db.get(`SELECT id FROM users WHERE email=?`, [email]);
  if (exists) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 12);
  await db.run(`INSERT INTO users (email,password_hash,role) VALUES (?,?, 'ADMIN')`, [email, hash]);
  console.log('Admin created:', email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
