/**
 * Factura PDF service (official document).
 * Minimal PDF template using pdfkit; can be replaced later by richer branding.
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

async function generateFacturaPdf({ outputPath, petitionId, data }) {
  const payload = data?.payload || data || {};
  const inv = payload.invoice || {};
  const company = payload.company || {};
  const show = payload.show || {};
  const dates = payload.event || payload.dates || {};

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  brandHeader(doc, 'FACTURA', [`Petición #${petitionId}`, `Fecha: ${new Date().toISOString().slice(0,10)}`]);

  doc.fontSize(14).font('Helvetica-Bold').text('Datos del documento');
  doc.moveDown(0.4);
  const invn = inv.number || inv.invoice_number || '';
  doc.font('Helvetica-Bold').text('Número: ', { continued: true });
  doc.font('Helvetica').text(invn ? safeText(invn) : '(Pendiente conciliación DelSol)');
  doc.font('Helvetica-Bold').text('Serie: ', { continued: true });
  doc.font('Helvetica').text(safeText(inv.series || inv.invoice_series || ''));

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').text('Datos del servicio');
  doc.moveDown(0.4);
  writeKV(doc, 'Referencia', payload.reference || payload.referencia || '');
  writeKV(doc, 'Responsable', payload.responsable || payload.responsible || '');
  writeKV(doc, 'Compañía', company.name || company.legal_name || '');
  writeKV(doc, 'Show/Evento', show.name || show.title || payload.show_name || '');
  writeKV(doc, 'Lugar', [dates.city, dates.country].filter(Boolean).join(', '));
  writeKV(doc, 'Fechas', payload.event?.dates_text || payload.dates_text || '');

  doc.moveDown(1.0);
  doc.fontSize(14).font('Helvetica-Bold').text('Datos de facturación');
  doc.moveDown(0.4);
  writeKV(doc, 'Razón social', inv.razon_social || inv.legal_name || '');
  writeKV(doc, 'NIF/VAT', inv.vat || inv.nif || '');
  writeKV(doc, 'Dirección', inv.address || inv.direccion || '');
  writeKV(doc, 'Ciudad/País', [inv.city, inv.country].filter(Boolean).join(', '));
  writeKV(doc, 'Concepto', inv.concept || inv.concepto || '');

  doc.moveDown(1.0);
  doc.fontSize(14).font('Helvetica-Bold').text('Importes');
  doc.moveDown(0.4);

  const base = inv.amount_base ?? inv.base ?? payload.amount_base ?? 0;
  const ivaRate = inv.iva_rate ?? inv.vat_rate ?? payload.iva_rate ?? 0;
  const iva = inv.amount_iva ?? inv.vat_amount ?? (Number(base||0) * Number(ivaRate||0) / 100);
  const total = inv.amount_total ?? inv.total ?? (Number(base||0) + Number(iva||0));

  writeKV(doc, 'Base imponible', eur(base));
  writeKV(doc, 'IVA %', `${Number(ivaRate||0).toFixed(2)}%`);
  writeKV(doc, 'IVA', eur(iva));
  doc.moveDown(0.2);
  doc.fontSize(16).font('Helvetica-Bold').text(`TOTAL: ${eur(total)}`, { align: 'right' });

  doc.moveDown(1.5);
  brandFooter(doc, [
  'Documento oficial emitido por el sistema. Numeración oficial sujeta a conciliación DelSol (si aplica).',
  'Verificar datos fiscales según país y procedimiento interno.'
]);
  doc.fillColor('#000');

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateFacturaPdf };
