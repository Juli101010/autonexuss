const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const authMiddleware = require('./modules/auth/auth.middleware');
const requireUser = authMiddleware(); // any logged-in
const requireAdmin = authMiddleware('ADMIN');
const requireArtist = authMiddleware('ARTIST');

const authCtrl = require('./modules/auth/auth.controller');
const petitionCtrl = require('./modules/petitions/petitions.controller');
const adminCtrl = require('./modules/admin/admin.controller');
const notifCtrl = require('./modules/notifications/notifications.controller');
const controlsCtrl = require('./modules/controls/controls.controller');
const ledgerCtrl = require('./modules/ledger/ledger.controller');
const mapCtrl = require('./modules/map/map.controller');
const messagesCtrl = require('./modules/messages/messages.controller');
const groupsCtrl = require('./modules/groups/groups.controller');
const profileCtrl = require('./modules/profile/profile.controller');
const docsCtrl = require('./modules/documents/documents.controller');
const invoicesCtrl = require('./modules/invoices/invoices.controller');
const msgCtrl = require('./modules/messages/messages.controller');
const billingProxy = require('./modules/billing/billing.proxy');
const billingOutboxCtrl = require('./modules/billing/billingOutbox.controller');
const opsCtrl = require('./modules/operations/operations.controller');
const delsolCtrl = require('./modules/delsol/delsol.controller');



/* ================= OPERATIVO 2026 (USUARIO / ARTISTA) ================= */
router.get('/ops/templates', requireArtist, opsCtrl.templates);
router.get('/ops/my/petitions', requireArtist, opsCtrl.listMine);
router.post('/ops/my/petitions', requireArtist, opsCtrl.createMine);
router.get('/ops/my/petitions/:id', requireArtist, opsCtrl.detailMine);
router.put('/ops/my/petitions/:id', requireArtist, opsCtrl.updateMine);
router.post('/ops/my/petitions/:id/submit', requireArtist, opsCtrl.submitMine);
router.get('/ops/my/petitions/:id/filled-form.pdf', requireArtist, opsCtrl.downloadFilledFormMine);

/* ================= OPERATIVO 2026 (ADMIN) ================= */
router.get('/admin/ops/summary', requireAdmin, opsCtrl.summary);
router.get('/admin/ops/petitions', requireAdmin, opsCtrl.listPetitions);
router.post('/admin/ops/petitions', requireAdmin, opsCtrl.createPetition);
router.get('/admin/ops/petitions/:id', requireAdmin, opsCtrl.detail);
router.get('/admin/ops/petitions/:id/filled-form.pdf', requireAdmin, opsCtrl.downloadFilledFormAdmin);
router.post('/admin/ops/petitions/:id/request-info', requireAdmin, opsCtrl.requestInfo);
router.post('/admin/ops/petitions/:id/reject', requireAdmin, opsCtrl.rejectPetition);
router.put('/admin/ops/petitions/:id', requireAdmin, opsCtrl.updatePetition);
router.post('/admin/ops/petitions/:id/validate', requireAdmin, opsCtrl.validatePetition);
router.post('/admin/ops/petitions/:id/laboral', requireAdmin, opsCtrl.createLaboralMovement);
router.post('/admin/ops/petitions/:id/invoices', requireAdmin, opsCtrl.createInvoice);
router.post('/admin/ops/petitions/:id/contracts', requireAdmin, opsCtrl.createContract);
router.post('/admin/ops/petitions/:id/expenses', requireAdmin, opsCtrl.addExpense);
router.post('/admin/ops/petitions/:id/liquidations', requireAdmin, opsCtrl.createLiquidation);
router.post('/admin/ops/petitions/:id/close-zero', requireAdmin, opsCtrl.closeIfZero);
router.get('/admin/ops/export/control-total.csv', requireAdmin, opsCtrl.exportCsv);
router.get('/admin/ops/export/altas-bajas.csv', requireAdmin, opsCtrl.exportAltasBajasCsv);
router.get('/admin/ops/export/gastos.csv', requireAdmin, opsCtrl.exportGastosCsv);
router.get('/admin/ops/export/liquidaciones.csv', requireAdmin, opsCtrl.exportLiquidacionesCsv);

/* ================= DELSOL PREPARED SYNC (ADMIN) ================= */
router.get('/admin/delsol/status', requireAdmin, delsolCtrl.status);
router.post('/admin/delsol/test-read', requireAdmin, delsolCtrl.testRead);
router.post('/admin/delsol/test-write', requireAdmin, delsolCtrl.testWrite);
router.get('/admin/delsol/queue', requireAdmin, delsolCtrl.queue);
router.post('/admin/delsol/queue/process', requireAdmin, delsolCtrl.processPending);
router.post('/admin/delsol/queue/:id/process', requireAdmin, delsolCtrl.processOne);

/* ================= AUTH ================= */
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', requireUser, authCtrl.me);

/* ================= PROFILE (ARTIST) ================= */
router.get('/profile/me', requireArtist, profileCtrl.getMe);
router.put('/profile/me', requireArtist, profileCtrl.upsertMe);

/* ================= PETITIONS (ARTIST) ================= */
router.get('/petition-types', requireArtist, petitionCtrl.listTypes);
router.post('/petitions', requireArtist, petitionCtrl.create);
router.get('/petitions', requireArtist, petitionCtrl.listByUser);
router.get('/petitions/schema', requireArtist, petitionCtrl.getSchema);
router.get('/petitions/:id', requireArtist, petitionCtrl.getMine);
router.put('/petitions/:id', requireArtist, petitionCtrl.update);
router.get('/petitions/:id/checklist', requireArtist, petitionCtrl.checklistMine);
router.put('/petitions/:id/send', requireArtist, petitionCtrl.send);

/* ================= PETITION DOCS (ARTIST) ================= */
router.post('/petitions/:id/documents', requireArtist, upload.single('file'), docsCtrl.uploadForPetition);
router.get('/petitions/:id/documents', requireArtist, docsCtrl.listForPetition);
router.get('/documents/:docId/download', requireUser, docsCtrl.download);

/* ================= MESSAGES (THREAD PER PETITION) ================= */
router.get('/petitions/:id/messages', requireUser, msgCtrl.listThread);
router.post('/petitions/:id/messages', requireUser, msgCtrl.sendMessage);

router.put('/petitions/:id/messages/read', requireUser, msgCtrl.markPetitionMessagesRead);
router.get('/messages/threads', requireUser, msgCtrl.listThreads);
router.get('/announcements', requireUser, msgCtrl.listAnnouncements);
router.post('/admin/announcements', requireAdmin, msgCtrl.createAnnouncement);


/* ================= ADMIN ================= */
router.get('/admin/petitions', requireAdmin, adminCtrl.listPetitions);
router.get('/admin/petitions/:id/checklist', requireAdmin, adminCtrl.getPetitionChecklist);
router.get('/admin/petitions/:id/schema', requireAdmin, adminCtrl.getPetitionSchema);
router.get('/admin/invoices', requireAdmin, invoicesCtrl.listInvoices);
router.post('/admin/petitions/:id/reconcile-invoice', requireAdmin, invoicesCtrl.reconcileInvoice);
router.get('/admin/petitions/:id/documents', requireAdmin, adminCtrl.listPetitionDocuments);
router.post('/admin/petitions/:id/documents', requireAdmin, upload.single('file'), docsCtrl.uploadOfficialForPetition);
router.post('/admin/petitions/:id/emit-presupuesto', requireAdmin, docsCtrl.emitPresupuestoPdf);
router.post('/admin/petitions/:id/emit/:kind', requireAdmin, docsCtrl.emitOfficialPdf);
router.get('/admin/petitions/:id/timeline', requireAdmin, adminCtrl.getPetitionTimeline);
router.put('/admin/petitions/:id/status', requireAdmin, adminCtrl.updatePetitionStatus);
router.post('/admin/petitions/:id/assign', requireAdmin, adminCtrl.assignPetition);
router.get('/admin/users/search', requireAdmin, adminCtrl.searchUsers);
router.post('/admin/petitions/:id/convert-budget-to-alta', requireAdmin, petitionCtrl.convertBudgetToAltaFactura);

router.put('/admin/petitions/:id/request-info', requireAdmin, adminCtrl.requestMoreInfo);
router.put('/admin/petitions/:id/approve', requireAdmin, adminCtrl.approvePetition);
router.put('/admin/petitions/:id/reject', requireAdmin, adminCtrl.rejectPetition);
router.post('/admin/petitions/:id/remind', requireAdmin, adminCtrl.remindPetition);

router.get('/admin/socios', requireAdmin, adminCtrl.listSocios);
router.get('/admin/no-socios', requireAdmin, adminCtrl.listNoSocios);
router.put('/admin/socios/:id/deactivate', requireAdmin, adminCtrl.deactivateSocio);

router.get('/admin/memberships', requireAdmin, adminCtrl.listMemberships);
router.put('/admin/memberships/:userId', requireAdmin, adminCtrl.updateMembership);

/* ================= BILLING PROXY (ADMIN) ================= */
router.use('/admin/billing', requireAdmin, billingProxy);

/* ================= BILLING OUTBOX (ADMIN) ================= */
router.get('/admin/billing-outbox', requireAdmin, billingOutboxCtrl.list);
router.post('/admin/billing-outbox/process', requireAdmin, billingOutboxCtrl.processPending);
router.post('/admin/billing-outbox/:id/process', requireAdmin, billingOutboxCtrl.processOne);


/* ================= CONTROLS (ADMIN) ================= */
router.get('/admin/controls/monthly-payroll', requireAdmin, controlsCtrl.monthlyPayroll);
router.get('/admin/controls/gastos', requireAdmin, controlsCtrl.gastos);
router.get('/admin/controls/puntuales', requireAdmin, controlsCtrl.puntuales);
router.get('/admin/controls/control-total', requireAdmin, controlsCtrl.controlTotal);
router.get('/admin/controls/commissions', requireAdmin, controlsCtrl.commissions);
router.post('/admin/controls/commissions', requireAdmin, controlsCtrl.createCommission);
router.get('/admin/controls/ledger', requireAdmin, controlsCtrl.ledger);
router.get('/admin/controls/ss-diario', requireAdmin, controlsCtrl.ssDiario);

/* ================= MAP (ADMIN) ================= */
router.get('/admin/map/summary', requireAdmin, mapCtrl.summary);

/* ================= LEDGER (ADMIN) ================= */
router.get('/admin/ledger', requireAdmin, ledgerCtrl.list);
router.post('/admin/ledger', requireAdmin, ledgerCtrl.create);
router.delete('/admin/ledger/:id', requireAdmin, ledgerCtrl.remove);
router.get('/admin/payout-proposals', requireAdmin, ledgerCtrl.listProposals);
router.post('/admin/payout-proposals/:id/approve', requireAdmin, ledgerCtrl.approveProposal);
router.post('/admin/payout-proposals/:id/reject', requireAdmin, ledgerCtrl.rejectProposal);

/* ================= NOTIFICATIONS ================= ================= */
router.get('/notifications', requireUser, notifCtrl.list);
router.put('/notifications/:id/read', requireUser, notifCtrl.markRead);
router.post('/notifications/remind', requireArtist, notifCtrl.remind);

module.exports = router;
