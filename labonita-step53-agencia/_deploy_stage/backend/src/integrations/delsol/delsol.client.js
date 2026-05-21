/**
 * DELSOL API adapter (mock/live) with secure token lifecycle.
 *
 * Rule: each critical operation authenticates again (fresh token).
 * This avoids stale-token failures and aligns with validated step57 flow.
 */
class DelSolClient {
  constructor({ mode = 'mock', area = 'facturacion' } = {}) {
    this.mode = String(mode || process.env.DELSOL_MODE || 'mock').toLowerCase();
    this.area = String(area || 'facturacion').toLowerCase();
    const prefix = this.area === 'laboral' ? 'DELSOL_LABORAL' : 'DELSOL_FACTURACION';
    this.ejercicio = String(
      process.env[`${prefix}_EJERCICIO`] ||
      process.env.DELSOL_DEFAULT_EJERCICIO ||
      '2026'
    );

    this.loginUrl = String(process.env.DELSOL_LOGIN_URL || 'https://api.sdelsol.com/login/Autenticar');
    this.adminUrl = String(process.env.DELSOL_ADMIN_URL || process.env[`${prefix}_BASE_URL`] || 'https://api.sdelsol.com/admin').replace(/\/+$/, '');

    this.fabricante = String(process.env[`${prefix}_FABRICANTE`] || process.env.DELSOL_CODIGO_FABRICANTE || '');
    this.cliente = String(process.env[`${prefix}_CLIENTE`] || process.env.DELSOL_CODIGO_CLIENTE || '');
    this.baseDatos = String(process.env[`${prefix}_DATABASE`] || process.env.DELSOL_BASE_DATOS || '');
    this.password = String(process.env[`${prefix}_PASSWORD`] || process.env.DELSOL_PASSWORD || '');
  }

  isEnabled() {
    if (this.mode !== 'live') return false;
    const prefix = this.area === 'laboral' ? 'DELSOL_LABORAL' : 'DELSOL_FACTURACION';
    const hasAreaCredentials = Boolean(process.env[`${prefix}_FABRICANTE`] || process.env[`${prefix}_CLIENTE`] || process.env[`${prefix}_DATABASE`] || process.env[`${prefix}_PASSWORD`]);
    const areaEnabled = this.area === 'laboral' ? process.env.DELSOL_LABORAL_ENABLED : process.env.DELSOL_FACTURACION_ENABLED;
    if (hasAreaCredentials && areaEnabled !== undefined && areaEnabled !== '' && String(areaEnabled) !== '1') return false;
    return Boolean(this.fabricante && this.cliente && this.baseDatos && this.password);
  }

  assertLiveWrite() {
    if (!this.isEnabled()) {
      const err = new Error('DELSOL live integration not enabled');
      err.code = 'DELSOL_NOT_ENABLED';
      throw err;
    }
    const areaWriteFlag = this.area === 'laboral' ? process.env.DELSOL_LABORAL_WRITE_ENABLED : process.env.DELSOL_FACTURACION_WRITE_ENABLED;
    if (String(areaWriteFlag || process.env.DELSOL_WRITE_ENABLED || '0') !== '1') {
      const err = new Error('BDSinPermiso');
      err.code = 'BDSinPermiso';
      throw err;
    }
  }

  publicStatus() {
    return {
      area: this.area,
      mode: this.mode,
      ejercicio: this.ejercicio,
      enabled: this.isEnabled(),
      has_credentials: Boolean(this.fabricante && this.cliente && this.baseDatos && this.password),
      write_enabled: String((this.area === 'laboral' ? process.env.DELSOL_LABORAL_WRITE_ENABLED : process.env.DELSOL_FACTURACION_WRITE_ENABLED) || process.env.DELSOL_WRITE_ENABLED || '0') === '1',
    };
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
