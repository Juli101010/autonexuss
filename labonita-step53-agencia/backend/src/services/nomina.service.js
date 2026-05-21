/**
 * Nómina PDF service (official document).
 * Minimal payroll-style summary based on petition data + controls.
 */
const PDFDocument = require('pdfkit');

function brandHeader(doc, title, metaLines=[]) {
  doc.save();
  doc.rect(doc.page.margins.left, 26, doc.page.width - doc.page.margins.left - doc.page.margins.right, 54).fillOpacity(0.06).fill('#000');
  doc.fillOpacity(1);

  // Logo placeholder
  doc.rect(doc.page.margins.left + 12, 34, 44, 44).lineWidth(1).strokeOpacity(0.15).stroke('#000');
  doc.fontSize(9).fillColor('#666').text('LOGO', doc.page.margins.left + 24, 56);

  doc.fillColor('#000').font('Helvetica-Bold').fontSize(16).text(title, doc.page.margins.left + 70, 38);
  doc.font('Helvetica').fontSize(9).fillColor('#444');
  const baseY = 58;
  metaLines.forEach((l, i) => doc.text(String(l), doc.page.margins.left + 70, baseY + i*12));

  doc.restore();
  doc.moveDown(3.2);
}

function brandFooter(doc, lines=[]) {
  const y = doc.page.height - doc.page.margins.bottom - 42;
  doc.save();
  doc.fontSize(8).fillColor('#666');
  lines.forEach((l, i) => doc.text(String(l), doc.page.margins.left, y + i*10, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right }));
  doc.fillColor('#000');
  doc.restore();
}

// BRAND_HEADER
const fs = require('fs');

function safeText(v) { return String(v == null ? '' : v).trim(); }
function eur(v) { const n = Number(v || 0); return `€${n.toFixed(2)}`; }
function writeKV(doc, k, v) {
  doc.font('Helvetica-Bold').text(`${k}: `, { continued: true });
  doc.font('Helvetica').text(safeText(v));
}

async function generateNominaPdf({ outputPath, petitionId, data, totals }) {
  const payload = data?.payload || data || {};
  const period = payload.period || {};
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  brandHeader(doc, 'NÓMINA (Resumen)', [`Petición #${petitionId}`, `Fecha: ${new Date().toISOString().slice(0,10)}`]);

  doc.fontSize(14).font('Helvetica-Bold').text('Datos');
  doc.moveDown(0.4);
  writeKV(doc, 'Referencia', payload.reference || payload.referencia || '');
  writeKV(doc, 'Periodo', [period.start || '', period.end || ''].filter(Boolean).join(' → '));

  doc.moveDown(1.0);
  doc.fontSize(14).font('Helvetica-Bold').text('Totales');
  doc.moveDown(0.4);

  const gross = totals?.gross ?? payload.gross ?? payload.bruto ?? 0;
  const net = totals?.net ?? payload.net ?? payload.liquido ?? 0;
  const expenses = totals?.expensesTotal ?? 0;
  const commissions = totals?.commissionsTotal ?? 0;

  writeKV(doc, 'Bruto', eur(gross));
  writeKV(doc, 'Neto', eur(net));
  writeKV(doc, 'Gastos', eur(expenses));
  writeKV(doc, 'Comisiones', eur(commissions));

  doc.moveDown(1.5);
  brandFooter(doc, [
  'Documento oficial (resumen). Puede ser reemplazado por plantilla DelSol/asesoría cuando se integre.',
  'Revisar importes y deducciones según documentación adjunta.'
]);
  doc.fillColor('#000');

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateNominaPdf };
