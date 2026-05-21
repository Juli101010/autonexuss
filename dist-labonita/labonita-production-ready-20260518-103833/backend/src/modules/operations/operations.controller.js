const db = require('../../config/db');
const PDFDocument = require('pdfkit');

function safeJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function money(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const TEMPLATE_RULES = {
  ALTA_FACTURA: {
    label: 'Petición de Alta + Factura Puntual',
    required: ['petition_date','responsible_name','company_show','reference','pais_ciudad_actuacion','fecha_inicio_actuacion','client_name','client_tax_id','factura_direccion','factura_cp','factura_ciudad','factura_pais','factura_concepto','factura_total_sin_iva','iva_tipo'],
    laborRequired: true,
    defaultCommissionRate: 0.06,
    minCommission: 20,
  },
  SERVICIO_PUNTUAL: {
    label: 'Formulario Servicio Puntual',
    required: ['nombre_apellidos','domicilio','codigo_postal','ciudad_localidad','provincia','dni_nie','telefono','email','profesion','fecha_nacimiento','situacion_familiar','situacion_laboral','acepta_acuerdo'],
    laborRequired: true,
    defaultCommissionRate: 0.07,
    minCommission: 0,
  },
  CONTRATO_FORMACION: {
    label: 'Petición de Contrato de Formación',
    required: ['formacion_nombre','nivel_estudios','reference','periodo_inicio','periodo_fin','tipo_clases','dias_semana','horario_clases','importe_hora','importe_tipo','formacion_lugar','formacion_direccion','formacion_ciudad','cuando_factura','client_name','client_tax_id','factura_direccion','factura_cp','factura_ciudad','factura_pais','factura_concepto','factura_total_sin_iva'],
    laborRequired: true,
    defaultCommissionRate: 0.06,
    minCommission: 20,
  },
  PERSONA_ASOCIADA: {
    label: 'Formulario Inscripción Persona Asociada',
    required: ['nombre_apellidos','domicilio','codigo_postal','ciudad_localidad','provincia','dni_nie','telefono','email','profesion','fecha_nacimiento','situacion_familiar','acepta_estatutos'],
    laborRequired: false,
    defaultCommissionRate: 0.06,
    minCommission: 20,
  },
};

const FIELD_LABELS = {
  petition_date: 'Fecha petición', responsible_name: 'Nombre del socio/responsable', company_show: 'Cía + espectáculo', reference: 'Referencia', pais_ciudad_actuacion: 'País y ciudad de actuación', fecha_inicio_actuacion: 'Fecha inicio actuación',
  client_name: 'Razón social cliente', client_tax_id: 'Número fiscal/VIES', factura_direccion: 'Dirección de factura', factura_cp: 'Código postal', factura_ciudad: 'Ciudad', factura_pais: 'País', factura_concepto: 'Concepto de factura', factura_total_sin_iva: 'Cantidad total sin IVA', iva_tipo: 'Tipo de IVA',
  nombre_apellidos: 'Nombre y apellidos', domicilio: 'Domicilio', codigo_postal: 'Código postal', ciudad_localidad: 'Ciudad/localidad', provincia: 'Provincia', dni_nie: 'DNI/NIE', telefono: 'Teléfono', email: 'Mail', profesion: 'Profesión', fecha_nacimiento: 'Fecha nacimiento', situacion_familiar: 'Situación familiar', situacion_laboral: 'Situación laboral', acepta_acuerdo: 'Acepta acuerdo', acepta_estatutos: 'Acepta estatutos',
  formacion_nombre: 'Nombre formación/persona', nivel_estudios: 'Nivel de estudios', periodo_inicio: 'Inicio de periodo', periodo_fin: 'Fin de periodo', tipo_clases: 'Tipo de clases', dias_semana: 'Días a la semana', horario_clases: 'Horario', importe_hora: 'Importe por hora', importe_tipo: 'Tipo de importe', formacion_lugar: 'Lugar', formacion_direccion: 'Dirección formación', formacion_ciudad: 'Ciudad formación', cuando_factura: 'Cuándo quieren factura',
};

const TEMPLATE_FIELD_GROUPS = {
  ALTA_FACTURA: [
    ['Datos de la petición', ['petition_date','responsible_name','company_show','reference','pais_ciudad_actuacion','fecha_inicio_actuacion','fecha_fin_actuacion','requiere_a1','viaje_ida','viaje_vuelta']],
    ['Acompañantes y altas', ['acompanante_factura_externa','acompanante_factura_cache','acompanante_alta_labonita','acompanante_alta_cache','retencion_incluida_cache']],
    ['Datos para la factura', ['client_name','client_tax_id','factura_direccion','factura_cp','factura_ciudad','factura_provincia','factura_pais','factura_concepto','factura_total_sin_iva','iva_tipo']],
    ['Reparto y comentarios', ['reparto_cache_personas','gastos_puntuales','gastos_representacion','comentarios']],
  ],
  SERVICIO_PUNTUAL: [
    ['Datos personales', ['nombre_apellidos','domicilio','codigo_postal','ciudad_localidad','provincia','dni_nie','numero_seguridad_social','telefono','email','email_compania','profesion','fecha_nacimiento']],
    ['Situación familiar', ['situacion_familiar','menores_datos','dni_pareja']],
    ['IRPF y situación laboral', ['irpf_porcentaje','situacion_laboral','situacion_otro']],
    ['Acuerdo y documentación', ['acepta_acuerdo','documentacion_pendiente']],
  ],
  CONTRATO_FORMACION: [
    ['Datos de formación', ['formacion_nombre','nivel_estudios','reference','periodo_inicio','periodo_fin','tipo_clases','dias_semana','horario_clases','importe_hora','importe_tipo','formacion_lugar','formacion_direccion','formacion_ciudad']],
    ['Factura', ['cuando_factura','client_name','client_tax_id','factura_direccion','factura_cp','factura_ciudad','factura_provincia','factura_pais','factura_concepto','factura_total_sin_iva','comentarios']],
  ],
  PERSONA_ASOCIADA: [
    ['Datos personales', ['nombre_apellidos','domicilio','codigo_postal','ciudad_localidad','provincia','dni_nie','numero_seguridad_social','telefono','email','email_compania','profesion','fecha_nacimiento','estado_civil']],
    ['IRPF y familia', ['situacion_familiar','menores_datos','dni_pareja','discapacidad_reconocida','ascendientes_mayores_65']],
    ['Ingresos', ['salario_enero_hoy','prevision_hasta_diciembre','otros_salarios','paro_este_anio']],
    ['Domiciliación y aceptación', ['banco_caja','iban','direccion_postal_diferente','acepta_estatutos']],
  ],
};

const FIELD_LABELS_EXTRA = {
  fecha_fin_actuacion: 'Fecha fin actuación', requiere_a1: 'Requiere A1', viaje_ida: 'Día/s de ida', viaje_vuelta: 'Día/s de vuelta', acompanante_factura_externa: 'Acompañante con factura externa', acompanante_factura_cache: 'Caché acompañante externo', acompanante_alta_labonita: 'Acompañante a dar de alta', acompanante_alta_cache: 'Caché acompañante alta', retencion_incluida_cache: 'Retención incluida en caché', factura_provincia: 'Provincia factura', reparto_cache_personas: 'Caché por persona', gastos_puntuales: 'Gastos puntuales', gastos_representacion: 'Gastos representación', numero_seguridad_social: 'Número Seguridad Social', email_compania: 'Mail compañía', menores_datos: 'Datos de menores', dni_pareja: 'DNI/NIE pareja', irpf_porcentaje: 'IRPF solicitado %', situacion_otro: 'Otro caso', documentacion_pendiente: 'Documentación pendiente', estado_civil: 'Estado civil', discapacidad_reconocida: 'Discapacidad reconocida / grado', ascendientes_mayores_65: 'Ascendientes mayores de 65 años', salario_enero_hoy: 'Salario desde enero', prevision_hasta_diciembre: 'Previsión hasta diciembre', otros_salarios: 'Otros salarios', paro_este_anio: 'Paro este año', banco_caja: 'Banco / caja', iban: 'IBAN', direccion_postal_diferente: 'Dirección postal diferente',
};

function labelForField(key) {
  return FIELD_LABELS[key] || FIELD_LABELS_EXTRA[key] || key;
}

function templateLabel(type) {
  const t = String(type || '').toUpperCase();
  return TEMPLATE_RULES[t]?.label || t || 'Planilla';
}

function allKnownFields(type) {
  const t = String(type || '').toUpperCase();
  const groups = TEMPLATE_FIELD_GROUPS[t] || [];
  return groups.flatMap(([, fields]) => fields);
}

function normalizePayload(body, existing = {}, fallbackType = 'ALTA_FACTURA') {
  const merged = { ...existing, ...(body || {}) };
  const type = String(merged.type || merged.form_template || fallbackType || 'ALTA_FACTURA').toUpperCase();
  const reference = merged.reference || merged.referencia || merged.project_reference || merged.referencia_actuacion || merged.referencia_formacion || merged.company_show || merged.nombre_proyecto || `Proyecto ${new Date().toISOString().slice(0, 16)}`;
  const clientName = merged.client_name || merged.razon_social || merged.factura_razon_social || merged.cliente || '';
  const clientTaxId = merged.client_tax_id || merged.numero_fiscal || merged.factura_numero_fiscal || merged.nif_cliente || '';
  const artistName = merged.artist_name || merged.responsible_name || merged.nombre_apellidos || merged.persona_nombre || merged.formacion_nombre || merged.artista || '';
  const amount = money(merged.total_presupuestado || merged.factura_total_sin_iva || merged.cantidad_total_facturar || merged.formacion_total_factura || merged.total || 0);
  const data = {
    ...merged,
    type,
    form_template: merged.form_template || type,
    form_version: 'step51-planillas-descarga-roles-observaciones',
    reference,
    client_name: clientName,
    client_tax_id: clientTaxId,
    client_email: merged.client_email || merged.factura_email || '',
    artist_name: artistName,
    artist_tax_id: merged.artist_tax_id || merged.dni_nie || merged.persona_dni_nie || '',
    service_date: merged.service_date || merged.fecha_inicio_actuacion || merged.fecha_actuacion || merged.fecha_servicio || merged.periodo_inicio || today(),
    project_place: merged.project_place || merged.pais_ciudad_actuacion || merged.lugar_actuacion || merged.formacion_lugar || '',
    description: merged.description || merged.factura_concepto || merged.concepto_factura || merged.referencia_actuacion || reference,
    total_presupuestado: amount,
    source: 'OPERATIVO_2026_PLANILLA',
  };
  const missing = missingRequired(data, type);
  data.validation = { complete: !missing.length, missing, updated_at: new Date().toISOString() };
  return { type, data, missing };
}

async function notifyAndMessage({ petition, req, body, message, eventType, severity = 'WARN' }) {
  const adminId = req.user?.id || null;
  if (message) {
    await db.run(
      `INSERT INTO petition_messages (petition_id, from_user_id, from_role, to_user_id, body, kind)
       VALUES (?, ?, 'ADMIN', ?, ?, 'AVISO')`,
      [petition.id, adminId, petition.user_id, message]
    );
    await db.run(
      `INSERT INTO messages (petition_id, sender_user_id, sender_role, body)
       VALUES (?, ?, 'ADMIN', ?)`,
      [petition.id, adminId, message]
    ).catch(() => {});
  }
  await db.run(
    `INSERT OR IGNORE INTO notifications (user_id, message, dedupe_key, notif_type, severity, meta_json)
     VALUES (?, ?, ?, 'PETITION_STATUS', ?, ?)`,
    [petition.user_id, message || eventType, `ops:${petition.id}:${eventType}:${Date.now()}`, severity, JSON.stringify({ petition_id: petition.id })]
  ).catch(() => {});
}

function renderFieldRows(doc, data, fields) {
  for (const key of fields) {
    const value = data[key];
    if (value === undefined || value === null || String(value).trim() === '') continue;
    const label = labelForField(key);
    const clean = String(value).replace(/\s+/g, ' ').trim();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text(label, { continued: false });
    doc.font('Helvetica').fontSize(9).fillColor('#111').text(clean, { width: 480 });
    doc.moveDown(0.4);
  }
}

function streamFilledFormPdf({ res, petition, data, missing, requestedBy }) {
  const type = String(data.form_template || petition.type || '').toUpperCase();
  const groups = TEMPLATE_FIELD_GROUPS[type] || [['Datos cargados', Object.keys(data).filter((k) => !['validation','source'].includes(k))]];
  const doc = new PDFDocument({ size: 'A4', margin: 42, info: { Title: `Planilla completada - Petición ${petition.id}` } });
  const filename = `planilla-completada-peticion-${petition.id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#111').text('LA BONITA - PLANILLA COMPLETADA');
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10).fillColor('#555').text(`Petición #${petition.id} · ${templateLabel(type)} · Estado: ${petition.status}`);
  doc.text(`Generada: ${new Date().toLocaleString('es-ES')} · Solicitada por: ${requestedBy || 'sistema'}`);
  doc.moveDown(0.6);
  if (missing.length) {
    doc.roundedRect(42, doc.y, 510, 54, 8).fillAndStroke('#fff8d6', '#eadb8f');
    doc.fillColor('#6b5400').font('Helvetica-Bold').fontSize(10).text('Planilla con datos pendientes', 54, doc.y - 43, { width: 486 });
    doc.font('Helvetica').fontSize(9).text(`Faltan: ${missing.map((x) => x.label || x.key || x).join(', ')}`, { width: 486 });
    doc.moveDown(1.6);
  } else {
    doc.roundedRect(42, doc.y, 510, 34, 8).fillAndStroke('#e8fff1', '#9de7b5');
    doc.fillColor('#116b36').font('Helvetica-Bold').fontSize(10).text('Planilla con obligatorios completos', 54, doc.y - 26, { width: 486 });
    doc.moveDown(1.2);
  }
  doc.fillColor('#111');
  for (const [title, fields] of groups) {
    if (doc.y > 720) doc.addPage();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111').text(title.toUpperCase());
    doc.moveDown(0.2);
    renderFieldRows(doc, data, fields);
  }
  if (petition.admin_note || petition.rejection_reason) {
    if (doc.y > 690) doc.addPage();
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(12).text('OBSERVACIONES DE ADMINISTRACIÓN');
    doc.font('Helvetica').fontSize(10).fillColor('#111').text(petition.admin_note || petition.rejection_reason, { width: 500 });
  }
  doc.moveDown(1);
  doc.fontSize(8).fillColor('#777').text('Documento generado desde La Bonita. La numeración fiscal definitiva, cuando corresponda, será la asignada por DELSOL.', { align: 'center' });
  doc.end();
}


function templateTypeFromData(data, fallback = 'ALTA_FACTURA') {
  return String(data?.form_template || data?.type || fallback || 'ALTA_FACTURA').toUpperCase();
}

function missingRequired(data, type = null) {
  const t = templateTypeFromData(data, type);
  const required = TEMPLATE_RULES[t]?.required || [];
  return required.filter((key) => String(data?.[key] ?? '').trim() === '').map((key) => ({ key, label: FIELD_LABELS[key] || key }));
}

function isComplete(data, type = null) {
  return missingRequired(data, type).length === 0;
}

function shouldRequireLabor(data, type = null) {
  const t = templateTypeFromData(data, type);
  if (!TEMPLATE_RULES[t]?.laborRequired) return false;
  const sit = String(data?.situacion_laboral || '').toLowerCase();
  if (t === 'SERVICIO_PUNTUAL' && (sit.includes('autónom') || sit.includes('autonom') || sit.includes('grupo/compañía dentro') || sit.includes('grupo / compañía dentro') || sit.includes('internacional fuera'))) return false;
  return true;
}

function parseDateOnly(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

function businessDaysBetween(start, end) {
  if (!start || !end) return null;
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  let count = 0;
  while (s < e) {
    const day = s.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    s.setUTCDate(s.getUTCDate() + 1);
  }
  return count;
}

function automaticExtraFees(data) {
  const created = parseDateOnly(data.petition_date || data.created_at || today());
  const start = parseDateOnly(data.fecha_inicio_actuacion || data.periodo_inicio || data.service_date || data.fecha_actuacion);
  const businessDays = businessDaysBetween(created, start);
  const requiresA1 = String(data.requiere_a1 || '').toUpperCase() === 'SI' || String(data.a1 || '').toUpperCase() === 'SI';
  let amount = 0;
  const reasons = [];
  if (businessDays !== null && businessDays < 3) {
    amount += requiresA1 ? 10 : 5;
    reasons.push(requiresA1 ? 'Petición fuera de plazo con A1' : 'Petición fuera de plazo');
  }
  return { amount: money(amount), reason: reasons.join(' + '), business_days_notice: businessDays, requires_a1: requiresA1 };
}


function referenceFromData(p) {
  const data = safeJson(p.data);
  return data.reference || data.referencia || data.project_reference || data.titulo || data.nombre_proyecto || `PET-${p.id}`;
}

async function audit(req, { module, action, entity_type, entity_id, petition_id, before = null, after = null }) {
  try {
    await db.run(
      `INSERT INTO audit_log (user_id, user_role, module, action, entity_type, entity_id, petition_id, before_json, after_json)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.user?.id || null, req.user?.role || null, module, action, entity_type || null, entity_id || null, petition_id || null,
        before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null]
    );
  } catch (err) {
    // Audit must never block operations in local mode.
    console.error('[audit] failed', err.message);
  }
}

async function event(petitionId, req, eventType, payload = {}, fromStatus = null, toStatus = null) {
  await db.run(
    `INSERT INTO petition_events (petition_id, actor_user_id, actor_role, event_type, from_status, to_status, payload)
     VALUES (?,?,?,?,?,?,?)`,
    [petitionId, req.user?.id || null, req.user?.role || null, eventType, fromStatus, toStatus, JSON.stringify(payload)]
  );
}

async function getOrCreateParty({ kind, legal_name, display_name, tax_id, email, phone, country = 'ES' }) {
  const cleanTax = String(tax_id || '').trim();
  if (cleanTax) {
    const existing = await db.get(`SELECT * FROM lb_parties WHERE tax_id = ? AND kind IN (?, 'CLIENTE', 'COMPANIA', 'ARTISTA', 'ASOCIADA', 'PUNTUAL') LIMIT 1`, [cleanTax, kind]);
    if (existing) return existing;
  }
  const name = String(legal_name || display_name || 'Sin nombre').trim();
  const r = await db.run(
    `INSERT INTO lb_parties (kind, legal_name, display_name, tax_id, email, phone, country)
     VALUES (?,?,?,?,?,?,?)`,
    [kind, name, display_name || name, cleanTax || null, email || null, phone || null, country]
  );
  return db.get(`SELECT * FROM lb_parties WHERE id = ?`, [r.lastID]);
}

async function getPetition(id) {
  const p = await db.get(`SELECT * FROM petitions WHERE id = ?`, [id]);
  if (!p) return null;
  p.data_json = safeJson(p.data);
  p.reference = referenceFromData(p);
  return p;
}

async function controlForPetition(id) {
  const invoices = await db.get(`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS count FROM lb_internal_invoices WHERE petition_id = ? AND status <> 'ANULADA'`, [id]);
  const expenses = await db.get(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count FROM lb_expenses WHERE petition_id = ?`, [id]);
  const liquidations = await db.get(`SELECT COALESCE(SUM(net_amount),0) AS total, COUNT(*) AS count FROM lb_liquidations WHERE petition_id = ? AND status <> 'ANULADA'`, [id]);
  const ledgerIn = await db.get(`SELECT COALESCE(SUM(amount_eur),0) AS total FROM ledger_transactions WHERE petition_id = ? AND direction = 'IN'`, [id]);
  const ledgerOut = await db.get(`SELECT COALESCE(SUM(amount_eur),0) AS total FROM ledger_transactions WHERE petition_id = ? AND direction = 'OUT'`, [id]);
  const income = money(invoices.total);
  const committed = money(expenses.total) + money(liquidations.total);
  const cashBalance = money(ledgerIn.total) - money(ledgerOut.total);
  return {
    invoice_count: invoices.count || 0,
    income_total: income,
    expenses_count: expenses.count || 0,
    expenses_total: money(expenses.total),
    liquidations_count: liquidations.count || 0,
    liquidations_total: money(liquidations.total),
    committed_total: money(committed),
    projected_margin: money(income - committed),
    ledger_in: money(ledgerIn.total),
    ledger_out: money(ledgerOut.total),
    cash_balance: money(cashBalance),
    balance_to_zero: money(income - committed - cashBalance),
  };
}

exports.summary = async (_req, res) => {
  try {
    const petitions = await db.get(`SELECT COUNT(*) AS total, SUM(CASE WHEN status NOT IN ('CERRADA_CERO','RECHAZADA') THEN 1 ELSE 0 END) AS active FROM petitions`);
    const invoices = await db.get(`SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS total FROM lb_internal_invoices WHERE status <> 'ANULADA'`);
    const queue = await db.get(`SELECT COUNT(*) AS pending FROM delsol_sync_queue WHERE status IN ('pending','error','blocked_permission')`);
    const contracts = await db.get(`SELECT COUNT(*) AS count FROM lb_contracts`);
    const expenses = await db.get(`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM lb_expenses`);
    const recent = await db.all(`SELECT id, type, status, data, created_at FROM petitions ORDER BY id DESC LIMIT 8`);
    res.json({
      petitions_total: petitions.total || 0,
      petitions_active: petitions.active || 0,
      invoices_count: invoices.count || 0,
      invoices_total: money(invoices.total),
      contracts_count: contracts.count || 0,
      expenses_count: expenses.count || 0,
      expenses_total: money(expenses.total),
      delsol_pending: queue.pending || 0,
      recent: recent.map((p) => ({ id: p.id, type: p.type, status: p.status, reference: referenceFromData(p), created_at: p.created_at })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listPetitions = async (_req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM petitions ORDER BY id DESC LIMIT 500`);
    const out = [];
    for (const p of rows) {
      const c = await controlForPetition(p.id);
      const data = safeJson(p.data);
      out.push({
        id: p.id,
        type: p.type,
        status: p.status,
        reference: referenceFromData(p),
        client: data.client_name || data.cliente_nombre || data.cliente || '',
        artist: data.artist_name || data.artista_nombre || data.artista || '',
        project_date: data.service_date || data.fecha_servicio || data.fecha_inicio || '',
        created_at: p.created_at,
        delsol_sync_status: p.delsol_sync_status || 'PENDING',
        control: c,
      });
    }
    res.json({ rows: out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPetition = async (req, res) => {
  try {
    const body = req.body || {};
    const { type, data, missing } = normalizePayload(body, {}, 'ALTA_FACTURA');
    const status = missing.length ? 'BORRADOR_INCOMPLETO' : 'ESPERANDO_VALIDACION';
    data.validation.status = status;

    const r = await db.run(
      `INSERT INTO petitions (user_id, type, data, status, created_at, updated_at)
       VALUES (?,?,?,?,datetime('now'),datetime('now'))`,
      [req.user.id, type, JSON.stringify(data), status]
    );
    await event(r.lastID, req, 'OPERATIVO_PETICION_CREADA_DESDE_PLANILLA', { reference: data.reference, type, form_template: data.form_template, missing }, null, status);
    await audit(req, { module: 'operativo', action: 'create_petition_from_template', entity_type: 'petition', entity_id: r.lastID, petition_id: r.lastID, after: data });
    res.status(201).json({ ok: true, id: r.lastID, status, missing, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePetition = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const current = p.data_json || {};
    const body = req.body || {};
    const { type, data: merged, missing } = normalizePayload(body, current, p.type);
    let status = p.status;
    if (['BORRADOR_INCOMPLETO','BORRADOR','ESPERANDO_VALIDACION','OBSERVADA_CORRECCION','PENDIENTE_INFO','PENDIENTE_VALIDACION'].includes(String(p.status || '').toUpperCase())) {
      status = missing.length ? 'BORRADOR_INCOMPLETO' : 'ESPERANDO_VALIDACION';
    }
    merged.validation.status = status;
    await db.run(`UPDATE petitions SET type = ?, data = ?, status = ?, locked = 0, updated_at = datetime('now') WHERE id = ?`, [type, JSON.stringify(merged), status, id]);
    await event(id, req, 'OPERATIVO_PETICION_ACTUALIZADA', { missing }, p.status, status);
    await audit(req, { module: 'operativo', action: 'update_petition_template', entity_type: 'petition', entity_id: id, petition_id: id, before: current, after: merged });
    res.json({ ok: true, id, status, missing, data: merged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validatePetition = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    if (String(p.status || '').toUpperCase() === 'RECHAZADA') return res.status(409).json({ error: 'No se puede validar una petición rechazada.' });
    const data = p.data_json || {};
    const missing = missingRequired(data, p.type);
    if (missing.length) return res.status(400).json({ error: 'No se puede validar: faltan campos obligatorios', missing });
    await db.run(`UPDATE petitions SET status = 'VALIDADA', locked = 1, admin_note = NULL, rejection_reason = NULL, pending_checklist = NULL, updated_at = datetime('now') WHERE id = ?`, [id]);
    await event(id, req, 'PETICION_VALIDADA_ADMIN', { validated_by: req.user?.id || null }, p.status, 'VALIDADA');
    await audit(req, { module: 'validacion', action: 'validate_petition', entity_type: 'petition', entity_id: id, petition_id: id, after: data });
    res.json({ ok: true, id, status: 'VALIDADA' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const [invoices, contracts, expenses, liquidations, laboral, queue, auditRows] = await Promise.all([
      db.all(`SELECT * FROM lb_internal_invoices WHERE petition_id = ? ORDER BY id DESC`, [id]),
      db.all(`SELECT * FROM lb_contracts WHERE petition_id = ? ORDER BY id DESC`, [id]),
      db.all(`SELECT * FROM lb_expenses WHERE petition_id = ? ORDER BY id DESC`, [id]),
      db.all(`SELECT l.*, p.display_name AS person_name FROM lb_liquidations l LEFT JOIN lb_parties p ON p.id = l.person_party_id WHERE l.petition_id = ? ORDER BY l.id DESC`, [id]),
      db.all(`SELECT * FROM lb_laboral_movements WHERE petition_id = ? ORDER BY id DESC`, [id]),
      db.all(`SELECT * FROM delsol_sync_queue WHERE petition_id = ? ORDER BY id DESC`, [id]),
      db.all(`SELECT * FROM audit_log WHERE petition_id = ? ORDER BY id DESC LIMIT 50`, [id]),
    ]);
    for (const inv of invoices) {
      inv.lines = await db.all(`SELECT * FROM lb_invoice_lines WHERE invoice_id = ?`, [inv.id]);
    }
    res.json({ petition: p, invoices, contracts, expenses, liquidations, laboral, queue, audit: auditRows, control: await controlForPetition(id), missing_required: missingRequired(p.data_json, p.type) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function createQueue({ entity_type, entity_id, petition_id, operation, payload }) {
  const r = await db.run(
    `INSERT INTO delsol_sync_queue (entity_type, entity_id, petition_id, operation, payload, status)
     VALUES (?,?,?,?,?,'pending')`,
    [entity_type, entity_id, petition_id || null, operation, JSON.stringify(payload || {})]
  );
  return r.lastID;
}


exports.templates = async (_req, res) => {
  res.json({ templates: Object.entries(TEMPLATE_RULES).map(([key, value]) => ({
    key,
    label: value.label,
    required: value.required.map((field) => ({ key: field, label: labelForField(field) })),
    groups: (TEMPLATE_FIELD_GROUPS[key] || []).map(([title, fields]) => ({ title, fields: fields.map((field) => ({ key: field, label: labelForField(field), required: value.required.includes(field) })) })),
  })) });
};

exports.listMine = async (req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM petitions WHERE user_id = ? ORDER BY id DESC LIMIT 200`, [req.user.id]);
    res.json({ rows: rows.map((p) => {
      const data = safeJson(p.data);
      return { id: p.id, type: p.type, status: p.status, reference: referenceFromData(p), data_json: data, missing_required: missingRequired(data, p.type), admin_note: p.admin_note, rejection_reason: p.rejection_reason, created_at: p.created_at, updated_at: p.updated_at };
    }) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createMine = async (req, res) => {
  try {
    const { type, data, missing } = normalizePayload(req.body || {}, {}, 'ALTA_FACTURA');
    const status = 'BORRADOR_INCOMPLETO';
    data.validation.status = status;
    const r = await db.run(`INSERT INTO petitions (user_id, type, data, status, locked, created_at, updated_at) VALUES (?,?,?,?,0,datetime('now'),datetime('now'))`, [req.user.id, type, JSON.stringify(data), status]);
    await event(r.lastID, req, 'USUARIO_PLANILLA_GUARDADA', { missing }, null, status);
    await audit(req, { module: 'portal_usuario', action: 'create_my_petition', entity_type: 'petition', entity_id: r.lastID, petition_id: r.lastID, after: data });
    res.status(201).json({ ok: true, id: r.lastID, status, missing });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateMine = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await db.get(`SELECT * FROM petitions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    if (!['BORRADOR_INCOMPLETO','BORRADOR','ESPERANDO_VALIDACION','OBSERVADA_CORRECCION','PENDIENTE_INFO'].includes(String(p.status || '').toUpperCase()) || p.locked) {
      return res.status(409).json({ error: 'La petición no está editable en este estado. Si necesitás corregirla, administración debe observarla.' });
    }
    const current = safeJson(p.data);
    const { type, data, missing } = normalizePayload(req.body || {}, current, p.type);
    const status = missing.length ? 'BORRADOR_INCOMPLETO' : 'ESPERANDO_VALIDACION';
    data.validation.status = status;
    await db.run(`UPDATE petitions SET type = ?, data = ?, status = ?, locked = 0, updated_at = datetime('now') WHERE id = ?`, [type, JSON.stringify(data), status, id]);
    await event(id, req, 'USUARIO_PLANILLA_ACTUALIZADA', { missing }, p.status, status);
    await audit(req, { module: 'portal_usuario', action: 'update_my_petition', entity_type: 'petition', entity_id: id, petition_id: id, before: current, after: data });
    res.json({ ok: true, id, status, missing });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.submitMine = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await db.get(`SELECT * FROM petitions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    if (!['BORRADOR_INCOMPLETO','BORRADOR','ESPERANDO_VALIDACION','OBSERVADA_CORRECCION','PENDIENTE_INFO'].includes(String(p.status || '').toUpperCase())) {
      return res.status(409).json({ error: 'La petición no puede enviarse en este estado.' });
    }
    const data = safeJson(p.data);
    const missing = missingRequired(data, p.type);
    await db.run(`UPDATE petitions SET status = 'PENDIENTE_VALIDACION', locked = 1, pending_checklist = ?, pending_checklist_updated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`, [JSON.stringify({ missing_required: missing }), id]);
    await event(id, req, 'USUARIO_PLANILLA_ENVIADA_A_REVISION', { missing }, p.status, 'PENDIENTE_VALIDACION');
    await audit(req, { module: 'portal_usuario', action: 'submit_my_petition', entity_type: 'petition', entity_id: id, petition_id: id, after: { missing } });
    res.json({ ok: true, id, status: 'PENDIENTE_VALIDACION', missing, note: missing.length ? 'Enviada con datos faltantes para revisión administrativa.' : 'Enviada completa para validación administrativa.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.detailMine = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await db.get(`SELECT * FROM petitions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const data = safeJson(p.data);
    const [docs, messages] = await Promise.all([
      db.all(`SELECT id, doc_type, original_name, is_official, uploaded_by_role, created_at FROM documents WHERE petition_id = ? AND (user_id = ? OR is_official = 1) ORDER BY created_at DESC`, [id, req.user.id]),
      db.all(`SELECT id, from_role, body, kind, created_at, read_at FROM petition_messages WHERE petition_id = ? ORDER BY id DESC LIMIT 50`, [id]),
    ]);
    res.json({ petition: { ...p, data_json: data }, missing_required: missingRequired(data, p.type), docs, messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.requestInfo = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'El mensaje de observación es obligatorio.' });
    const missing = missingRequired(p.data_json, p.type);
    await db.run(`UPDATE petitions SET status = 'OBSERVADA_CORRECCION', locked = 0, admin_note = ?, pending_checklist = ?, pending_checklist_updated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`, [message, JSON.stringify({ missing_required: missing }), id]);
    await notifyAndMessage({ petition: p, req, message, eventType: 'OBSERVADA_CORRECCION' });
    await event(id, req, 'ADMIN_OBSERVA_PLANILLA', { message, missing }, p.status, 'OBSERVADA_CORRECCION');
    await audit(req, { module: 'validacion', action: 'request_correction', entity_type: 'petition', entity_id: id, petition_id: id, after: { message, missing } });
    res.json({ ok: true, id, status: 'OBSERVADA_CORRECCION', missing });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.rejectPetition = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'El motivo de rechazo es obligatorio.' });
    await db.run(`UPDATE petitions SET status = 'RECHAZADA', locked = 1, rejection_reason = ?, updated_at = datetime('now') WHERE id = ?`, [message, id]);
    await notifyAndMessage({ petition: p, req, message, eventType: 'RECHAZADA', severity: 'ERROR' });
    await event(id, req, 'ADMIN_RECHAZA_PETICION', { message }, p.status, 'RECHAZADA');
    await audit(req, { module: 'validacion', action: 'reject_petition', entity_type: 'petition', entity_id: id, petition_id: id, after: { message } });
    res.json({ ok: true, id, status: 'RECHAZADA' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.downloadFilledFormAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const data = p.data_json || {};
    return streamFilledFormPdf({ res, petition: p, data, missing: missingRequired(data, p.type), requestedBy: 'administración' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.downloadFilledFormMine = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await db.get(`SELECT * FROM petitions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const data = safeJson(p.data);
    return streamFilledFormPdf({ res, petition: { ...p, data_json: data }, data, missing: missingRequired(data, p.type), requestedBy: 'usuario' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};


exports.createLaboralMovement = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const data = p.data_json || {};
    const missing = missingRequired(data, p.type);
    if (missing.length) return res.status(400).json({ error: 'No se puede preparar alta/baja: faltan campos obligatorios', missing });
    if (!['VALIDADA','ALTA_BAJA_INTERNA','CONTRATO_EN_CURSO','FACTURA_INTERNA','LIQUIDACION_INTERNA'].includes(String(p.status || '').toUpperCase())) {
      return res.status(400).json({ error: 'Antes de preparar laboral, la petición debe estar validada por administración.' });
    }
    const body = req.body || {};
    const requiresA1 = String(body.requires_a1 ?? data.requiere_a1 ?? data.a1 ?? '').toUpperCase() === 'SI';
    const payload = {
      ejercicio: String(body.ejercicio || '2026'),
      type: templateTypeFromData(data, p.type),
      reference: data.reference || p.reference,
      person_name: body.person_name || data.artist_name || data.nombre_apellidos || data.responsible_name || data.formacion_nombre || 'Persona sin nombre',
      person_tax_id: body.person_tax_id || data.artist_tax_id || data.dni_nie || '',
      start_date: body.start_date || data.fecha_inicio_actuacion || data.periodo_inicio || data.service_date || '',
      end_date: body.end_date || data.fecha_fin_actuacion || data.periodo_fin || data.service_date || data.fecha_inicio_actuacion || '',
      requires_a1: requiresA1,
      note: body.note || data.comentarios || '',
    };
    const r = await db.run(
      `INSERT INTO lb_laboral_movements (petition_id, movement_type, person_name, person_tax_id, start_date, end_date, requires_a1, status, payload_json, created_by_user_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, body.movement_type || (requiresA1 ? 'A1' : 'ALTA_BAJA'), payload.person_name, payload.person_tax_id, payload.start_date, payload.end_date, requiresA1 ? 1 : 0, 'PREPARADO', JSON.stringify(payload), req.user.id]
    );
    await createQueue({ entity_type: 'laboral', entity_id: r.lastID, petition_id: id, operation: requiresA1 ? 'prepare_a1_and_alta_baja' : 'prepare_alta_baja', payload });
    await db.run(`UPDATE petitions SET status = ?, updated_at = datetime('now') WHERE id = ?`, ['ALTA_BAJA_INTERNA', id]);
    await event(id, req, 'ALTA_BAJA_PREPARADA', { laboral_id: r.lastID, requires_a1: requiresA1 }, p.status, 'ALTA_BAJA_INTERNA');
    await audit(req, { module: 'laboral', action: 'prepare_laboral_movement', entity_type: 'laboral', entity_id: r.lastID, petition_id: id, after: payload });
    res.status(201).json({ ok: true, id: r.lastID, status: 'PREPARADO', payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const body = req.body || {};
    const data = p.data_json || {};
    const type = templateTypeFromData(data, p.type);
    const missing = missingRequired(data, type);
    if (missing.length) return res.status(400).json({ error: 'No se puede crear factura: la planilla tiene campos obligatorios pendientes.', missing });
    if (!['VALIDADA','ALTA_BAJA_INTERNA','CONTRATO_EN_CURSO','FACTURA_INTERNA','LIQUIDACION_INTERNA'].includes(String(p.status || '').toUpperCase())) {
      return res.status(400).json({ error: 'No se puede crear factura: primero la administración debe validar la petición.' });
    }
    if (shouldRequireLabor(data, type)) {
      const labor = await db.get(`SELECT COUNT(*) AS count FROM lb_laboral_movements WHERE petition_id = ? AND status IN ('PREPARADO','ENVIADO_DELSOL','CONFIRMADO','NO_REQUIERE')`, [id]);
      if (!labor || !labor.count) return res.status(400).json({ error: 'No se puede crear factura todavía: primero debe prepararse Alta/Baja, A1 o contrato laboral interno según el Mapa de Peticiones.' });
    }
    const subtotal = money(body.subtotal || body.total || data.total_presupuestado || 0);
    if (subtotal <= 0) return res.status(400).json({ error: 'No se puede crear factura con total cero. Revisá la cantidad total a facturar de la planilla.' });
    const ivaRate = Number(body.iva_rate ?? 0);
    const ivaTotal = money(subtotal * ivaRate / 100);
    const total = money(subtotal + ivaTotal);
    const rule = TEMPLATE_RULES[type] || TEMPLATE_RULES.ALTA_FACTURA;
    const commissionRate = Number(body.commission_rate !== undefined && body.commission_rate !== '' ? body.commission_rate : rule.defaultCommissionRate * 100) / 100;
    const irpfRate = Number(body.irpf_rate ?? 2) / 100;
    const extras = automaticExtraFees(data);
    const manualExtras = money(body.extra_fees_amount || 0);
    const extraFees = money(extras.amount + manualExtras);
    const extraReason = [extras.reason, body.extra_fees_reason].filter(Boolean).join(' + ');
    const commissionBase = money(total * commissionRate);
    const commission = money(Math.max(commissionBase, rule.minCommission || 0) + extraFees);
    const irpf = money((total - commission) * irpfRate);
    const net = money(total - commission - irpf);
    const customer = await getOrCreateParty({
      kind: 'CLIENTE',
      legal_name: body.client_name || data.client_name || 'Cliente sin nombre',
      tax_id: body.client_tax_id || data.client_tax_id || '',
      email: body.client_email || data.client_email || '',
    });
    const seq = await db.get(`SELECT COUNT(*) + 1 AS n FROM lb_internal_invoices WHERE internal_number LIKE ?`, [`LB-FAC-BORRADOR-${String(body.ejercicio || '2026')}-%`]);
    const year = String(body.ejercicio || '2026');
    const internal = `LB-FAC-BORRADOR-${year}-${String(seq.n || 1).padStart(6, '0')}`;
    const concept = body.concept || data.description || data.reference || `Servicio artístico petición #${id}`;
    const r = await db.run(
      `INSERT INTO lb_internal_invoices
       (petition_id, internal_number, customer_party_id, issue_date, service_date, concept, subtotal, iva_rate, iva_total, total, commission_rate, commission_amount, irpf_rate, irpf_amount, net_artist, status, delsol_status, delsol_payload, created_by_user_id, extra_fees_amount, extra_fees_reason)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, internal, customer.id, body.issue_date || today(), body.service_date || data.service_date || today(), concept, subtotal, ivaRate, ivaTotal, total, commissionRate, commission, irpfRate, irpf, net, 'PENDIENTE_DELSOL', 'PENDING', JSON.stringify({ extras }), req.user.id, extraFees, extraReason]
    );
    await db.run(`INSERT INTO lb_invoice_lines (invoice_id, concept, quantity, unit_price, iva_rate, total) VALUES (?,?,?,?,?,?)`, [r.lastID, concept, 1, subtotal, ivaRate, total]);
    if (extraFees > 0) {
      await db.run(`INSERT INTO lb_invoice_lines (invoice_id, concept, quantity, unit_price, iva_rate, total) VALUES (?,?,?,?,?,?)`, [r.lastID, `Comisiones/tarifas internas: ${extraReason || 'extras'}`, 1, extraFees, 0, extraFees]);
    }
    const payload = { ejercicio: year, tabla_cliente: 'F_CLI', tabla_factura: 'PENDIENTE_CONFIRMAR', internal_number: internal, customer, invoice: { subtotal, ivaRate, total, commission, irpf, net, concept, extraFees, extraReason } };
    await createQueue({ entity_type: 'invoice', entity_id: r.lastID, petition_id: id, operation: 'create_invoice_draft', payload });
    await db.run(`UPDATE petitions SET status = ?, delsol_sync_status = ?, updated_at = datetime('now') WHERE id = ?`, ['FACTURA_INTERNA', 'PENDING', id]);
    await event(id, req, 'FACTURA_INTERNA_CREADA', { invoice_id: r.lastID, internal_number: internal, total, commission, irpf, net, extraFees }, p.status, 'FACTURA_INTERNA');
    await audit(req, { module: 'facturacion', action: 'create_internal_invoice', entity_type: 'invoice', entity_id: r.lastID, petition_id: id, after: payload });
    res.status(201).json({ ok: true, id: r.lastID, internal_number: internal, total, net_artist: net, commission_amount: commission, extra_fees_amount: extraFees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createContract = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const body = req.body || {};
    const title = body.title || `Contrato / acuerdo - ${p.reference}`;
    const r = await db.run(
      `INSERT INTO lb_contracts (petition_id, contract_type, title, status, payload_json, created_by_user_id)
       VALUES (?,?,?,?,?,?)`,
      [id, body.contract_type || 'COLABORACION', title, body.status || 'PENDIENTE_FIRMA', JSON.stringify({ petition: p.reference, notes: body.notes || '' }), req.user.id]
    );
    await db.run(`UPDATE petitions SET status = ?, updated_at = datetime('now') WHERE id = ?`, ['CONTRATO_EN_CURSO', id]);
    await event(id, req, 'CONTRATO_CREADO', { contract_id: r.lastID, title }, p.status, 'CONTRATO_EN_CURSO');
    await audit(req, { module: 'contratos', action: 'create_contract', entity_type: 'contract', entity_id: r.lastID, petition_id: id, after: { title } });
    res.status(201).json({ ok: true, id: r.lastID, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const body = req.body || {};
    const amount = money(body.amount);
    const r = await db.run(
      `INSERT INTO lb_expenses (petition_id, label, category, amount, paid_by, receipt_ref, occurred_at, created_by_user_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, body.label || 'Gasto general', body.category || 'GENERAL', amount, body.paid_by || '', body.receipt_ref || '', body.occurred_at || today(), req.user.id]
    );
    await createQueue({ entity_type: 'expense', entity_id: r.lastID, petition_id: id, operation: 'create_expense', payload: { ejercicio: '2026', label: body.label, amount } });
    await event(id, req, 'GASTO_CARGADO', { expense_id: r.lastID, amount });
    await audit(req, { module: 'gastos', action: 'add_expense', entity_type: 'expense', entity_id: r.lastID, petition_id: id, after: body });
    res.status(201).json({ ok: true, id: r.lastID, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLiquidation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const petitionStatus = String(p.status || '').toUpperCase();
    if (!['FACTURA_INTERNA', 'LIQUIDACION_INTERNA'].includes(petitionStatus)) {
      return res.status(400).json({ error: 'No se puede crear liquidación todavía: primero debe existir factura interna aprobada en administración.' });
    }
    const existingInvoice = await db.get(
      `SELECT id, total FROM lb_internal_invoices WHERE petition_id = ? AND status <> 'ANULADA' ORDER BY id DESC LIMIT 1`,
      [id]
    );
    if (!existingInvoice) {
      return res.status(400).json({ error: 'No se puede crear liquidación: la petición no tiene factura interna activa.' });
    }
    const body = req.body || {};
    const gross = money(body.gross_amount || body.gross || existingInvoice.total || p.data_json.total_presupuestado || 0);
    if (gross <= 0) {
      return res.status(400).json({ error: 'No se puede crear liquidación con importe bruto cero.' });
    }
    const commission = money(body.commission_amount ?? gross * 0.10);
    const irpf = money(body.irpf_amount ?? (gross - commission) * 0.02);
    const reimb = money(body.expense_reimbursements || 0);
    const net = money(gross - commission - irpf + reimb);
    const person = await getOrCreateParty({
      kind: body.person_kind || 'ARTISTA',
      legal_name: body.person_name || p.data_json.artist_name || 'Artista sin nombre',
      tax_id: body.person_tax_id || p.data_json.artist_tax_id || '',
    });
    const r = await db.run(
      `INSERT INTO lb_liquidations (petition_id, person_party_id, gross_amount, commission_amount, irpf_amount, expense_reimbursements, net_amount, status, created_by_user_id)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, person.id, gross, commission, irpf, reimb, net, body.status || 'PENDIENTE_PAGO', req.user.id]
    );
    await createQueue({ entity_type: 'liquidation', entity_id: r.lastID, petition_id: id, operation: 'create_laboral_or_payment', payload: { ejercicio: '2026', gross, commission, irpf, net, person } });
    await db.run(`UPDATE petitions SET status = ?, updated_at = datetime('now') WHERE id = ?`, ['LIQUIDACION_INTERNA', id]);
    await event(id, req, 'LIQUIDACION_CREADA', { liquidation_id: r.lastID, net }, p.status, 'LIQUIDACION_INTERNA');
    await audit(req, { module: 'liquidaciones', action: 'create_liquidation', entity_type: 'liquidation', entity_id: r.lastID, petition_id: id, after: { gross, commission, irpf, net } });
    res.status(201).json({ ok: true, id: r.lastID, net_amount: net });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.closeIfZero = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPetition(id);
    if (!p) return res.status(404).json({ error: 'Petición no encontrada' });
    const c = await controlForPetition(id);
    if (Math.abs(c.balance_to_zero) > 0.01) {
      return res.status(400).json({ error: `No se puede cerrar: balance a cero pendiente €${c.balance_to_zero.toFixed(2)}`, control: c });
    }
    await db.run(`UPDATE petitions SET status = 'CERRADA_CERO', updated_at = datetime('now') WHERE id = ?`, [id]);
    await event(id, req, 'PETICION_CERRADA_CERO', { control: c }, p.status, 'CERRADA_CERO');
    await audit(req, { module: 'control_total', action: 'close_zero', entity_type: 'petition', entity_id: id, petition_id: id, after: c });
    res.json({ ok: true, control: c });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM petitions ORDER BY id DESC LIMIT 1000`);
    const header = ['id','type','status','reference','client','artist','income_total','expenses_total','liquidations_total','projected_margin','balance_to_zero'];
    const lines = [header.join(';')];
    for (const p of rows) {
      const data = safeJson(p.data);
      const c = await controlForPetition(p.id);
      lines.push([
        p.id, p.type, p.status, referenceFromData(p), data.client_name || '', data.artist_name || '', c.income_total, c.expenses_total, c.liquidations_total, c.projected_margin, c.balance_to_zero,
      ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="labonita-control-total.csv"');
    res.send('\ufeff' + lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportAltasBajasCsv = async (_req, res) => {
  try {
    const rows = await db.all(`SELECT l.*, p.type, p.status AS petition_status, p.data FROM lb_laboral_movements l LEFT JOIN petitions p ON p.id = l.petition_id ORDER BY l.id DESC LIMIT 2000`);
    const header = ['id','petition_id','type','petition_status','reference','movement_type','person_name','person_tax_id','start_date','end_date','requires_a1','status'];
    const lines = [header.join(';')];
    for (const r of rows) {
      const data = safeJson(r.data);
      lines.push([r.id,r.petition_id,r.type,r.petition_status,referenceFromData({ ...r, id: r.petition_id, data: r.data }),r.movement_type,r.person_name,r.person_tax_id,r.start_date,r.end_date,r.requires_a1 ? 'SI' : 'NO',r.status]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="labonita-altas-bajas.csv"');
    res.send('\ufeff' + lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportGastosCsv = async (_req, res) => {
  try {
    const rows = await db.all(`SELECT e.*, p.type, p.status AS petition_status, p.data FROM lb_expenses e LEFT JOIN petitions p ON p.id = e.petition_id ORDER BY e.id DESC LIMIT 2000`);
    const header = ['id','petition_id','reference','category','label','amount','paid_by','receipt_ref','occurred_at','petition_status'];
    const lines = [header.join(';')];
    for (const r of rows) {
      lines.push([r.id,r.petition_id,referenceFromData({ ...r, id: r.petition_id, data: r.data }),r.category,r.label,r.amount,r.paid_by,r.receipt_ref,r.occurred_at,r.petition_status]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="labonita-control-gastos.csv"');
    res.send('\ufeff' + lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportLiquidacionesCsv = async (_req, res) => {
  try {
    const rows = await db.all(`SELECT l.*, party.display_name AS person_name, p.type, p.status AS petition_status, p.data FROM lb_liquidations l LEFT JOIN lb_parties party ON party.id = l.person_party_id LEFT JOIN petitions p ON p.id = l.petition_id ORDER BY l.id DESC LIMIT 2000`);
    const header = ['id','petition_id','reference','person_name','gross_amount','commission_amount','irpf_amount','expense_reimbursements','net_amount','status','petition_status'];
    const lines = [header.join(';')];
    for (const r of rows) {
      lines.push([r.id,r.petition_id,referenceFromData({ ...r, id: r.petition_id, data: r.data }),r.person_name,r.gross_amount,r.commission_amount,r.irpf_amount,r.expense_reimbursements,r.net_amount,r.status,r.petition_status]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="labonita-liquidaciones.csv"');
    res.send('\ufeff' + lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
