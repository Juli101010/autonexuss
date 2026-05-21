const PDFDocument = require('pdfkit');
const { round2 } = require('./tax');

function money(n, currency = 'EUR') {
  return `${round2(n).toFixed(2)} ${currency}`;
}

function buildInvoicePdf({ invoice, lines, issuer, customer, taxCtx, totals }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  doc.fontSize(18).text(invoice.type === 'CREDIT_NOTE' ? 'FACTURA RECTIFICATIVA' : 'FACTURA', { align: 'right' });
  doc.moveDown(0.5);

  doc.fontSize(10).text(issuer.name);
  doc.text(`NIF: ${issuer.nif}`);
  doc.text(issuer.address);
  doc.text(`${issuer.postal} ${issuer.city} (${issuer.country})`);
  if (issuer.email) doc.text(issuer.email);

  doc.moveDown();
  doc.fontSize(12).text('Cliente', { underline: true });
  doc.fontSize(10).text(customer.name);
  if (customer.tax_id) doc.text(`NIF: ${customer.tax_id}`);
  if (customer.vat_id) doc.text(`VAT ID: ${customer.vat_id}`);
  if (customer.address) doc.text(customer.address);
  const cityLine = `${customer.postal || ''} ${customer.city || ''}`.trim();
  if (cityLine) doc.text(cityLine);
  doc.text(`País: ${customer.country_code}`);

  doc.moveDown();
  doc.fontSize(10).text(`Número: ${invoice.legal_number || '(borrador)'}`);
  if (invoice.issue_date) doc.text(`Fecha emisión: ${invoice.issue_date}`);
  if (invoice.service_date_from || invoice.service_date_to) {
    doc.text(`Prestación: ${invoice.service_date_from || ''}${invoice.service_date_to ? ' - ' + invoice.service_date_to : ''}`);
  }
  if (invoice.due_date) doc.text(`Vencimiento: ${invoice.due_date}`);

  doc.moveDown();
  doc.fontSize(10).text('Detalle', 40, doc.y, { continued: true });
  doc.text('Cant.', 280, doc.y, { continued: true });
  doc.text('P.Unit', 330, doc.y, { continued: true });
  doc.text('IVA%', 410, doc.y, { continued: true });
  doc.text('Base', 450, doc.y, { align: 'right' });
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.3);

  for (const l of lines) {
    const qty = Number(l.qty ?? 1);
    const unit = Number(l.unit_price ?? 0);
    const discount = Number(l.discount ?? 0);
    const lineBase = Math.max(0, qty * unit - discount);
    const vatRate = (l.vat_rate === null || l.vat_rate === undefined) ? totals.default_vat_rate : Number(l.vat_rate);

    doc.text(String(l.description), 40, doc.y, { width: 230, continued: true });
    doc.text(String(qty), 280, doc.y, { width: 40, continued: true });
    doc.text(money(unit, invoice.currency), 330, doc.y, { width: 70, continued: true });
    doc.text(String(vatRate), 410, doc.y, { width: 40, continued: true });
    doc.text(money(lineBase, invoice.currency), 450, doc.y, { width: 105, align: 'right' });
    doc.moveDown(0.4);
  }

  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(10).text(`Base imponible: ${money(totals.base, invoice.currency)}`, { align: 'right' });
  if (Array.isArray(totals.breakdown) && totals.breakdown.length > 1) {
    doc.fontSize(9).fillColor('gray');
    for (const b of totals.breakdown) {
      doc.text(`IVA ${b.rate}%: base ${money(b.base, invoice.currency)} - cuota ${money(b.vat, invoice.currency)}`, { align: 'right' });
    }
    doc.fillColor('black');
  }
  doc.fontSize(10).text(`IVA: ${money(totals.vat, invoice.currency)}`, { align: 'right' });
  doc.fontSize(12).text(`TOTAL: ${money(totals.total, invoice.currency)}`, { align: 'right' });

  doc.moveDown();
  doc.fontSize(9).fillColor('gray').text(taxCtx.legal_text || '');
  doc.fillColor('black');

  if (invoice.notes) {
    doc.moveDown();
    doc.fontSize(9).text(`Notas: ${invoice.notes}`);
  }

  doc.end();
  return doc;
}

function buildSettlementPdf({ invoice, issuer, settlement, artists }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  doc.fontSize(18).text('LIQUIDACIÓN ARTISTAS', { align: 'right' });
  doc.moveDown(0.5);

  doc.fontSize(10).text(issuer.name);
  doc.text(`NIF: ${issuer.nif}`);
  doc.text(issuer.address);
  doc.text(`${issuer.postal} ${issuer.city} (${issuer.country})`);
  if (issuer.email) doc.text(issuer.email);

  doc.moveDown();
  doc.fontSize(10).text(`Factura: ${invoice.legal_number || `#${invoice.id}`}`);
  if (invoice.issue_date) doc.text(`Fecha emisión: ${invoice.issue_date}`);
  if (invoice.service_date_from || invoice.service_date_to) {
    doc.text(`Prestación: ${invoice.service_date_from || ''}${invoice.service_date_to ? ' - ' + invoice.service_date_to : ''}`);
  }

  doc.moveDown();
  doc.fontSize(12).text('Resumen', { underline: true });
  doc.fontSize(10).text(`Base servicios: ${money(settlement.service_base, invoice.currency)}`);
  doc.text(`Gastos: ${money(settlement.expenses_base, invoice.currency)} ${settlement.expenses_to_artist ? '(se liquidan)' : '(no se liquidan)'}`);
  doc.text(`Comisión LaBonita (${settlement.commission_rate}%): -${money(settlement.commission_amount, invoice.currency)}`);
  doc.text(`Pool liquidación: ${money(settlement.payout_pool, invoice.currency)}`);

  doc.moveDown();
  doc.fontSize(12).text('Reparto', { underline: true });
  doc.fontSize(10).text('Artista', 40, doc.y, { continued: true });
  doc.text('%', 250, doc.y, { continued: true });
  doc.text('IRPF%', 290, doc.y, { continued: true });
  doc.text('Bruto', 350, doc.y, { continued: true });
  doc.text('Ret.', 430, doc.y, { continued: true });
  doc.text('Neto', 500, doc.y, { align: 'right' });
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.3);

  for (const s of settlement.splits || []) {
    const a = artists.get(String(s.artist_id)) || { name: `Artista #${s.artist_id}` };
    doc.text(a.stage_name ? `${a.stage_name} (${a.name})` : a.name, 40, doc.y, { width: 200, continued: true });
    doc.text(String(s.share_percent), 250, doc.y, { width: 30, continued: true });
    doc.text(String(s.irpf_rate), 290, doc.y, { width: 40, continued: true });
    doc.text(money(s.gross_amount, invoice.currency), 350, doc.y, { width: 75, continued: true });
    doc.text(money(s.withholding_amount, invoice.currency), 430, doc.y, { width: 60, continued: true });
    doc.text(money(s.net_amount, invoice.currency), 500, doc.y, { width: 55, align: 'right' });
    doc.moveDown(0.4);
  }

  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(10).text(`Total bruto artistas: ${money(settlement.artist_gross_total, invoice.currency)}`, { align: 'right' });
  doc.text(`Total retenciones: -${money(settlement.artist_withholding_total, invoice.currency)}`, { align: 'right' });
  doc.fontSize(12).text(`Total neto a pagar artistas: ${money(settlement.artist_net_total, invoice.currency)}`, { align: 'right' });

  doc.end();
  return doc;
}

module.exports = { buildInvoicePdf, buildSettlementPdf };
