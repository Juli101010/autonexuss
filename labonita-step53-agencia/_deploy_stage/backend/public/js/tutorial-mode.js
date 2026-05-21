(function () {
  const isApp = location.pathname.includes("app.html");
  const isLegacyAdmin = location.pathname.includes("labonita-operativo");
  const isLegacyArtist = location.pathname.includes("artist-operativo");
  if (!isApp && !isLegacyAdmin && !isLegacyArtist) return;

  const state = {
    open: false,
    mode: "full",
    running: false,
    results: [],
    lastFullResult: null,
  };

  let shell = null;
  let panel = null;
  let helpAttempts = 0;

  function ensureStyles() {
    if (document.getElementById("tutorial-fullscreen-styles")) return;
    const style = document.createElement("style");
    style.id = "tutorial-fullscreen-styles";
    style.textContent = `
      body.tutorial-open{overflow:hidden}
      .tutorial-help-btn{display:inline-flex;align-items:center;gap:8px}
      .tutorial-fullscreen{position:fixed;inset:0;z-index:10000;display:flex;align-items:stretch;justify-content:stretch;background:rgba(12,14,18,.72);backdrop-filter:blur(6px);padding:18px}
      .tutorial-full-panel{width:100%;height:100%;overflow:auto;background:#fbfbf8;color:#1f2328;border:1px solid rgba(0,0,0,.12);border-radius:8px;box-shadow:0 26px 90px rgba(0,0,0,.32);padding:18px;font:14px/1.45 Inter,system-ui,sans-serif}
      .tutorial-full-header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:1px solid rgba(0,0,0,.08);padding-bottom:14px}
      .tutorial-kicker{display:block;color:#6b5b00;font-weight:800;font-size:12px;text-transform:uppercase}
      .tutorial-full-header h2{margin:4px 0 0;font:700 30px/1.1 "Space Grotesk",Inter,system-ui,sans-serif;letter-spacing:0}
      .tutorial-full-header p{margin:8px 0 0;max-width:760px;color:#4d535a}
      .tutorial-icon-btn{width:40px;height:40px;border-radius:8px;border:1px solid rgba(0,0,0,.14);background:#fff;color:#1f2328;cursor:pointer}
      .tutorial-mode-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}
      .tutorial-mode-tabs button,.tutorial-action-buttons button{border:1px solid rgba(0,0,0,.14);background:#fff;color:#20242a;border-radius:8px;padding:10px 12px;cursor:pointer;font:700 13px Inter,system-ui,sans-serif}
      .tutorial-mode-tabs button{display:grid;gap:4px;text-align:left}
      .tutorial-mode-tabs button small{color:#66707a;font-weight:600}
      .tutorial-mode-tabs button.active{border-color:#d4b700;background:#fff8c6}
      .tutorial-mode-tabs button:disabled,.tutorial-action-buttons button:disabled{opacity:.48;cursor:not-allowed}
      .tutorial-action-band{margin-top:16px;display:flex;justify-content:space-between;align-items:center;gap:14px;border:1px solid #e7d879;background:#fffbed;border-radius:8px;padding:14px}
      .tutorial-action-band>div:first-child{display:grid;gap:3px}
      .tutorial-action-band span{color:#5d6269}
      .tutorial-action-buttons{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .tutorial-action-buttons .tutorial-primary{border-color:#d4b700;background:linear-gradient(135deg,#fff36a,#ffd95e);color:#1f2328}
      .tutorial-checks{margin-top:14px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
      .tutorial-checks div{min-height:76px;display:grid;gap:4px;align-content:center;border:1px solid rgba(0,0,0,.08);background:#fff;border-radius:8px;padding:12px}
      .tutorial-checks span{color:#5d6670;font-size:12px}
      .tutorial-results{margin-top:16px;display:grid;gap:10px}
      .tutorial-results-title{display:flex;justify-content:space-between;align-items:center;gap:12px}
      .tutorial-results-title span{color:#66707a;font-weight:700;font-size:12px}
      .tutorial-results-list{display:grid;gap:10px}
      .tutorial-empty,.tutorial-result{border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:8px;padding:12px}
      .tutorial-empty{color:#66707a}
      .tutorial-result-head{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}
      .tutorial-result-head span{color:#66707a;font-size:12px}
      .tutorial-result pre{margin:0;max-height:260px;overflow:auto;border-radius:8px;background:#f5f6f7;padding:10px;white-space:pre-wrap;word-break:break-word;font-size:12px}
      .tutorial-result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}
      .tutorial-result-grid div,.tutorial-result-card{border:1px solid rgba(0,0,0,.08);border-radius:8px;background:#fafafa;padding:10px}
      .tutorial-result-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .tutorial-result-card{display:grid;gap:6px}
      .tutorial-result-card>div{display:flex;justify-content:space-between;gap:10px}
      .tutorial-result-card span{font-weight:800;color:#12572d}
      .tutorial-result-card small{color:#58616b}
      @media (max-width:900px){.tutorial-fullscreen{padding:10px}.tutorial-full-panel{padding:14px}.tutorial-full-header,.tutorial-action-band{flex-direction:column;align-items:stretch}.tutorial-mode-tabs,.tutorial-checks,.tutorial-result-grid,.tutorial-result-cards{grid-template-columns:1fr}.tutorial-full-header h2{font-size:24px}}
    `;
    document.head.appendChild(style);
  }

  const appCtx = () => window.LaBonitaApp || {};
  const isAdmin = () => {
    const ctx = appCtx();
    if (ctx.isAdmin === true) return true;
    const who = document.querySelector("#whoami")?.textContent || "";
    return /ADMIN/i.test(who) || isLegacyAdmin;
  };
  const isArtist = () => !isAdmin() || isLegacyArtist;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function api(path, opts) {
    const ctxApi = appCtx().api;
    if (typeof ctxApi === "function") return ctxApi(path, opts);
    const res = await fetch("/api" + path, Object.assign({ credentials: "include" }, opts || {}));
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(body?.error || "Request failed");
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  function isoDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().slice(0, 10);
  }

  function stamp() {
    return `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  }

  function userPetitionPayload() {
    const s = stamp();
    return {
      type: "ALTA_FACTURA",
      petition_date: isoDate(0),
      responsible_name: "Tutorial Usuario",
      company_show: "Compania Tutorial Usuario",
      reference: `TUTORIAL-USUARIO-${s}`,
      pais_ciudad_actuacion: "Madrid, Espana",
      fecha_inicio_actuacion: isoDate(21),
      client_name: "Cliente Tutorial Usuario SL",
      client_tax_id: "B12345678",
      factura_direccion: "Calle Tutorial 1",
      factura_cp: "28001",
      factura_ciudad: "Madrid",
      factura_pais: "Espana",
      factura_concepto: "Actuacion creada desde tutorial usuario",
      factura_total_sin_iva: 900,
      iva_tipo: "21%",
      comentarios: "Creado por modo tutorial usuario.",
    };
  }

  function adminPetitionPayload(label, amount, complete) {
    const payload = {
      type: "ALTA_FACTURA",
      petition_date: isoDate(0),
      responsible_name: `Tutorial Admin ${label}`,
      company_show: `Compania Tutorial Admin ${label}`,
      reference: `TUTORIAL-ADMIN-${label}-${stamp()}`,
      pais_ciudad_actuacion: "Barcelona, Espana",
      fecha_inicio_actuacion: isoDate(24),
      client_name: `Cliente Tutorial ${label} SL`,
      client_tax_id: complete ? "B87654321" : "",
      factura_direccion: "Carrer Tutorial 22",
      factura_cp: complete ? "08001" : "",
      factura_ciudad: "Barcelona",
      factura_pais: "Espana",
      factura_concepto: `Servicio tutorial admin ${label}`,
      factura_total_sin_iva: amount,
      iva_tipo: "21%",
      comentarios: `Creado por modo tutorial admin ${label}.`,
    };
    return payload;
  }

  function pushResult(kind, title, data) {
    state.results.unshift({
      at: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      kind,
      title,
      data,
    });
    state.results = state.results.slice(0, 18);
    render();
  }

  function setRunning(value) {
    state.running = value;
    render();
  }

  function route(hash) {
    if (!hash) return;
    location.hash = hash;
    if (typeof appCtx().routeTo === "function") {
      try { appCtx().routeTo(hash.replace(/^#\//, "").split("?")[0]); } catch {}
    }
  }

  async function refreshApp() {
    try {
      if (typeof appCtx().refreshBadges === "function") await appCtx().refreshBadges();
    } catch {}
  }

  async function runUserMode() {
    setRunning(true);
    try {
      const created = await api("/ops/my/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPetitionPayload()),
      });
      const submitted = await api(`/ops/my/petitions/${created.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const detail = await api(`/ops/my/petitions/${created.id}`);
      pushResult("user", "Usuario: peticion creada y enviada", {
        id: created.id,
        created_status: created.status,
        submitted_status: submitted.status || "PENDIENTE_VALIDACION",
        missing: created.missing || detail.missing_required || [],
        route: "#/peticiones",
      });
      route("#/peticiones");
      await refreshApp();
    } catch (err) {
      pushResult("error", "Usuario: error", { message: err.message, status: err.status || null });
    } finally {
      setRunning(false);
    }
  }

  async function runAdminMode() {
    setRunning(true);
    try {
      const observed = await api("/admin/ops/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminPetitionPayload("OBSERVADA", 700, false)),
      });
      const observedOut = await api(`/admin/ops/petitions/${observed.id}/request-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Tutorial admin: faltan NIF/VAT y codigo postal." }),
      });

      const valid = await api("/admin/ops/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminPetitionPayload("VALIDADA", 1100, true)),
      });
      const validOut = await api(`/admin/ops/petitions/${valid.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      pushResult("admin", "Admin: observacion y validacion reales", {
        observed: { id: observed.id, status: observedOut.status || "PENDIENTE_INFO" },
        validated: { id: valid.id, status: validOut.status || "VALIDADA" },
        route: `#/peticiones?petition_id=${valid.id}`,
      });
      route(`#/peticiones?petition_id=${valid.id}`);
      await refreshApp();
    } catch (err) {
      pushResult("error", "Admin: error", { message: err.message, status: err.status || null });
    } finally {
      setRunning(false);
    }
  }

  function summarizeType(item) {
    if (!item) return "";
    const ops = item.operations || {};
    const queue = Array.isArray(item.queue) ? item.queue : [];
    return `
      <div class="tutorial-result-card">
        <div>
          <strong>${esc(item.type || "Peticion")} #${esc(item.id || "-")}</strong>
          <span>${esc(item.status || "-")}</span>
        </div>
        <small>laboral: ${ops.laboral ? "#" + esc(ops.laboral.id) : "no aplica"} · factura: ${ops.invoice ? esc(ops.invoice.internal_number || ops.invoice.id) : "no aplica"} · liquidacion: ${ops.liquidation ? "#" + esc(ops.liquidation.id) : "no aplica"} · nomina: ${ops.nomina ? "#" + esc(ops.nomina.id) : "no aplica"}</small>
        <small>cola DelSol: ${queue.length ? queue.map((q) => `#${q.id} ${q.entity_type}/${q.status}`).join(", ") : "sin items"}</small>
      </div>
    `;
  }

  async function runFullMode() {
    setRunning(true);
    try {
      const data = await api("/admin/demo/integral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processDelsol: false }),
      });
      state.lastFullResult = data;
      const byType = data?.scenarios?.completed_by_type || {};
      pushResult("full", "Flujo completo: circuito integral creado", {
        observed: data?.scenarios?.observed,
        rejected: data?.scenarios?.rejected,
        types_html: Object.values(byType).map(summarizeType).join(""),
        fiscal_scope: data?.fiscal_scope,
      });
      const first = data?.scenarios?.completed?.id;
      if (first) route(`#/peticiones?petition_id=${first}`);
      await refreshApp();
    } catch (err) {
      pushResult("error", "Flujo completo: error", { message: err.message, status: err.status || null, details: err.body?.details || null });
    } finally {
      setRunning(false);
    }
  }

  async function processDelsol() {
    setRunning(true);
    try {
      const out = await api("/admin/delsol/queue/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20 }),
      });
      pushResult("delsol", "DelSol: cola procesada", {
        processed: out.processed || 0,
        results: out.results || [],
      });
      route("#/delsol");
      await refreshApp();
    } catch (err) {
      pushResult("error", "DelSol: error", { message: err.message, status: err.status || null });
    } finally {
      setRunning(false);
    }
  }

  function modeDefinitions() {
    return [
      {
        id: "user",
        title: "Usuario",
        available: isArtist(),
        action: "Crear y enviar peticion",
        description: "Crea una peticion ALTA_FACTURA desde la API de usuario y la envia a revision. Muestra ID, estado y faltantes.",
      },
      {
        id: "admin",
        title: "Admin",
        available: isAdmin(),
        action: "Observar y validar",
        description: "Crea dos peticiones por API admin: una observada con pedido de informacion y otra completa validada.",
      },
      {
        id: "full",
        title: "Flujo completo",
        available: isAdmin(),
        action: "Crear circuito integral",
        description: "Ejecuta el endpoint integral real: observada, rechazada y completas por tipo con laboral, factura, liquidacion, nomina PDF y cola DelSol.",
      },
    ];
  }

  function currentMode() {
    return modeDefinitions().find((m) => m.id === state.mode) || modeDefinitions()[0];
  }

  function resultHtml(result) {
    const data = result.data || {};
    if (result.kind === "full") {
      return `
        <article class="tutorial-result ${result.kind}">
          <div class="tutorial-result-head"><strong>${esc(result.title)}</strong><span>${esc(result.at)}</span></div>
          <div class="tutorial-result-grid">
            <div>Observada: #${esc(data.observed?.id || "-")} (${esc(data.observed?.status || "-")})</div>
            <div>Rechazada: #${esc(data.rejected?.id || "-")} (${esc(data.rejected?.status || "-")})</div>
          </div>
          <div class="tutorial-result-cards">${data.types_html || ""}</div>
          <div class="tutorial-fiscal-note">${esc(data.fiscal_scope || "")}</div>
        </article>
      `;
    }
    if (result.kind === "delsol") {
      return `
        <article class="tutorial-result ${result.kind}">
          <div class="tutorial-result-head"><strong>${esc(result.title)}</strong><span>${esc(result.at)}</span></div>
          <div>Items procesados: <strong>${esc(data.processed || 0)}</strong></div>
          <pre>${esc(JSON.stringify(data.results || [], null, 2))}</pre>
        </article>
      `;
    }
    return `
      <article class="tutorial-result ${result.kind}">
        <div class="tutorial-result-head"><strong>${esc(result.title)}</strong><span>${esc(result.at)}</span></div>
        <pre>${esc(JSON.stringify(data, null, 2))}</pre>
      </article>
    `;
  }

  function render() {
    if (!state.open || !panel) return;
    const modes = modeDefinitions();
    const mode = currentMode();
    const unavailable = !mode.available;
    const canProcess = isAdmin() && state.results.some((r) => r.kind === "full");

    panel.innerHTML = `
      <header class="tutorial-full-header">
        <div>
          <span class="tutorial-kicker">Tutorial integral real</span>
          <h2>Modo ${esc(mode.title)}</h2>
          <p>${esc(mode.description)}</p>
        </div>
        <button type="button" class="tutorial-icon-btn" data-act="close" aria-label="Cerrar tutorial">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>

      <div class="tutorial-mode-tabs" role="tablist">
        ${modes.map((m) => `
          <button type="button" data-mode="${m.id}" class="${m.id === state.mode ? "active" : ""}" ${!m.available ? "disabled" : ""}>
            <span>${esc(m.title)}</span>
            <small>${m.available ? "disponible" : "requiere rol"}</small>
          </button>
        `).join("")}
      </div>

      <section class="tutorial-action-band">
        <div>
          <strong>${esc(mode.action)}</strong>
          <span>${unavailable ? "Este modo no esta disponible para el rol actual." : "Accion real por API, con resultado visible abajo."}</span>
        </div>
        <div class="tutorial-action-buttons">
          <button type="button" class="tutorial-primary" data-act="run" ${state.running || unavailable ? "disabled" : ""}>
            ${state.running ? "Ejecutando..." : esc(mode.action)}
          </button>
          <button type="button" data-act="delsol" ${state.running || !canProcess ? "disabled" : ""}>Procesar cola DelSol</button>
        </div>
      </section>

      <section class="tutorial-checks">
        <div><strong>Usuario</strong><span>crea/manda peticion</span></div>
        <div><strong>Admin</strong><span>observa, rechaza o valida</span></div>
        <div><strong>Laboral</strong><span>alta/baja o A1 en cola</span></div>
        <div><strong>Factura</strong><span>borrador interno + DelSol</span></div>
        <div><strong>Nomina</strong><span>PDF interno cuando aplica</span></div>
      </section>

      <section class="tutorial-results">
        <div class="tutorial-results-title">
          <strong>Resultados</strong>
          <span>${state.results.length ? `${state.results.length} eventos` : "Sin ejecuciones todavia"}</span>
        </div>
        <div class="tutorial-results-list">
          ${state.results.length ? state.results.map(resultHtml).join("") : `
            <div class="tutorial-empty">
              Ejecuta un modo para ver IDs, estados, operaciones y cola DelSol sin salir de esta pantalla.
            </div>
          `}
        </div>
      </section>
    `;

    panel.querySelector('[data-act="close"]')?.addEventListener("click", close);
    panel.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mode = btn.dataset.mode;
        render();
      });
    });
    panel.querySelector('[data-act="run"]')?.addEventListener("click", () => {
      if (state.mode === "user") runUserMode();
      else if (state.mode === "admin") runAdminMode();
      else runFullMode();
    });
    panel.querySelector('[data-act="delsol"]')?.addEventListener("click", processDelsol);
  }

  function close() {
    state.open = false;
    shell?.remove();
    shell = null;
    panel = null;
    document.body.classList.remove("tutorial-open");
  }

  function start(mode) {
    ensureStyles();
    state.mode = mode || (isAdmin() ? "full" : "user");
    state.open = true;
    shell?.remove();
    shell = document.createElement("div");
    shell.className = "tutorial-fullscreen";
    panel = document.createElement("div");
    panel.className = "tutorial-full-panel";
    shell.appendChild(panel);
    document.body.appendChild(shell);
    document.body.classList.add("tutorial-open");
    render();
  }

  function ensureHelpButton() {
    if (document.querySelector(".tutorial-help-btn") || document.querySelector("#btnTutorial")) return;
    if (isApp && !appCtx().me && helpAttempts < 12) {
      helpAttempts += 1;
      setTimeout(ensureHelpButton, 250);
      return;
    }
    ensureStyles();
    const btn = document.createElement("button");
    btn.className = "tutorial-help-btn";
    btn.type = "button";
    btn.innerHTML = '<i class="fa-solid fa-route"></i><span>Tutorial real</span>';
    btn.addEventListener("click", () => start());
    document.body.appendChild(btn);
  }

  window.LaBonitaTutorial = { start, close, runUserMode, runAdminMode, runFullMode };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) close();
  });
  document.addEventListener("DOMContentLoaded", ensureHelpButton);
  if (document.readyState !== "loading") ensureHelpButton();
})();
