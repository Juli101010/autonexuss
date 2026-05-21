(function () {
  const isNativeApp = location.pathname.includes("app.html");
  const isAdmin = location.pathname.includes("labonita-operativo");
  const isArtist = location.pathname.includes("artist-operativo");

  const nativeAdminSteps = [
    { hash: "#/dashboard", sel: ".brand", title: "Ingreso operativo", body: "El administrador entra al panel, revisa indicadores y usa cada tarjeta para navegar al modulo real.", requireClick: true },
    { hash: "#/dashboard", sel: ".app-kpi-link[data-goto='peticiones']", title: "Dashboard accionable", body: "Cada indicador abre su seccion. Peticiones activas lleva a revision y validacion.", requireClick: true },
    { hash: "#/peticiones", sel: "#panelPeticiones", title: "Peticiones", body: "Aqui se revisa lo que envio el usuario: aprobar, observar, rechazar, mensajes, documentos y checklist.", requireClick: true },
    { hash: "#/peticiones", sel: "[data-route='facturacion']", title: "Paso a facturacion", body: "La factura no nace suelta: nace de una peticion validada. Primero valida o corrige la peticion.", requireClick: true },
    { hash: "#/facturacion", sel: "#factBody", title: "Factura interna", body: "Revisa razon social, NIF/VAT, direccion, CP, concepto e importe. Estos campos alimentan la cola DelSol.", requireClick: true },
    { hash: "#/delsol", sel: "#panelDelSol", title: "Impacto DelSol", body: "La cola muestra facturas, altas/bajas, nomina y errores. Si falla la API, queda guardado para reintento manual o lote.", requireClick: true },
    { hash: "#/delsol", sel: "#btnDelsolRead", title: "Prueba API", body: "Este boton prueba lectura real de DelSol desde backend sin exponer credenciales al frontend.", requireClick: true },
    { hash: "#/controles", sel: "#panelControlesNative", title: "Contabilidad y nomina", body: "Controles concentra ledger, propuestas de pago, gastos, comisiones y CSV para administracion.", requireClick: true },
    { hash: "#/avisos", sel: "#panelAvisos", title: "Mensajes y observaciones", body: "Si una peticion esta incompleta, administracion deja aviso y el usuario la corrige antes de facturar.", requireClick: true },
  ];

  const adminSteps = [
    { sel: ".brand", title: "Panel operativo", body: "Esta vista centraliza peticiones, validacion, factura interna y control.", requireClick: true },
    { sel: "#panel-dashboard", title: "Indicadores", body: "Revisa volumen activo, facturacion y cola de sincronizacion antes de operar.", requireClick: true },
    { sel: "#panel-mapa", title: "Mapa de proceso", body: "Flujo obligatorio: alta del usuario, peticion, revision admin, validacion, factura interna, liquidacion y cierre.", requireClick: true },
    { sel: "#panel-crear", title: "Nueva peticion", body: "Solo valida cuando los campos criticos esten completos y en formato correcto para DELSOL.", requireClick: true },
    { sel: "#requiredBox", title: "Completitud", body: "Este bloque evita validar datos incompletos. Si hay faltantes, vuelve a observacion para el usuario.", requireClick: true },
    { sel: "#panel-lista", title: "Listado", body: "Selecciona la peticion y revisa historial: mensajes, docs, cambios de estado y auditoria.", requireClick: true },
    { sel: "#panel-detalle", title: "Detalle", body: "Aqui decides: observar, rechazar o validar. Validar dispara factura interna y deja cola DELSOL preparada.", requireClick: true },
    { sel: ".tabs", title: "Pestanas", body: "Revision, laboral/nomina, factura, gastos y cierre. El tutorial requiere accion para cada etapa.", requireClick: true },
    { sel: "#panel-delsol", title: "Sincronizacion DELSOL", body: "Si DELSOL falla, la cola queda en pending/error y se reintenta automatico o manual por item.", requireClick: true },
  ];

  const artistSteps = [
    { sel: ".hero", title: "Portal artista", body: "Desde aqui cargas planillas, ves mensajes de admin y descargas formularios completos.", requireClick: true },
    { sel: "#newType", title: "Tipo de planilla", body: "Selecciona la planilla correcta: cada tipo activa checklist y reglas distintas de facturacion/nomina.", requireClick: true },
    { sel: "#requiredText", title: "Campos obligatorios", body: "La barra indica cuanto falta. Si falta algo, admin vera observaciones en vez de validacion.", requireClick: true },
    { sel: "#formContainer", title: "Carga de datos", body: "Completa evento, cliente y persona. Usa formato valido: NIF/CIF, CP, fechas ISO y montos numericos.", requireClick: true },
    { sel: "[data-field='client_tax_id']", title: "Formato fiscal", body: "NIF/CIF sugerido: A12345678 o 12345678Z. Evita espacios y simbolos para evitar rechazos.", requireClick: true },
    { sel: "[data-field='factura_cp']", title: "Codigo postal", body: "Codigo postal sugerido: 5 digitos (ej: 28013).", requireClick: true },
    { sel: "[data-field='factura_total_sin_iva']", title: "Importe", body: "Carga solo numeros y decimales con punto: 1500 o 1500.50.", requireClick: true },
    { sel: "#btnSave", title: "Guardar borrador", body: "Guarda avances sin perder informacion, aunque falten campos.", requireClick: true },
    { sel: "#btnSubmit", title: "Enviar a revision", body: "Cuando este completo, envia. Desde ahi admin valida y se habilita facturacion interna.", requireClick: true },
    { sel: "#detailCard", title: "Detalle", body: "Aqui ves estado real, mensajes y observaciones para corregir rapidamente.", requireClick: true },
    { sel: "#btnDownload", title: "Descarga PDF", body: "Descarga tu planilla final como respaldo del proceso.", requireClick: true },
  ];

  const steps = isNativeApp ? nativeAdminSteps : isAdmin ? adminSteps : isArtist ? artistSteps : [];
  if (!steps.length) return;

  let index = 0;
  let overlay = null;
  let spot = null;
  let card = null;
  let progressFill = null;
  let reflowTimer = null;
  let stepDone = false;
  let waitingTarget = null;
  let stepClickHandler = null;
  let helpAttempts = 0;

  const qs = (sel) => {
    try {
      return document.querySelector(sel);
    } catch {
      return null;
    }
  };

  function ensureHelpButton() {
    if (document.querySelector(".tutorial-help-btn") || document.querySelector("#btnTutorial")) return;
    if (isNativeApp) {
      const who = document.querySelector("#whoami")?.textContent || "";
      if (!/ADMIN/i.test(who)) {
        if (helpAttempts < 12) {
          helpAttempts += 1;
          setTimeout(ensureHelpButton, 250);
        }
        return;
      }
    }
    const btn = document.createElement("button");
    btn.className = "tutorial-help-btn";
    btn.type = "button";
    btn.textContent = "Modo tutorial";
    btn.addEventListener("click", start);
    document.body.appendChild(btn);
  }

  function clearPulse() {
    document.querySelectorAll(".tutorial-pulse").forEach((el) => el.classList.remove("tutorial-pulse"));
  }

  function getFallbackRect() {
    return { left: 20, top: 120, right: 260, bottom: 190, width: 240, height: 70 };
  }

  function place(target) {
    const rect = target ? target.getBoundingClientRect() : getFallbackRect();
    const pad = 8;
    const left = Math.max(8, rect.left - pad);
    const top = Math.max(8, rect.top - pad);
    const width = Math.max(100, rect.width + pad * 2);
    const height = Math.max(46, rect.height + pad * 2);

    spot.style.left = `${left}px`;
    spot.style.top = `${top}px`;
    spot.style.width = `${width}px`;
    spot.style.height = `${height}px`;

    const cardWidth = Math.min(390, window.innerWidth - 24);
    const cardHeight = Math.min(card?.offsetHeight || 250, window.innerHeight - 24);
    const gap = 14;

    let cardLeft = rect.right + gap;
    let cardTop = Math.max(12, rect.top);

    if (cardLeft + cardWidth > window.innerWidth - 12) {
      cardLeft = Math.max(12, rect.left - cardWidth - gap);
    }
    if (cardTop + cardHeight > window.innerHeight - 12) {
      cardTop = Math.max(12, window.innerHeight - cardHeight - 12);
    }

    card.style.left = `${cardLeft}px`;
    card.style.top = `${cardTop}px`;
  }

  function getScrollParent(el) {
    let p = el ? el.parentElement : null;
    while (p) {
      const style = window.getComputedStyle(p);
      const y = style.overflowY;
      if ((y === "auto" || y === "scroll") && p.scrollHeight > p.clientHeight) return p;
      p = p.parentElement;
    }
    return null;
  }

  function scrollTargetIntoView(target) {
    if (!target) return;
    const parent = getScrollParent(target);
    if (parent) {
      const pRect = parent.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const delta = (tRect.top - pRect.top) - Math.max(24, pRect.height * 0.25);
      parent.scrollTop += delta;
      return;
    }
    target.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
  }

  function queueReflow(target) {
    if (reflowTimer) clearInterval(reflowTimer);
    let ticks = 0;
    reflowTimer = setInterval(() => {
      place(target || null);
      ticks += 1;
      if (ticks >= 6) {
        clearInterval(reflowTimer);
        reflowTimer = null;
      }
    }, 110);
  }

  function render() {
    const step = steps[index];
    if (step.hash && location.hash.split("?")[0] !== step.hash) {
      location.hash = step.hash;
      setTimeout(render, 180);
      return;
    }
    const target = qs(step.sel);
    stepDone = !step.requireClick;
    waitingTarget = target || null;

    if (target) {
      scrollTargetIntoView(target);
      target.classList.add("tutorial-pulse");
      setTimeout(() => {
        place(target);
        queueReflow(target);
      }, 40);
    } else {
      setTimeout(() => place(null), 40);
    }

    if (stepClickHandler) {
      document.removeEventListener("click", stepClickHandler, true);
      stepClickHandler = null;
    }
    if (step.requireClick && target) {
      stepClickHandler = (evt) => {
        if (!waitingTarget || stepDone) return;
        if (waitingTarget.contains(evt.target)) {
          stepDone = true;
          card.classList.remove("tutorial-waiting");
          updateActionState();
        }
      };
      document.addEventListener("click", stepClickHandler, true);
    }

    const pct = Math.round(((index + 1) / steps.length) * 100);

    card.innerHTML = `
      <h3>${step.title}</h3>
      <p>${step.body}</p>
      <div class="tutorial-instruction ${stepDone ? "done" : ""}">
        ${step.requireClick ? (target ? "Accion requerida: hace click en el elemento resaltado para continuar." : "No se encontro el elemento en esta vista.") : "Paso informativo."}
      </div>
      <div class="tutorial-progress-wrap">
        <div class="tutorial-progress-row">
          <span>Paso ${index + 1} de ${steps.length}</span>
          <span>${pct}%</span>
        </div>
        <div class="tutorial-progress-bar"><div></div></div>
      </div>
      <div class="tutorial-actions">
        <button type="button" data-act="close">Cerrar</button>
        ${step.requireClick ? '<button type="button" data-act="manual">Continuar manual</button>' : ""}
        <button type="button" data-act="prev" ${index === 0 ? "disabled" : ""}>Anterior</button>
        <button type="button" class="primary" data-act="next">${index === steps.length - 1 ? "Finalizar" : "Siguiente"}</button>
      </div>
    `;

    progressFill = card.querySelector(".tutorial-progress-bar > div");
    if (progressFill) progressFill.style.width = `${pct}%`;

    const onClose = card.querySelector('[data-act="close"]');
    const onManual = card.querySelector('[data-act="manual"]');
    const onPrev = card.querySelector('[data-act="prev"]');
    const onNext = card.querySelector('[data-act="next"]');

    if (onClose) onClose.onclick = () => close();
    if (onPrev) {
      onPrev.onclick = () => {
        if (index > 0) {
          clearPulse();
          index -= 1;
          render();
        }
      };
    }
    if (onManual) {
      onManual.onclick = () => {
        stepDone = true;
        card.classList.remove("tutorial-waiting");
        updateActionState();
      };
    }
    if (onNext) {
      onNext.onclick = () => {
        if (!stepDone) return;
        clearPulse();
        if (index < steps.length - 1) {
          index += 1;
          render();
        } else {
          close();
        }
      };
    }
    updateActionState();
  }

  function updateActionState() {
    if (!card) return;
    const nextBtn = card.querySelector('[data-act="next"]');
    const instruction = card.querySelector(".tutorial-instruction");
    const isWaiting = !stepDone;
    if (nextBtn) nextBtn.disabled = isWaiting;
    if (instruction) {
      instruction.classList.toggle("done", !isWaiting);
    }
    card.classList.toggle("tutorial-waiting", isWaiting);
  }

  function close(removePulse = true) {
    if (removePulse) clearPulse();
    if (reflowTimer) {
      clearInterval(reflowTimer);
      reflowTimer = null;
    }
    if (stepClickHandler) {
      document.removeEventListener("click", stepClickHandler, true);
      stepClickHandler = null;
    }
    waitingTarget = null;
    stepDone = false;
    [overlay, spot, card].forEach((el) => el && el.remove());
    overlay = null;
    spot = null;
    card = null;
  }

  function start() {
    close(false);
    index = 0;
    overlay = document.createElement("div");
    overlay.className = "tutorial-overlay";
    spot = document.createElement("div");
    spot.className = "tutorial-spotlight";
    card = document.createElement("div");
    card.className = "tutorial-card";
    document.body.append(overlay, spot, card);
    render();
  }

  window.LaBonitaTutorial = { start };

  document.addEventListener("keydown", (e) => {
    if (!card) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" && stepDone && index < steps.length - 1) {
      clearPulse();
      index += 1;
      render();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      clearPulse();
      index -= 1;
      render();
    }
  });

  document.addEventListener("DOMContentLoaded", ensureHelpButton);
  if (document.readyState !== "loading") ensureHelpButton();
})();
