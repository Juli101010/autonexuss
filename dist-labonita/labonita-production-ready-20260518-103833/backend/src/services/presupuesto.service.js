/**
 * Presupuesto service: generate a simple PDF as official document.
 *
 * This is intentionally minimal and self-contained. It can be replaced later by a richer template engine.
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
const path = require('path');

function safeText(v) {
  return String(v == null ? '' : v).trim();
}

function eur(v) {
  const n = Number(v || 0);
  return `€${n.toFixed(2)}`;
}

/**
 * @param {object} params
 * @param {string} params.outputPath absolute path to write PDF
 * @param {object} params.data petition.data JSON
 * @param {number} params.petitionId
 */
async function generatePresupuestoPdf({ outputPath, data, petitionId }) {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(18).text('PRESUPUESTO', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).text(`Petición #${petitionId}`);
    doc.text(`Fecha: ${safeText(data?.request?.date) || new Date().toISOString().slice(0, 10)}`);
    doc.moveDown(1);

    doc.fontSize(12).text('Evento', { underline: true });
    doc.fontSize(10);
    doc.text(`Compañía/Espectáculo: ${safeText(data?.event?.company_show)}`);
    doc.text(`Referencia: ${safeText(data?.event?.reference)}`);
    doc.text(`Lugar: ${safeText(data?.event?.city)}, ${safeText(data?.event?.country)}`);
    doc.text(`Fechas: ${safeText(data?.event?.dates_text)}`);
    doc.moveDown(1);

    doc.fontSize(12).text('Cliente', { underline: true });
    doc.fontSize(10);
    doc.text(`Cliente/Empresa: ${safeText(data?.budget?.client_name)}`);
    doc.text(`Email: ${safeText(data?.budget?.contact_email)}`);
    doc.moveDown(1);

    doc.fontSize(12).text('Importe', { underline: true });
    doc.fontSize(10);
    doc.text(`Concepto: ${safeText(data?.budget?.concept)}`);
    doc.text(`Importe estimado (sin IVA): ${eur(data?.budget?.amount_without_vat)}`);
    const vat = safeText(data?.budget?.vat_type);
    if (vat) doc.text(`IVA estimado: ${vat}`);
    doc.moveDown(1);

    const comments = safeText(data?.comments);
    if (comments) {
      doc.fontSize(12).text('Comentarios', { underline: true });
      doc.fontSize(10).text(comments);
    }

    doc.moveDown(2);
    doc.fontSize(9).text('Documento generado por LaBonita (borrador).', { align: 'center' });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generatePresupuestoPdf };
