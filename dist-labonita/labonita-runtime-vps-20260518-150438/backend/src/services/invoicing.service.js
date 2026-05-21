/**
 * Invoicing service.
 *
 * Today: manual publishing of invoice documents.
 * Future: call DelSol via DelSolClient and store delsol_invoice_id + sync status.
 */
const db = require('../config/db');
const { DelSolClient } = require('../integrations/delsol/delsol.client');

function clientFromEnv() {
  return new DelSolClient({
    baseUrl: process.env.DELSOL_BASE_URL,
    apiKey: process.env.DELSOL_API_KEY,
  });
}

async function markSyncError(petitionId, err) {
  await db.run(
    `UPDATE petitions SET delsol_sync_status = ?, delsol_sync_error = ?, delsol_last_sync_at = datetime('now') WHERE id = ?`,
    ['ERROR', String(err?.message || err), petitionId]
  );
}

async function prepareInvoiceDraft(_petitionId) {
  const client = clientFromEnv();
  if (!client.isEnabled()) {
    return { enabled: false, message: 'DelSol not enabled' };
  }
  // When enabled: build payload from petition.data and call client.createInvoiceDraft()
  return { enabled: true, message: 'Not implemented' };
}

module.exports = { prepareInvoiceDraft, markSyncError };
