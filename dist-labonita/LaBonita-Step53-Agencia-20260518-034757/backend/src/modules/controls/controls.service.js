/**
 * Controls service: builds internal controls (replacing Excel) from petitions data.
 *
 * Data is derived live from petitions/documents plus optional commissions stored in DB.
 * This keeps the system flexible while we postpone DelSol integration.
 */
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

function safeJsonParse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function monthKeyFromDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function petitionMonth(p) {
  // Prefer request.date if parseable; fallback to created_at.
  const reqDate = p.data?.request?.date;
  return monthKeyFromDate(reqDate) || monthKeyFromDate(p.created_at) || 'unknown';
}

function sumNumber(...vals) {
  return vals.reduce((acc, v) => acc + (typeof v === 'number' && Number.isFinite(v) ? v : 0), 0);
}

function buildMonthlyPayrollRows(petitions) {
  return petitions.map((p) => {
    const expensesTotal = sumNumber(
      p.data?.expenses?.gastos_puntuales_total,
      p.data?.expenses?.gastos_representacion_total
    );
    return {
      month: petitionMonth(p),
      petition_id: p.id,
      artist_user_id: p.user_id,
      type: p.type,
      status: p.status,
      reference: p.data?.event?.reference || '',
      company_show: p.data?.event?.company_show || '',
      country: p.data?.event?.country || '',
      city: p.data?.event?.city || '',
      dates_text: p.data?.event?.dates_text || '',
      amount_without_vat: p.data?.invoice?.amount_without_vat ?? null,
      expenses_total_with_vat: expensesTotal || null,
    };
  });
}

function buildPuntualesRows(petitions) {
  const rows = [];
  for (const p of petitions) {
    const comp = p.data?.companions || {};
    if (comp.non_labonita === true) {
      rows.push({
        month: petitionMonth(p),
        petition_id: p.id,
        artist_user_id: p.user_id,
        kind: 'NON_LABONITA_ALTA',
        cache_eur: comp.non_labonita_cache ?? null,
        retention_included: comp.non_labonita_retention_included ?? null,
        reference: p.data?.event?.reference || '',
        dates_text: p.data?.event?.dates_text || '',
      });
    }
    if (comp.external_invoice === true) {
      rows.push({
        month: petitionMonth(p),
        petition_id: p.id,
        artist_user_id: p.user_id,
        kind: 'EXTERNAL_INVOICE',
        cache_eur: comp.external_invoice_cache ?? null,
        retention_included: null,
        reference: p.data?.event?.reference || '',
        dates_text: p.data?.event?.dates_text || '',
      });
    }
  }
  return rows;
}

function buildGastosRows(petitions, documents) {
  // Minimal: totals from petition + any uploaded docs tagged as expense-like.
  const expenseDocs = documents.filter((d) =>
    String(d.doc_type || '').toUpperCase().includes('GASTO') ||
    String(d.doc_type || '').toUpperCase().includes('EXPENSE')
  );

  const byPetition = new Map();
  for (const d of expenseDocs) {
    if (!byPetition.has(d.petition_id)) byPetition.set(d.petition_id, []);
    byPetition.get(d.petition_id).push(d);
  }

  const rows = [];
  for (const p of petitions) {
    const expensesTotal = sumNumber(
      p.data?.expenses?.gastos_puntuales_total,
      p.data?.expenses?.gastos_representacion_total
    );

    const docs = byPetition.get(p.id) || [];
    if (docs.length === 0) {
      rows.push({
        month: petitionMonth(p),
        petition_id: p.id,
        artist_user_id: p.user_id,
        reference: p.data?.event?.reference || '',
        expenses_total_with_vat: expensesTotal || null,
        doc_id: null,
        doc_type: null,
        filename: null,
        uploaded_by_role: null,
      });
      continue;
    }

    for (const d of docs) {
      rows.push({
        month: petitionMonth(p),
        petition_id: p.id,
        artist_user_id: p.user_id,
        reference: p.data?.event?.reference || '',
        expenses_total_with_vat: expensesTotal || null,
        doc_id: d.id,
        doc_type: d.doc_type,
        filename: d.original_name,
        uploaded_by_role: d.uploaded_by_role || null,
      });
    }
  }
  return rows;
}

function buildCommissionsRows(commissions) {
  return commissions.map((c) => ({
    month: c.month,
    petition_id: c.petition_id,
    label: c.label,
    amount_eur: c.amount_eur,
    created_at: c.created_at,
  }));
}

function buildControlTotalRows(petitions, commissionsByPetition, ledgerTotalsByPetition) {
  return petitions.map((p) => {
    const revenue = (typeof p.data?.invoice?.amount_without_vat === 'number') ? p.data.invoice.amount_without_vat : 0;
    const expenses = sumNumber(
      p.data?.expenses?.gastos_puntuales_total,
      p.data?.expenses?.gastos_representacion_total
    );
    const commissions = commissionsByPetition.get(p.id) || 0;
    const ledger = ledgerTotalsByPetition?.get(p.id) || { in_total: 0, out_total: 0 };
    const receipts_total = ledger.in_total || 0;
    const payouts_total = ledger.out_total || 0;
    const balance_to_zero = receipts_total - expenses - commissions - payouts_total;

    return {
      month: petitionMonth(p),
      petition_id: p.id,
      artist_user_id: p.user_id,
      type: p.type,
      status: p.status,
      reference: p.data?.event?.reference || '',
      revenue_without_vat: revenue || null,
      expenses_total_with_vat: expenses || null,
      commissions_total: commissions || 0,
      payouts_total,
      balance_to_zero,
    };
  });
}

function toCsv(rows) {
  const parser = new Parser({ withBOM: true });
  return parser.parse(rows);
}

function toXlsxBuffer(rows, sheetName) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}


function buildLedgerRows(ledgerRows) {
  return ledgerRows.map((r) => ({
    month: (r.occurred_at || '').slice(0, 7),
    id: r.id,
    petition_id: r.petition_id,
    direction: r.direction,
    category: r.category,
    amount_eur: r.amount_eur,
    occurred_at: r.occurred_at,
    note: r.note || '',
    created_by_role: r.created_by_role || '',
    created_at: r.created_at || '',
  }));
}


function parseDatesTextToDays(text) {
  const t = String(text || '').trim();
  if (!t) return [];

  // Supported inputs:
  // - "2026-02-20, 2026-02-21"
  // - "2026-02-20 a 2026-02-23" / "2026-02-20 al 2026-02-23" / "2026-02-20 - 2026-02-23"
  // - "del 20 al 23/02/2026" (Spanish short range)
  // - multiple lines / mixed
  const chunks = t.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const out = new Set();

  const addIso = (iso) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) out.add(iso);
  };

  const expandIsoRange = (startIso, endIso) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startIso) || !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) return;
    const s = new Date(startIso + 'T00:00:00Z');
    const e = new Date(endIso + 'T00:00:00Z');
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return;
    if (s > e) return;
    for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      out.add(iso);
    }
  };

  const parseSpanishShortRange = (line) => {
    // "del 20 al 23/02/2026" or "del 20 al 23-02-2026"
    const m = line.match(/del\s+(\d{1,2})\s+al\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
    if (!m) return false;
    const d1 = Number(m[1]), d2 = Number(m[2]), mm = Number(m[3]), yyyy = Number(m[4]);
    if (!(d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31 && mm >= 1 && mm <= 12)) return false;
    const startIso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
    const endIso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
    expandIsoRange(startIso, endIso);
    return true;
  };

  const parseLine = (line) => {
    // First: try short range
    if (parseSpanishShortRange(line)) return;

    // ISO ranges
    const range = line.match(/(\d{4}-\d{2}-\d{2})\s*(?:a|al|hasta|\-)\s*(\d{4}-\d{2}-\d{2})/i);
    if (range) {
      expandIsoRange(range[1], range[2]);
      return;
    }

    // Extract all ISO dates
    const dates = line.match(/\d{4}-\d{2}-\d{2}/g) || [];
    if (dates.length) {
      dates.forEach(addIso);
      return;
    }

    // Also allow DD/MM/YYYY single dates
    const ddmmyyyy = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g) || [];
    ddmmyyyy.forEach((token) => {
      const m2 = token.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (!m2) return;
      const dd = Number(m2[1]), mm = Number(m2[2]), yyyy = Number(m2[3]);
      if (!(dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12)) return;
      addIso(`${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`);
    });
  };

  // Split also by commas/semicolons for single-line lists
  chunks.forEach((c) => c.split(/[,;]+/).map((s) => s.trim()).filter(Boolean).forEach(parseLine));

  return Array.from(out).sort((a, b) => String(a).localeCompare(String(b)));
}


function buildSsDiarioRows(petitions, usersById) {
  const rows = [];
  petitions
    .filter((p) => p.type === 'ALTA_FACTURA')
    .forEach((p) => {
      const data = p.data || {};
      const explicit = Array.isArray(data?.event?.dates) ? data.event.dates : [];
      const days = explicit.length ? explicit : parseDatesTextToDays(data?.event?.dates_text || data?.event?.dates_text);
      const user = usersById.get(p.user_id) || {};
      days.forEach((day) => {
        rows.push({
          date: day,
          petition_id: p.id,
          artist_user_id: p.user_id,
          artist_email: user.email || '',
          reference: data?.event?.reference || '',
          country: data?.event?.country || '',
          city: data?.event?.city || '',
          amount_without_vat: Number(data?.invoice?.amount_without_vat || 0),
          status: p.status,
        });
      });
    });
  return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

module.exports = {
  safeJsonParse,
  buildMonthlyPayrollRows,
  buildPuntualesRows,
  buildGastosRows,
  buildCommissionsRows,
  buildControlTotalRows,
  buildLedgerRows,
  buildSsDiarioRows,
  toCsv,
  toXlsxBuffer,
};
