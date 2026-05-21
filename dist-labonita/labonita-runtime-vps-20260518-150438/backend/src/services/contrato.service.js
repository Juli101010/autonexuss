/**
 * Contrato PDF service (official document) for FORMACION.
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
function writeKV(doc, k, v) {
  doc.font('Helvetica-Bold').text(`${k}: `, { continued: true });
  doc.font('Helvetica').text(safeText(v));
}

async function generateContratoPdf({ outputPath, petitionId, data }) {
  const payload = data?.payload || data || {};
  const period = payload.period || {};
  const clases = payload.clases || {};
  const inv = payload.invoice || {};
  const lugar = payload.lugar || payload.address || {};

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  brandHeader(doc, 'CONTRATO DE FORMACIÓN', [`Petición #${petitionId}`, `Fecha: ${new Date().toISOString().slice(0,10)}`]);

  doc.fontSize(14).font('Helvetica-Bold').text('Partes y referencia');
  doc.moveDown(0.4);
  writeKV(doc, 'Referencia', payload.reference || payload.referencia || '');
  writeKV(doc, 'Responsable', payload.responsable || payload.responsible || '');

  doc.moveDown(1.0);
  doc.fontSize(14).font('Helvetica-Bold').text('Periodo');
  doc.moveDown(0.4);
  writeKV(doc, 'Inicio', period.start || payload.start_date || '');
  writeKV(doc, 'Fin', period.end || payload.end_date || '');

  doc.moveDown(1.0);
  doc.fontSize(14).font('Helvetica-Bold').text('Clases');
  doc.moveDown(0.4);
  writeKV(doc, 'Tipo', clases.tipo || '');
  writeKV(doc, 'Días/Horario', clases.horario || clases.dias || payload.horario || '');
  writeKV(doc, 'Lugar', [lugar.direccion||lugar.address, lugar.ciudad||lugar.city].filter(Boolean).join(' · '));

  doc.moveDown(1.0);
  doc.fontSize(14).font('Helvetica-Bold').text('Facturación');
  doc.moveDown(0.4);
  writeKV(doc, 'Cuándo factura', payload.cuando_factura || payload.when_invoice || '');
  writeKV(doc, 'Razón social', inv.razon_social || inv.legal_name || '');
  writeKV(doc, 'NIF/VAT', inv.vat || inv.nif || '');

  doc.moveDown(1.5);
  brandFooter(doc, [
  'Documento oficial. Debe ser revisado y firmado según procedimiento interno.',
  'Este PDF puede ser reemplazado por plantilla DelSol al integrar.'
]);
  doc.fillColor('#000');

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateContratoPdf };
