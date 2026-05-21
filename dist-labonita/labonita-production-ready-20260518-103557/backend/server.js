const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { PORT } = require('./src/config/env');
const db = require('./src/config/db');
const { requirePageRole } = require('./src/middlewares/pageAuth');
const { runDailyReminders } = require('./src/modules/notifications/reminder.job');
const { runFridayPayouts } = require('./src/modules/ledger/payouts.job');
const { processPendingQueueInternal } = require('./src/modules/delsol/delsol.controller');

async function start() {
  await db.migrate();
  if (typeof db.upgrade === 'function') await db.upgrade();

  const app = express();

  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
  });

  // Cookie-based auth requires credentials.
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));

  // Basic hardening for local/prod without breaking inline demo-style UI.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const publicDir = path.join(__dirname, 'public');

  // ---- Protected HTML pages (must be BEFORE static) ----
  // Admin
  app.get('/admin.html', requirePageRole('ADMIN'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'admin.html'))
  );
  app.get('/admin-socios.html', requirePageRole('ADMIN'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'admin-socios.html'))
  );
  app.get('/admin-peticiones.html', requirePageRole('ADMIN'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'admin-peticiones.html'))
  );

app.get('/admin-facturacion.html', requirePageRole('ADMIN'), (_req, res) =>
  res.sendFile(path.join(publicDir, 'admin-facturacion.html'))
);
app.get('/admin-billing-outbox.html', requirePageRole('ADMIN'), (_req, res) =>
  res.sendFile(path.join(publicDir, 'admin-billing-outbox.html'))
);

  app.get('/admin-controles.html', requirePageRole('ADMIN'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'admin-controles.html'))
  );

  app.get('/app.html', requirePageRole('ANY'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'app.html'))
  );

  app.get('/labonita-operativo.html', requirePageRole('ADMIN'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'labonita-operativo.html'))
  );

// Billing UI assets/pages (ADMIN-only) must be BEFORE public static
app.use('/billing', requirePageRole('ADMIN'), express.static(path.join(publicDir, 'billing')));


  // Artist
  app.get('/artist-peticiones.html', requirePageRole('ARTIST'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'artist-peticiones.html'))
  );
  app.get('/artist-operativo.html', requirePageRole('ARTIST'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'artist-operativo.html'))
  );
  app.get('/artist.html', requirePageRole('ARTIST'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'artist.html'))
  );
  app.get('/profile.html', requirePageRole('ARTIST'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'profile.html'))
  );
  app.get('/artist-mensajes.html', requirePageRole('ARTIST'), (_req, res) =>
    res.sendFile(path.join(publicDir, 'artist-mensajes.html'))
  );

  // Public assets/pages (login/register + JS/CSS)
  app.use(express.static(publicDir));

  // API
  app.use('/api/auth/login', loginLimiter);
  app.use('/api', require('./src/routes'));

  // ---- Daily reminders (internal notifications) ----
  // Default: every day at 09:00 server time. Override with REMIND_CRON (e.g. "0 9 * * *").
  const remindCron = process.env.REMIND_CRON || '0 9 * * *';
  cron.schedule(remindCron, async () => {
    try {
      const out = await runDailyReminders();
      // eslint-disable-next-line no-console
      console.log('[reminders] ran', out);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[reminders] failed', err);
    }
  });

  // ---- Friday payouts batch (optional) ----
  // Default: every Friday at 10:00 server time. Override with FRIDAY_PAYOUTS_CRON (e.g. "0 10 * * 5").
  const payoutsCron = process.env.FRIDAY_PAYOUTS_CRON || '0 10 * * 5';
  cron.schedule(payoutsCron, async () => {
    try {
      const out = await runFridayPayouts();
      // eslint-disable-next-line no-console
      console.log('[payouts] ran', out);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[payouts] failed', err);
    }
  });

  // ---- DELSOL sync queue (auto retry) ----
  // Default: every 5 minutes. Disable with DELSOL_AUTO_SYNC_ENABLED=0.
  const delsolAutoEnabled = String(process.env.DELSOL_AUTO_SYNC_ENABLED || '1') === '1';
  const delsolSyncCron = process.env.DELSOL_SYNC_CRON || '*/5 * * * *';
  const delsolSyncBatch = Number(process.env.DELSOL_SYNC_BATCH || 10);
  if (delsolAutoEnabled) {
    cron.schedule(delsolSyncCron, async () => {
      try {
        const out = await processPendingQueueInternal(delsolSyncBatch);
        // eslint-disable-next-line no-console
        console.log('[delsol-sync] processed', out.length);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[delsol-sync] failed', err.message);
      }
    });
  }


  // Default
  app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'login.html')));

  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
