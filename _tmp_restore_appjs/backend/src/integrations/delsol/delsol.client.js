/**
 * DELSOL API adapter (mock/live) with secure token lifecycle.
 *
 * Rule: each critical operation authenticates again (fresh token).
 * This avoids stale-token failures and aligns with validated step57 flow.
 */
class DelSolClient {
  constructor({ mode = 'mock' } = {}) {
    this.mode = String(mode || process.env.DELSOL_MODE || 'mock').toLowerCase();
    this.ejercicio = String(
      process.env.DELSOL_DEFAULT_EJERCICIO ||
      process.env.DELSOL_FACTURACION_EJERCICIO ||
      '2026'
    );

    this.loginUrl = String(process.env.DELSOL_LOGIN_URL || 'https://api.sdelsol.com/login/Autenticar');
    this.adminUrl = String(process.env.DELSOL_ADMIN_URL || 'https://api.sdelsol.com/admin').replace(/\/+$/, '');

    this.fabricante = String(process.env.DELSOL_FACTURACION_FABRICANTE || process.env.DELSOL_CODIGO_FABRICANTE || '');
    this.cliente = String(process.env.DELSOL_FACTURACION_CLIENTE || process.env.DELSOL_CODIGO_CLIENTE || '');
    this.baseDatos = String(process.env.DELSOL_FACTURACION_DATABASE || process.env.DELSOL_BASE_DATOS || '');
    this.password = String(process.env.DELSOL_FACTURACION_PASSWORD || process.env.DELSOL_PASSWORD || '');
  }

  isEnabled() {
    if (this.mode !== 'live') return false;
    return Boolean(this.fabricante && this.cliente && this.baseDatos && this.password);
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

  passwordToBase64(raw) {
    return Buffer.from(String(raw), 'utf8').toString('base64');
  }

  async getFreshToken() {
    const body = {
      codigoFabricante: this.fabricante,
      codigoCliente: this.cliente,
      baseDatosCliente: this.baseDatos,
      password: this.passwordToBase64(this.password),
    };

    const res = await fetch(this.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.respuesta !== 'OK' || !json?.resultado) {
      const err = new Error(json?.respuesta || json?.error || `DELSOL auth HTTP ${res.status}`);
      err.response = json;
      throw err;
    }
    return json.resultado;
  }

  async postAdmin(endpoint, payload, retry = true) {
    if (!this.isEnabled()) {
      return { respuesta: 'OK', mode: this.mode, simulated: true, endpoint, payload };
    }
    const token = await this.getFreshToken();
    const res = await fetch(`${this.adminUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (res.status === 401 && retry) return this.postAdmin(endpoint, payload, false);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} en ${endpoint}`);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json;
  }

  leerRegistro(payload = {}) {
    return this.postAdmin('LeerRegistro', { ejercicio: this.ejercicio, ...payload });
  }

  lanzarConsulta(payload = {}) {
    const consulta = payload.consulta || payload.sql || '';
    return this.postAdmin('LanzarConsulta', { ejercicio: this.ejercicio, consulta });
  }

  escribirRegistro(payload = {}) {
    this.assertLiveWrite();
    return this.postAdmin('EscribirRegistro', { ejercicio: this.ejercicio, ...payload });
  }

  actualizarRegistro(payload = {}) {
    this.assertLiveWrite();
    return this.postAdmin('ActualizarRegistro', { ejercicio: this.ejercicio, ...payload });
  }

  async borrarRegistroSmart(payload = {}) {
    this.assertLiveWrite();
    const endpoints = ['BorraRegistro', 'BorrarRegistro', 'EliminarRegistro', 'EliminaRegistro'];
    const errors = [];
    for (const endpoint of endpoints) {
      try {
        const resp = await this.postAdmin(endpoint, { ejercicio: this.ejercicio, ...payload });
        if (resp?.respuesta === 'OK') return { endpoint, response: resp };
        errors.push({ endpoint, response: resp });
      } catch (err) {
        errors.push({ endpoint, status: err.status, response: err.response, message: err.message });
      }
    }
    const err = new Error('No funciono ningun endpoint de borrado probado');
    err.errors = errors;
    throw err;
  }
}

module.exports = { DelSolClient };
