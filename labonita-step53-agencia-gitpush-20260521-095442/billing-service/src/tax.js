const EU = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','SE'
]);

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function taxContextForCustomer(customer, defaultVatRate) {
  const cc = String(customer.country_code || 'ES').toUpperCase();
  const vatId = String(customer.vat_id || '').trim();
  const viesValid = Number(customer.vies_valid || 0) === 1;

  if (cc === 'ES') {
    return { rule: 'ES_DOMESTIC', vat_mode: 'STANDARD', default_vat_rate: defaultVatRate, legal_text: 'Operación sujeta a IVA en España.' };
  }

  if (EU.has(cc)) {
    if (vatId && viesValid) {
      return {
        rule: 'EU_REVERSE_CHARGE',
        vat_mode: 'REVERSE_CHARGE',
        default_vat_rate: 0,
        legal_text: 'Operación intracomunitaria con inversión del sujeto pasivo (VIES validado).'
      };
    }
    return {
      rule: 'EU_NO_VAT_ID',
      vat_mode: 'STANDARD',
      default_vat_rate: defaultVatRate,
      legal_text: 'Cliente UE sin VAT ID válido: se aplica IVA (configurable).'
    };
  }

  return { rule: 'EXPORT_NON_EU', vat_mode: 'EXPORT', default_vat_rate: 0, legal_text: 'Cliente fuera de la UE: IVA 0 (revisar normativa aplicable).' };
}

function computeInvoiceTotals(lines, taxCtx) {
  let base = 0;
  let vat = 0;
  const byVatRate = new Map();

  for (const l of lines) {
    const qty = Number(l.qty ?? 1);
    const unit = Number(l.unit_price ?? 0);
    const discount = Number(l.discount ?? 0);
    const lineBase = Math.max(0, qty * unit - discount);
    base += lineBase;

    const rawVat = (l.vat_rate === null || l.vat_rate === undefined) ? taxCtx.default_vat_rate : Number(l.vat_rate);
    const effVat = taxCtx.vat_mode === 'REVERSE_CHARGE' ? 0 : rawVat;
    const lineVat = lineBase * (effVat / 100);
    vat += lineVat;

    const key = String(effVat);
    const prev = byVatRate.get(key) || { base: 0, vat: 0, rate: effVat };
    prev.base += lineBase;
    prev.vat += lineVat;
    byVatRate.set(key, prev);
  }

  base = round2(base);
  vat = round2(vat);

  const total = round2(base + vat);

  const breakdown = Array.from(byVatRate.values()).map((x) => ({
    rate: x.rate,
    base: round2(x.base),
    vat: round2(x.vat),
  })).sort((a,b) => a.rate - b.rate);

  return { base, vat, total, breakdown };
}

function computeSettlement({ lines, commission_rate, expenses_to_artist, splits }) {
  let service_base = 0;
  let expenses_base = 0;

  for (const l of lines) {
    const qty = Number(l.qty ?? 1);
    const unit = Number(l.unit_price ?? 0);
    const discount = Number(l.discount ?? 0);
    const lineBase = Math.max(0, qty * unit - discount);

    const kind = String(l.kind || 'SERVICE').toUpperCase();
    if (kind === 'EXPENSE') expenses_base += lineBase;
    else service_base += lineBase;
  }

  service_base = round2(service_base);
  expenses_base = round2(expenses_base);

  const commission_amount = round2(service_base * (Number(commission_rate || 0) / 100));
  const payout_pool = round2((service_base - commission_amount) + (Number(expenses_to_artist || 0) ? expenses_base : 0));

  let gross_total = 0;
  let withholding_total = 0;
  let net_total = 0;

  const computedSplits = (splits || []).map((s) => {
    const share = Number(s.share_percent || 0) / 100;
    const gross = round2(payout_pool * share);
    const irpf = Number(s.irpf_rate || 0) / 100;
    const withholding = round2(gross * irpf);
    const net = round2(gross - withholding);

    gross_total = round2(gross_total + gross);
    withholding_total = round2(withholding_total + withholding);
    net_total = round2(net_total + net);

    return {
      artist_id: s.artist_id,
      share_percent: Number(s.share_percent || 0),
      irpf_rate: Number(s.irpf_rate || 0),
      gross_amount: gross,
      withholding_amount: withholding,
      net_amount: net,
    };
  });

  return {
    service_base,
    expenses_base,
    commission_rate: Number(commission_rate || 0),
    commission_amount,
    payout_pool,
    artist_gross_total: gross_total,
    artist_withholding_total: withholding_total,
    artist_net_total: net_total,
    splits: computedSplits,
  };
}

module.exports = { taxContextForCustomer, computeInvoiceTotals, computeSettlement, round2 };
