const fs = require('fs');
const path = require('path');

const DEFAULT_ENV = path.resolve(process.cwd(), '.env.delsol.local');

function readEnv(envFile = DEFAULT_ENV) {
  const vars = {};
  const text = fs.readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#') || !clean.includes('=')) continue;
    const idx = clean.indexOf('=');
    vars[clean.slice(0, idx).trim()] = clean.slice(idx + 1).trim();
  }
  return vars;
}

function passwordToBase64(password) {
  return Buffer.from(String(password), 'utf8').toString('base64');
}

function rec(obj) {
  return Object.entries(obj).map(([columna, dato]) => ({ columna, dato }));
}

function firstDato(resp, col) {
  return resp?.resultado?.[0]?.find((x) => x.columna === col)?.dato;
}

class DelsolClient {
  constructor(options = {}) {
    this.envFile = options.envFile || DEFAULT_ENV;
    this.vars = readEnv(this.envFile);
    this.loginUrl = this.vars.DELSOL_LOGIN_URL || 'https://api.sdelsol.com/login/Autenticar';
    this.adminUrl = this.vars.DELSOL_ADMIN_URL || 'https://api.sdelsol.com/admin';
    this.ejercicio = this.vars.DELSOL_EJERCICIO || '2026';
  }

  async getToken() {
    const body = {
      codigoFabricante: this.vars.DELSOL_CODIGO_FABRICANTE,
      codigoCliente: this.vars.DELSOL_CODIGO_CLIENTE,
      baseDatosCliente: this.vars.DELSOL_BASE_DATOS,
      password: passwordToBase64(this.vars.DELSOL_PASSWORD),
    };

    const res = await fetch(this.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.respuesta !== 'OK') {
      throw new Error(`No autentico DELSOL: ${JSON.stringify(json)}`);
    }
    return json.resultado;
  }

  async postAdmin(endpoint, payload, retry = true) {
    const token = await this.getToken();
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

    if (res.status === 401 && retry) {
      return this.postAdmin(endpoint, payload, false);
    }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} en ${endpoint}`);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json;
  }

  async consulta(sql) {
    return this.postAdmin('LanzarConsulta', {
      ejercicio: this.ejercicio,
      consulta: sql,
    });
  }

  async escribirRegistro(tabla, registro) {
    return this.postAdmin('EscribirRegistro', {
      ejercicio: this.ejercicio,
      tabla,
      registro,
    });
  }

  async actualizarRegistro(tabla, registro) {
    return this.postAdmin('ActualizarRegistro', {
      ejercicio: this.ejercicio,
      tabla,
      registro,
    });
  }
}

module.exports = { DelsolClient, rec, firstDato };
