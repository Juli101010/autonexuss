const express = require('express');

const router = express.Router();

function baseUrl() {
  const base = String(process.env.BILLING_BASE_URL || '').trim();
  if (!base) throw new Error('BILLING_BASE_URL missing');
  return base.replace(/\/+$/, '');
}

router.use(async (req, res) => {
  const key = String(process.env.BILLING_INTERNAL_KEY || '').trim();
  if (!key) return res.status(500).json({ error: 'BILLING_INTERNAL_KEY missing' });

  const upstream = `${baseUrl()}/api${req.originalUrl.replace(/^\/api\/admin\/billing/, '')}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Internal-Key': key,
  };

  const init = {
    method: req.method,
    headers,
    body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
  };

  let up;
  try {
    up = await fetch(upstream, init);
  } catch {
    return res.status(502).json({ error: 'Billing service unavailable' });
  }

  res.status(up.status);
  const ct = up.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const txt = await up.text();
    return res.send(txt);
  }
  const buf = Buffer.from(await up.arrayBuffer());
  res.setHeader('content-type', ct || 'application/octet-stream');
  return res.send(buf);
});

module.exports = router;
