const svc = require('./billingOutbox.service');

exports.list = async (_req, res) => {
  try {
    const items = await svc.listOutbox();
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};

exports.processPending = async (req, res) => {
  try {
    const limit = Number(req.body?.limit || 20);
    const results = await svc.processPending(limit);
    return res.json({ ok: true, results });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Process error' });
  }
};

exports.processOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const out = await svc.processOne(id);
    return res.json({ ok: true, ...out });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Process error' });
  }
};
