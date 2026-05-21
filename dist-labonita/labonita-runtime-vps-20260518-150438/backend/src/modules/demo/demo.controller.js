const opsCtrl = require('../operations/operations.controller');
const delsolCtrl = require('../delsol/delsol.controller');

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

function basePetition(label, amount, overrides = {}) {
  const suffix = Date.now().toString().slice(-6);
  return {
    type: 'ALTA_FACTURA',
    form_template: 'ALTA_FACTURA',
    petition_date: new Date().toISOString().slice(0, 10),
    responsible_name: `Tutorial ${label}`,
    company_show: `La Bonita Demo - ${label}`,
    reference: `TUTORIAL-${label}-${suffix}`,
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

async function create(req, data) {
  const out = await controllerCall(opsCtrl.createPetition, { ...req, body: data, params: {} });
  return out.body.id;
}

async function runIntegral(req, res) {
  try {
    const processDelsol = req.body?.processDelsol === true;
    const user = req.user || {};

    const observedId = await create(req, basePetition('OBSERVADA', 700, {
      client_tax_id: '',
      factura_cp: '',
      comentarios: 'Prueba observada: faltan NIF/VAT y codigo postal para que el usuario corrija.',
    }));
    await controllerCall(opsCtrl.requestInfo, {
      ...req,
      params: { id: observedId },
      body: { message: 'Faltan NIF/VAT y codigo postal. Corrige esos campos antes de facturar.' },
    });

    const rejectedId = await create(req, basePetition('RECHAZADA', 450, {
      reference: `TUTORIAL-RECHAZO-${Date.now().toString().slice(-6)}`,
      comentarios: 'Prueba rechazada: ejemplo de peticion fuera de politica interna.',
    }));
    await controllerCall(opsCtrl.rejectPetition, {
      ...req,
      params: { id: rejectedId },
      body: { message: 'Prueba de rechazo: datos incompatibles con el flujo operativo.' },
    });

    const fullId = await create(req, basePetition('COMPLETA', 1250));
    await controllerCall(opsCtrl.validatePetition, { ...req, params: { id: fullId }, body: {} });
    await controllerCall(opsCtrl.createLaboralMovement, {
      ...req,
      params: { id: fullId },
      body: {
        person_name: 'Tutorial Completa',
        person_tax_id: '12345678A',
        start_date: '2026-06-15',
        end_date: '2026-06-15',
        requires_a1: 'NO',
        note: 'Alta/baja creada por tutorial integral.',
      },
    });
    const invoice = await controllerCall(opsCtrl.createInvoice, {
      ...req,
      params: { id: fullId },
      body: {
        concept: 'Servicio artistico demo completo',
        subtotal: 1250,
        iva_rate: 21,
        commission_rate: 6,
        irpf_rate: 2,
        ejercicio: '2026',
      },
    });
    await controllerCall(opsCtrl.createLiquidation, {
      ...req,
      params: { id: fullId },
      body: {
        person_name: 'Tutorial Completa',
        person_tax_id: '12345678A',
        gross_amount: 1512.5,
        expense_reimbursements: 0,
      },
    });

    let delsol = null;
    if (processDelsol) {
      delsol = (await controllerCall(delsolCtrl.processPending, {
        ...req,
        params: {},
        body: { limit: 20 },
      })).body;
    }

    const fullDetail = (await controllerCall(opsCtrl.detail, { ...req, params: { id: fullId }, body: {} })).body;
    const observedDetail = (await controllerCall(opsCtrl.detail, { ...req, params: { id: observedId }, body: {} })).body;
    const rejectedDetail = (await controllerCall(opsCtrl.detail, { ...req, params: { id: rejectedId }, body: {} })).body;

    res.status(201).json({
      ok: true,
      created_by: { id: user.id, role: user.role },
      processDelsol,
      scenarios: {
        observed: { id: observedId, status: observedDetail.petition?.status, route: `#/peticiones?petition_id=${observedId}` },
        rejected: { id: rejectedId, status: rejectedDetail.petition?.status, route: `#/peticiones?petition_id=${rejectedId}` },
        completed: {
          id: fullId,
          status: fullDetail.petition?.status,
          route: `#/peticiones?petition_id=${fullId}`,
          invoice: invoice.body,
          queue: (fullDetail.queue || []).map((q) => ({ id: q.id, entity_type: q.entity_type, operation: q.operation, status: q.status, last_error: q.last_error })),
        },
      },
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
