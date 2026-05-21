const opsCtrl = require('../operations/operations.controller');
const delsolCtrl = require('../delsol/delsol.controller');
const docsCtrl = require('../documents/documents.controller');

function controllerCall(fn, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        if (this.statusCode >= 400) {
          const err = new Error(body?.error || `Demo step failed with HTTP ${this.statusCode}`);
          err.statusCode = this.statusCode;
          err.body = body;
          reject(err);
          return;
        }
        resolve({ status: this.statusCode, body });
      },
    };
    Promise.resolve(fn(req, res)).catch(reject);
  });
}

function suffix() {
  return `${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 999)}`;
}

function altaFacturaPayload(label, amount, overrides = {}) {
  const s = suffix();
  return {
    type: 'ALTA_FACTURA',
    form_template: 'ALTA_FACTURA',
    petition_date: new Date().toISOString().slice(0, 10),
    responsible_name: `Tutorial ${label}`,
    company_show: `La Bonita Demo - ${label}`,
    reference: `TUTORIAL-${label}-${s}`,
    pais_ciudad_actuacion: 'Barcelona, Espana',
    fecha_inicio_actuacion: '2026-06-15',
    fecha_fin_actuacion: '2026-06-15',
    requiere_a1: 'NO',
    viaje_ida: '2026-06-14',
    viaje_vuelta: '2026-06-16',
    client_name: `Cliente Demo ${label} S.L.`,
    client_tax_id: 'B12345678',
    client_email: `demo-${label.toLowerCase()}@labonita.test`,
    factura_direccion: 'Carrer Demo 123',
    factura_cp: '08019',
    factura_ciudad: 'Barcelona',
    factura_provincia: 'Barcelona',
    factura_pais: 'Espana',
    factura_concepto: `Servicio artistico demo ${label}`,
    factura_total_sin_iva: amount,
    iva_tipo: '21%',
    reparto_cache_personas: '1',
    comentarios: 'Creado por tutorial integral para probar flujo real.',
    ...overrides,
  };
}

function formacionPayload(label, amount, overrides = {}) {
  const s = suffix();
  return {
    type: 'CONTRATO_FORMACION',
    form_template: 'CONTRATO_FORMACION',
    formacion_nombre: `Docente Tutorial ${label}`,
    nivel_estudios: 'Superior',
    reference: `TUTORIAL-FORMACION-${label}-${s}`,
    periodo_inicio: '2026-07-01',
    periodo_fin: '2026-07-31',
    tipo_clases: 'Clases regulares',
    dias_semana: 'Lunes y miercoles',
    horario_clases: '10:00-12:00',
    importe_hora: 40,
    importe_tipo: 'Coste total',
    formacion_lugar: 'Centro cultural demo',
    formacion_direccion: 'Carrer Formacion 45',
    formacion_ciudad: 'Barcelona',
    cuando_factura: 'Mensual',
    client_name: `Escuela Demo ${label} S.L.`,
    client_tax_id: 'B87654321',
    client_email: `formacion-${label.toLowerCase()}@labonita.test`,
    factura_direccion: 'Carrer Escola 8',
    factura_cp: '08010',
    factura_ciudad: 'Barcelona',
    factura_pais: 'Espana',
    factura_concepto: `Formacion artistica demo ${label}`,
    factura_total_sin_iva: amount,
    iva_tipo: '21%',
    comentarios: 'Creado por tutorial integral: contrato de formacion con laboral, factura y nomina interna.',
    ...overrides,
  };
}

function servicioPuntualPayload(label, amount, overrides = {}) {
  const s = suffix();
  return {
    type: 'SERVICIO_PUNTUAL',
    form_template: 'SERVICIO_PUNTUAL',
    nombre_apellidos: `Artista Puntual ${label}`,
    domicilio: 'Calle Puntual 14',
    codigo_postal: '28013',
    ciudad_localidad: 'Madrid',
    provincia: 'Madrid',
    dni_nie: '12345678Z',
    telefono: '600000000',
    email: `puntual-${label.toLowerCase()}@labonita.test`,
    profesion: 'Artista',
    fecha_nacimiento: '1990-01-01',
    situacion_familiar: '3',
    situacion_laboral: 'Resido en Espana y necesito soporte legal para proyecto puntual',
    acepta_acuerdo: 'SI',
    reference: `TUTORIAL-PUNTUAL-${label}-${s}`,
    client_name: `Cliente Puntual ${label} S.L.`,
    client_tax_id: 'B11223344',
    factura_direccion: 'Calle Cliente Puntual 9',
    factura_cp: '28014',
    factura_ciudad: 'Madrid',
    factura_pais: 'Espana',
    factura_concepto: `Servicio puntual artistico demo ${label}`,
    factura_total_sin_iva: amount,
    iva_tipo: '21%',
    comentarios: 'Creado por tutorial integral: servicio puntual con alta/baja, factura y liquidacion.',
    ...overrides,
  };
}

function personaAsociadaPayload(label, overrides = {}) {
  const s = suffix();
  return {
    type: 'PERSONA_ASOCIADA',
    form_template: 'PERSONA_ASOCIADA',
    nombre_apellidos: `Persona Asociada ${label}`,
    domicilio: 'Calle Socia 22',
    codigo_postal: '46001',
    ciudad_localidad: 'Valencia',
    provincia: 'Valencia',
    dni_nie: '87654321X',
    telefono: '611111111',
    email: `socia-${label.toLowerCase()}@labonita.test`,
    profesion: 'Artista visual',
    fecha_nacimiento: '1988-03-10',
    situacion_familiar: '3',
    acepta_estatutos: 'SI',
    reference: `TUTORIAL-SOCIA-${label}-${s}`,
    comentarios: 'Creado por tutorial integral: alta de persona asociada sin factura automatica.',
    ...overrides,
  };
}

async function create(req, data) {
  const out = await controllerCall(opsCtrl.createPetition, { ...req, body: data, params: {} });
  return out.body.id;
}

async function validate(req, id) {
  return controllerCall(opsCtrl.validatePetition, { ...req, params: { id }, body: {} });
}

async function laboral(req, id, data) {
  return controllerCall(opsCtrl.createLaboralMovement, {
    ...req,
    params: { id },
    body: {
      person_name: data.person_name,
      person_tax_id: data.person_tax_id,
      start_date: data.start_date,
      end_date: data.end_date,
      requires_a1: data.requires_a1 || 'NO',
      note: data.note || 'Alta/baja creada por tutorial integral.',
    },
  });
}

async function invoice(req, id, data) {
  return controllerCall(opsCtrl.createInvoice, {
    ...req,
    params: { id },
    body: {
      concept: data.concept,
      subtotal: data.subtotal,
      iva_rate: data.iva_rate ?? 21,
      commission_rate: data.commission_rate ?? 6,
      irpf_rate: data.irpf_rate ?? 2,
      ejercicio: '2026',
    },
  });
}

async function liquidation(req, id, data) {
  return controllerCall(opsCtrl.createLiquidation, {
    ...req,
    params: { id },
    body: {
      person_name: data.person_name,
      person_tax_id: data.person_tax_id,
      gross_amount: data.gross_amount,
      expense_reimbursements: data.expense_reimbursements || 0,
    },
  });
}

async function emitNomina(req, id) {
  return controllerCall(docsCtrl.emitOfficialPdf, {
    ...req,
    params: { id, kind: 'NOMINA' },
    body: {},
  });
}

async function completeBillable(req, config) {
  const id = await create(req, config.payload);
  await validate(req, id);
  const laboralOut = await laboral(req, id, config.laboral);
  let contractOut = null;
  if (config.contract) {
    contractOut = await controllerCall(opsCtrl.createContract, {
      ...req,
      params: { id },
      body: config.contract,
    });
  }
  const invoiceOut = await invoice(req, id, config.invoice);
  const liquidationOut = await liquidation(req, id, config.liquidation);
  const nominaOut = await emitNomina(req, id);
  const detail = (await controllerCall(opsCtrl.detail, { ...req, params: { id }, body: {} })).body;
  return {
    id,
    type: config.payload.type,
    status: detail.petition?.status,
    route: `#/peticiones?petition_id=${id}`,
    operations: {
      validate: 'VALIDADA',
      laboral: laboralOut.body,
      contract: contractOut?.body || null,
      invoice: invoiceOut.body,
      liquidation: liquidationOut.body,
      nomina: nominaOut.body,
    },
    queue: (detail.queue || []).map((q) => ({ id: q.id, entity_type: q.entity_type, operation: q.operation, status: q.status, last_error: q.last_error })),
  };
}

async function runIntegral(req, res) {
  try {
    const processDelsol = req.body?.processDelsol === true;
    const user = req.user || {};

    const observedId = await create(req, altaFacturaPayload('OBSERVADA', 700, {
      client_tax_id: '',
      factura_cp: '',
      comentarios: 'Prueba observada: faltan NIF/VAT y codigo postal para que el usuario corrija.',
    }));
    await controllerCall(opsCtrl.requestInfo, {
      ...req,
      params: { id: observedId },
      body: { message: 'Faltan NIF/VAT y codigo postal. Corrige esos campos antes de facturar.' },
    });

    const rejectedId = await create(req, altaFacturaPayload('RECHAZADA', 450, {
      reference: `TUTORIAL-RECHAZO-${Date.now().toString().slice(-6)}`,
      comentarios: 'Prueba rechazada: ejemplo de peticion fuera de politica interna.',
    }));
    await controllerCall(opsCtrl.rejectPetition, {
      ...req,
      params: { id: rejectedId },
      body: { message: 'Prueba de rechazo: datos incompatibles con el flujo operativo.' },
    });

    const alta = await completeBillable(req, {
      payload: altaFacturaPayload('COMPLETA', 1250),
      laboral: { person_name: 'Tutorial Alta Factura', person_tax_id: '12345678A', start_date: '2026-06-15', end_date: '2026-06-15' },
      invoice: { concept: 'Servicio artistico demo completo', subtotal: 1250 },
      liquidation: { person_name: 'Tutorial Alta Factura', person_tax_id: '12345678A', gross_amount: 1512.5 },
    });

    const formacion = await completeBillable(req, {
      payload: formacionPayload('COMPLETA', 980),
      laboral: { person_name: 'Docente Tutorial Formacion', person_tax_id: '23456789B', start_date: '2026-07-01', end_date: '2026-07-31' },
      contract: { contract_type: 'FORMACION', title: 'Contrato de formacion demo', notes: 'Generado por tutorial integral.' },
      invoice: { concept: 'Formacion artistica demo completa', subtotal: 980 },
      liquidation: { person_name: 'Docente Tutorial Formacion', person_tax_id: '23456789B', gross_amount: 1185.8 },
    });

    const puntual = await completeBillable(req, {
      payload: servicioPuntualPayload('COMPLETA', 620),
      laboral: { person_name: 'Artista Puntual Tutorial', person_tax_id: '34567890C', start_date: '2026-08-10', end_date: '2026-08-10' },
      invoice: { concept: 'Servicio puntual artistico demo completo', subtotal: 620 },
      liquidation: { person_name: 'Artista Puntual Tutorial', person_tax_id: '34567890C', gross_amount: 750.2 },
    });

    const asociadaId = await create(req, personaAsociadaPayload('COMPLETA'));
    await validate(req, asociadaId);
    const asociadaDetail = (await controllerCall(opsCtrl.detail, { ...req, params: { id: asociadaId }, body: {} })).body;

    let delsol = null;
    if (processDelsol) {
      delsol = (await controllerCall(delsolCtrl.processPending, {
        ...req,
        params: {},
        body: { limit: 20 },
      })).body;
    }

    const observedDetail = (await controllerCall(opsCtrl.detail, { ...req, params: { id: observedId }, body: {} })).body;
    const rejectedDetail = (await controllerCall(opsCtrl.detail, { ...req, params: { id: rejectedId }, body: {} })).body;

    res.status(201).json({
      ok: true,
      created_by: { id: user.id, role: user.role },
      processDelsol,
      scenarios: {
        observed: { id: observedId, status: observedDetail.petition?.status, route: `#/peticiones?petition_id=${observedId}` },
        rejected: { id: rejectedId, status: rejectedDetail.petition?.status, route: `#/peticiones?petition_id=${rejectedId}` },
        completed: alta,
        completed_by_type: {
          ALTA_FACTURA: alta,
          CONTRATO_FORMACION: formacion,
          SERVICIO_PUNTUAL: puntual,
          PERSONA_ASOCIADA: {
            id: asociadaId,
            type: 'PERSONA_ASOCIADA',
            status: asociadaDetail.petition?.status,
            route: `#/peticiones?petition_id=${asociadaId}`,
            operations: {
              validate: 'VALIDADA',
              laboral: null,
              contract: null,
              invoice: null,
              liquidation: null,
              nomina: null,
            },
            queue: [],
          },
        },
      },
      flow: [
        { step: 'Usuario', result: 'Crea o envia peticion con campos y documentos.' },
        { step: 'Observacion', result: 'Si falta NIF/VAT, CP o documento, queda aviso para corregir sin facturar.' },
        { step: 'Rechazo', result: 'Si el caso no corresponde, queda rechazado y auditado.' },
        { step: 'Validacion admin', result: 'Bloquea la peticion como valida y habilita operaciones.' },
        { step: 'Laboral / nomina interna', result: 'Crea alta/baja o A1, liquidacion y PDF NOMINA cuando aplica.' },
        { step: 'Factura interna', result: 'Crea borrador interno y cola DelSol invoice.' },
        { step: 'DelSol', result: 'Procesa invoice, liquidation y laboral; si falla queda en cola para reintento.' },
      ],
      fiscal_scope: 'Este sistema no presenta impuestos directamente ante AEAT/Hacienda. Valida campos fiscales, crea factura interna y sincroniza en DelSol. Nominasol opera con F_TRA/F_CON/F_NOM para alta/contrato/nomina desde administracion segun permisos de API.',
      delsol,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message,
      details: err.body || null,
    });
  }
}

module.exports = { runIntegral };
