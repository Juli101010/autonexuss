/**
 * Map summary for the demo-style "Mapa de Peticiones" UI.
 *
 * Provides:
 * - per petition: reference, status, type, checklist counts, docs flags
 * - step states for the interactive map
 *
 * This is an aggregation endpoint to avoid multiple round-trips from the UI.
 */
const db = require('../../config/db');

function safeJsonParse(s, fallback = {}) {
  try { return JSON.parse(s || '{}'); } catch { return fallback; }
}

function referenceFromData(data) {
  return String(data?.event?.reference || data?.event?.ref || '').trim();
}

function computeExpensesTotal(data) {
  return (
    Number(data?.expenses?.gastos_puntuales_total || 0) +
    Number(data?.expenses?.gastos_representacion_total || 0)
  );
}


function missingByStep(p, checklist, flags) {
  const t = String(p.type || '').toUpperCase();
  const expected = expectedStepsForType(t);
  const isOnboarding = ['ONBOARDING_ASSOCIADO','ONBOARDING_PUNTUAL'].includes(t);
  const isPresu = t === 'PRESUPUESTO';

  const by = {
    petition: [],
    validation: [],
    altas_bajas: [],
    contratos: [],
    facturacion: [],
    calculos: [],
    cierre: [],
  };

  if (checklist) {
    (checklist.missingFields || []).slice(0, 12).forEach((f) => {
      by.petition.push(f.label || f.path || 'Campo');
    });
    (checklist.missingDocs || []).slice(0, 12).forEach((d) => {
      by.petition.push(`Doc: ${d}`);
    });
    (checklist.ruleErrors || []).slice(0, 12).forEach((e) => {
      by.petition.push(e.label || e.path || 'Regla');
    });
  }

  if (p.status === 'PENDIENTE_VALIDACION') by.validation.push('Esperando validación admin');
  if (p.status === 'PENDIENTE_INFO') by.validation.push('Admin pidió información');
  if (!isOnboarding && expected.includes('altas_bajas')) {
    if (!flags.hasA1) by.altas_bajas.push('Falta A1 (si aplica)');
    if (!flags.hasNomina) by.altas_bajas.push('Falta nómina (si aplica)');
  }

  if (!isOnboarding && expected.includes('contratos')) {
    if (!flags.hasContract) by.contratos.push('Falta contrato (doc oficial)');
  }

  if (!isOnboarding && expected.includes('facturacion')) {
    if (!flags.hasFactura) by.facturacion.push('Falta factura (doc oficial)');
    if (!['COBRADA','PAGADA','CERRADA_CERO'].includes(p.status) && flags.hasFactura) by.facturacion.push('Revisar cobro/pago');
  }

  if (!isOnboarding && expected.includes('calculos')) {
    if (flags.expensesTotal === 0) by.calculos.push('Gastos: 0 (ok si no aplica)');
    if (flags.commissionsTotal === 0) by.calculos.push('Comisiones: 0 (ok si no aplica)');
    if ((flags.ledgerIn + flags.ledgerOut) === 0) by.calculos.push('Ledger vacío');
  }

  if (!isOnboarding && expected.includes('cierre')) {
    const bal = Number(flags.ledgerIn) - Number(flags.expensesTotal) - Number(flags.commissionsTotal) - Number(flags.ledgerOut);
    if (Math.abs(bal) > 0.01) by.cierre.push(`Balance ≠ 0 (Δ €${bal.toFixed(2)})`);
    if (p.status !== 'CERRADA_CERO') by.cierre.push('Estado no cerrado');
  }

  if (isPresu) {
    by.validation.push('Presupuesto: convertir a Alta+Factura para continuar');
  }

  return by;
}



function expectedStepsForType(type) {
  const t = String(type || '').toUpperCase();

  // Mapa aprobado:
  // - Onboarding (asociado / puntual): solo perfil + validación (sin flujo contable).
  // - Presupuesto: petición + validación; luego se convierte a ALTA_FACTURA.
  // - Alta+Factura: flujo completo.
  // - Formación: contrato laboral + factura + cálculos + cierre (incluye altas/bajas).
  const rules = {
    ONBOARDING_ASSOCIADO: ['petition','validation'],
    ONBOARDING_PUNTUAL: ['petition','validation'],

    PRESUPUESTO: ['petition','validation'],

    ALTA_FACTURA: ['petition','validation','altas_bajas','contratos','facturacion','calculos','cierre'],

    FORMACION: ['petition','validation','altas_bajas','contratos','facturacion','calculos','cierre'],
  };

  return rules[t] || ['petition','validation','altas_bajas','contratos','facturacion','calculos','cierre'];
}

function stepState(steps, expected, key, extra) {
  if (!expected.includes(key)) return 'NA';
  if (key === 'cierre' && extra && extra.blockClose) return 'BLOCK';
  return steps[key] ? 'OK' : 'PENDING';
}

function stepModel(p, flags) {
  // Step order matches UI
  // 1) PETICION
  const petition = true;

  // 2) VALIDACION
  const validation = !['BORRADOR', 'PENDIENTE_VALIDACION', 'PENDIENTE_INFO'].includes(p.status);

  // 3) ALTAS_BAJAS (heuristic: either labor statuses or A1 doc)
  const altas_bajas = ['LABORAL_EN_CURSO', 'NOMINA_PUBLICADA', 'COBRADA', 'PAGADA', 'CERRADA_CERO'].includes(p.status) || flags.hasA1;

  // 4) CONTRATOS
  const contratos = flags.hasContract;

  // 5) FACTURACION
  const facturacion = ['FACTURA_EMITIDA', 'COBRADA', 'PAGADA', 'CERRADA_CERO'].includes(p.status) || flags.hasFactura;

  // 6) CALCULOS
  const calculos = (flags.ledgerIn > 0 || flags.ledgerOut > 0 || flags.commissionsTotal > 0 || flags.expensesTotal > 0);

  // 7) CIERRE
  const cierre = p.status === 'CERRADA_CERO';

  return { petition, validation, altas_bajas, contratos, facturacion, calculos, cierre };
}

function currentStepIndex(steps) {
  const order = ['petition','validation','altas_bajas','contratos','facturacion','calculos','cierre'];
  let idx = 0;
  for (let i = 0; i < order.length; i += 1) {
    if (steps[order[i]]) idx = i;
  }
  return idx;
}

exports.summary = async (req, res) => {
  try {
    const petitions = await db.all(`
      SELECT id, user_id, type, status, data, pending_checklist, created_at, assigned_admin_id, priority
      FROM petitions
      ORDER BY created_at DESC
    `);

    const docs = await db.all(`
      SELECT petition_id, doc_type, is_official
      FROM documents
    `);

    const docByPetition = new Map();
    docs.forEach((d) => {
      if (!docByPetition.has(d.petition_id)) docByPetition.set(d.petition_id, []);
      docByPetition.get(d.petition_id).push(d);
    });

    const ledgerTotals = await db.all(`
      SELECT petition_id,
             SUM(CASE WHEN direction='IN' THEN amount_eur ELSE 0 END) AS in_total,
             SUM(CASE WHEN direction='OUT' THEN amount_eur ELSE 0 END) AS out_total
      FROM ledger_transactions
      GROUP BY petition_id
    `);
    const ledgerMap = new Map();
    ledgerTotals.forEach((r) => ledgerMap.set(r.petition_id, { in: Number(r.in_total || 0), out: Number(r.out_total || 0) }));

    const commTotals = await db.all(`
      SELECT petition_id, SUM(amount_eur) AS total
      FROM commissions
      GROUP BY petition_id
    `);
    const commMap = new Map();
    commTotals.forEach((r) => commMap.set(r.petition_id, Number(r.total || 0)));

    const rows = petitions.map((p) => {
      const data = safeJsonParse(p.data, {});
      const reference = referenceFromData(data);
      const checklist = safeJsonParse(p.pending_checklist, null);
      const missingCount =
        checklist
          ? (Number(checklist?.missingFields?.length || 0) +
             Number(checklist?.missingDocs?.length || 0) +
             Number(checklist?.ruleErrors?.length || 0))
          : 0;

      const docRows = docByPetition.get(p.id) || [];
      const docTypes = docRows.map((d) => d.doc_type);
      const hasA1 = docTypes.includes('A1') || docTypes.includes('A1_PDF');
      const hasContract = docTypes.some((t) => String(t).toUpperCase().includes('CONTRATO'));
      const hasFactura = docTypes.includes('FACTURA_EMITIDA') || docTypes.includes('FACTURA_PDF');
      const hasNomina = docTypes.includes('NOMINA_PUBLICADA') || docTypes.includes('NOMINA_PDF');
      const hasPresupuestoPdf = docTypes.includes('PRESUPUESTO_PDF');

      const ledger = ledgerMap.get(p.id) || { in: 0, out: 0 };
      const commissionsTotal = commMap.get(p.id) || 0;
      const expensesTotal = computeExpensesTotal(data);

      const flags = {
        missingCount,
        hasA1,
        hasContract,
        hasFactura,
        hasNomina,
        hasPresupuestoPdf,
        ledgerIn: ledger.in,
        ledgerOut: ledger.out,
        commissionsTotal,
        expensesTotal,
      };

      const steps = stepModel(p, flags);
      const expected_steps = expectedStepsForType(p.type);
      const balAbs = Math.abs(Number(ledger.in - expensesTotal - commissionsTotal - ledger.out));
      const blockClose = expected_steps.includes('cierre') && p.status !== 'CERRADA_CERO' && balAbs > 0.01;
      const step_state = {
        petition: stepState(steps, expected_steps, 'petition', { blockClose }),
        validation: stepState(steps, expected_steps, 'validation', { blockClose }),
        altas_bajas: stepState(steps, expected_steps, 'altas_bajas', { blockClose }),
        contratos: stepState(steps, expected_steps, 'contratos', { blockClose }),
        facturacion: stepState(steps, expected_steps, 'facturacion', { blockClose }),
        calculos: stepState(steps, expected_steps, 'calculos', { blockClose }),
        cierre: stepState(steps, expected_steps, 'cierre', { blockClose }),
      };
      const missing_by_step = missingByStep(p, checklist, flags);
      const stepIndex = currentStepIndex(steps);

      const balance_to_zero = (ledger.in - expensesTotal - commissionsTotal - ledger.out);

      return {
        id: p.id,
        user_id: p.user_id,
        type: p.type,
        status: p.status,
        reference,
        created_at: p.created_at,
        checklist_missing: missingCount,
        docs_count: docRows.length,
        flags,
        steps,
        expected_steps,
        step_state,
        missing_by_step,
        stepIndex,
        balance_to_zero,
      };
    });

    return res.json({ rows });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};
