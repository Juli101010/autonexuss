/**
 * Bootstrap demo users and minimal operational data for local approval.
 * Safe to run multiple times.
 */
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

async function upsertUser(email, password, role) {
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  const hash = await bcrypt.hash(password, 12);
  if (existing) {
    await db.run('UPDATE users SET password = ?, role = ? WHERE id = ?', [hash, role, existing.id]);
    return existing.id;
  }
  const r = await db.run('INSERT INTO users (email, password, role) VALUES (?,?,?)', [email, hash, role]);
  return r.lastID;
}

async function seedOperationalDemo(adminId) {
  const count = await db.get(`SELECT COUNT(*) AS n FROM petitions`);
  if (Number(count?.n || 0) > 0) return;

  const data = {
    type: 'ALTA_FACTURA',
    form_template: 'ALTA_FACTURA',
    form_version: 'step51-demo',
    petition_date: '2026-05-01',
    responsible_name: 'Compañía Demo',
    company_show: 'Compañía Demo - espectáculo de prueba',
    reference: 'Demo Operativo La Bonita 2026',
    pais_ciudad_actuacion: 'Barcelona, España',
    fecha_inicio_actuacion: '2026-05-15',
    fecha_fin_actuacion: '2026-05-16',
    requiere_a1: 'NO',
    client_name: 'Festival Demo S.L.',
    client_tax_id: 'B12345678',
    client_email: 'demo@festival.test',
    factura_direccion: 'Carrer Demo 123',
    factura_cp: '08019',
    factura_ciudad: 'Barcelona',
    factura_provincia: 'Barcelona',
    factura_pais: 'España',
    factura_concepto: 'Actuación artística para probar Mapa de Peticiones, facturación interna y cola DELSOL.',
    factura_total_sin_iva: 2500,
    iva_tipo: 'EXENTO FORMACION',
    artist_name: 'Compañía Demo',
    artist_tax_id: '00000000T',
    service_date: '2026-05-15',
    project_place: 'Barcelona',
    description: 'Actuación artística para probar Mapa de Peticiones, facturación interna y cola DELSOL.',
    total_presupuestado: 2500,
    validation: { complete: true, missing: [], status: 'PENDIENTE_VALIDACION' },
    source: 'BOOTSTRAP_DEMO',
  };

  const r = await db.run(
    `INSERT INTO petitions (user_id, type, data, status, created_at, updated_at)
     VALUES (?,?,?,?,datetime('now'),datetime('now'))`,
    [adminId, 'ALTA_FACTURA', JSON.stringify(data), 'PENDIENTE_VALIDACION']
  );

  await db.run(
    `INSERT INTO petition_events (petition_id, actor_user_id, actor_role, event_type, to_status, payload)
     VALUES (?,?,?,?,?,?)`,
    [r.lastID, adminId, 'ADMIN', 'BOOTSTRAP_DEMO', 'PENDIENTE_VALIDACION', JSON.stringify({ reference: data.reference })]
  );
}

(async () => {
  await db.migrate();
  if (typeof db.upgrade === 'function') await db.upgrade();
  await upsertUser('artist@test.com', '123456', 'ARTIST');
  const adminId = await upsertUser('admin@test.com', '123456', 'ADMIN');
  await seedOperationalDemo(adminId);

  console.log('\n✅ Demo listo:');
  console.log('ARTIST  -> artist@test.com / 123456');
  console.log('ADMIN   -> admin@test.com  / 123456');
  console.log('Panel general:       http://localhost:' + (process.env.PORT || 3001) + '/app.html');
  console.log('Operativo 2026:      http://localhost:' + (process.env.PORT || 3001) + '/labonita-operativo.html');
  console.log('Login:               http://localhost:' + (process.env.PORT || 3001) + '/login.html\n');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
