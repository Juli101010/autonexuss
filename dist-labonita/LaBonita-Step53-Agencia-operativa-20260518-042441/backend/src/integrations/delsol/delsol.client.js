/**
 * DELSOL API adapter.
 *
 * Important project rule:
 * - La Bonita is the source system.
 * - DELSOL is an external sync target.
 * - While DELSOL returns BDSinPermiso for write/update, the app must keep working locally
 *   and keep a queue for later retry.
 *
 * This client keeps generic DELSOL operations isolated from business code. The operation
 * names mirror the public DELSOL/Postman tests used by the client: Autenticar,
 * LeerRegistro, LeerConfiguracion, CargaTabla, LanzaConsulta, EscribirRegistro,
 * ActualizarRegistro and BorrarRegistros.
 */
class DelSolClient {
  constructor({ baseUrl, apiKey, token, mode = 'mock', ejercicio = '2026' } = {}) {
    this.baseUrl = baseUrl || process.env.DELSOL_BASE_URL || '';
    this.apiKey = apiKey || process.env.DELSOL_API_KEY || '';
    this.token = token || process.env.DELSOL_TOKEN || '';
    this.mode = String(mode || process.env.DELSOL_MODE || 'mock').toLowerCase();
    this.ejercicio = String(ejercicio || process.env.DELSOL_DEFAULT_EJERCICIO || '2026');
  }

  isEnabled() {
    return this.mode === 'live' && Boolean(this.baseUrl) && (Boolean(this.apiKey) || Boolean(this.token));
  }

  assertLiveWrite() {
    if (!this.isEnabled()) {
      const err = new Error('DELSOL live integration not enabled');
      err.code = 'DELSOL_NOT_ENABLED';
      throw err;
    }
    if (String(process.env.DELSOL_WRITE_ENABLED || '0') !== '1') {
      const err = new Error('BDSinPermiso');
      err.code = 'BDSinPermiso';
      throw err;
    }
  }

  async request(operation, payload = {}) {
    if (!this.isEnabled()) {
      return { respuesta: 'OK', mode: this.mode, simulated: true, operation, payload };
    }
    // DELSOL endpoint shape can vary by account/version. Keep it centralized here.
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ operation, ...payload }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body?.respuesta || body?.error || `DELSOL HTTP ${res.status}`);
      err.response = body;
      throw err;
    }
    return body;
  }

  autenticar(payload = {}) { return this.request('Autenticar', payload); }
  leerRegistro(payload = {}) { return this.request('LeerRegistro', { ejercicio: this.ejercicio, ...payload }); }
  leerConfiguracion(payload = {}) { return this.request('LeerConfiguracion', { ejercicio: this.ejercicio, ...payload }); }
  cargarTabla(payload = {}) { return this.request('CargaTabla', { ejercicio: this.ejercicio, ...payload }); }
  lanzarConsulta(payload = {}) { return this.request('LanzaConsulta', { ejercicio: this.ejercicio, ...payload }); }

  escribirRegistro(payload = {}) {
    this.assertLiveWrite();
    return this.request('EscribirRegistro', { ejercicio: this.ejercicio, ...payload });
  }

  actualizarRegistro(payload = {}) {
    this.assertLiveWrite();
    return this.request('ActualizarRegistro', { ejercicio: this.ejercicio, ...payload });
  }

  borrarRegistros(payload = {}) {
    this.assertLiveWrite();
    return this.request('BorrarRegistros', { ejercicio: this.ejercicio, ...payload });
  }

  // Business-level wrappers: keep UI/backend agnostic of DELSOL table details.
  async syncClienteToDelSol(customerPayload) { return this.escribirRegistro(customerPayload); }
  async syncFacturaToDelSol(invoicePayload) { return this.escribirRegistro(invoicePayload); }
  async syncLineaFacturaToDelSol(linePayload) { return this.escribirRegistro(linePayload); }
  async syncGastoToDelSol(expensePayload) { return this.escribirRegistro(expensePayload); }
  async syncNominaToDelSol(laborPayload) { return this.escribirRegistro(laborPayload); }
}

module.exports = { DelSolClient };
