import { requireAuth } from './guard.js';

(async () => {
  const ME = await requireAuth();
  if (!ME) return;
  const IS_ADMIN = String(ME.role||'').toUpperCase() === 'ADMIN';
/**
   * app.js - Phase 1 UI shell (demo-style) without changing backend logic.
   *
   * Strategy:
   * - Keep existing pages (admin-peticiones.html, admin-controles.html, etc.)
   * - Render demo-like sidebar + dashboard + simple map
   * - Use iframe routing so we don't rewrite legacy UIs yet
   * - Fetch small KPIs for badges (best-effort; failures just show 0)
   */
  async function api(path, opts) {
    const res = await fetch('/api' + path, Object.assign({ credentials: 'include' }, opts || {}));
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (!res.ok) {
      const e = new Error(body?.error || 'Request failed');
      e.status = res.status;
      e.body = body;
      throw e;
    }
    return body;
  }
  
  function setActive(route) {
    document.querySelectorAll('#nav a').forEach((a) => {
      a.classList.toggle('active', a.dataset.route === route);
    });
  }

  function renderNavForRole() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const links = IS_ADMIN
      ? [
          { r: 'dashboard', t: '🏠 Dashboard', badge: null },
          { r: 'operativo', t: '🧭 Operativo 2026', badge: null },
          { r: 'mapa', t: '🗺️ Mapa de Peticiones', badge: 'badgeValidation', cls: 'badge violet' },
          { r: 'peticiones', t: '📄 Peticiones', badge: 'badgePeticiones', cls: 'badge' },
          { r: 'facturacion', t: '🧾 Facturación', badge: null },
          { r: 'controles', t: '📊 Controles', badge: null },
          { r: 'avisos', t: '🔔 Avisos', badge: 'badgeAvisos', cls: 'badge red' },
          { r: 'delsol', t: '🔌 DelSol Sync', badge: 'badgeDelSol', cls: 'badge' },
          { r: 'citas', t: '📅 Citas online', badge: null },
        ]
      : [
          { r: 'dashboard', t: '🏠 Inicio', badge: null },
          { r: 'peticiones', t: '📄 Mis peticiones', badge: null },
          { r: 'mensajes', t: '💬 Mensajes', badge: null },
          { r: 'perfil', t: '👤 Perfil', badge: null },
          { r: 'avisos', t: '🔔 Inbox', badge: 'badgeAvisos', cls: 'badge red' },
          { r: 'citas', t: '📅 Citas online', badge: null },
        ];

    nav.innerHTML = links
      .map((l, i) => {
        const badge = l.badge
          ? `<span class="${l.cls || 'badge'}" id="${l.badge}">${l.badge === 'badgeDelSol' ? 'Preparado' : '0'}</span>`
          : `<span></span>`;
        const active = i === 0 ? ' class="active"' : '';
        return `<a href="#/${l.r}" data-route="${l.r}"${active}><span class="left">${l.t}</span>${badge}</a>`;
      })
      .join('');
  }
  
  function showPanel(panelId) {
    ['panelDashboard','panelFrame','panelMap','panelPeticiones','panelFacturacion','panelAdminWizard','panelAvisos','panelDelSol','panelCitas'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== panelId);
    });
  }
  
  function setTitle(title, subtitle) {
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;
  }
  
  function routeTo(route) {
    if (!IS_ADMIN) {
      if (route === 'dashboard') {
        setActive('dashboard');
        setTitle('Inicio', 'Portal artista');
        showPanel('panelDashboard');
        return;
      }
      if (route === 'peticiones') {
        setActive('peticiones');
        setTitle('Mis peticiones', 'Wizard + checklist + documentos');
        showPanel('panelFrame');
        document.getElementById('frame2').src = '/artist-operativo.html';
        return;
      }
      if (route === 'mensajes') {
        setActive('mensajes');
        setTitle('Mensajes', 'Conversaciones por petición');
        showPanel('panelFrame');
        document.getElementById('frame2').src = '/artist-mensajes.html';
        return;
      }
      if (route === 'perfil') {
        setActive('perfil');
        setTitle('Perfil', 'Datos personales');
        showPanel('panelFrame');
        document.getElementById('frame2').src = '/profile.html';
        return;
      }
      if (route === 'avisos') {
        setActive('avisos');
        setTitle('Inbox', 'Notificaciones y avisos');
        showPanel('panelAvisos');
        wireInbox();
        loadInbox().catch(() => {});
        return;
      }
      if (route === 'citas') {
        setActive('citas');
        setTitle('Citas online', 'Preparado (sin integración)');
        showPanel('panelCitas');
        return;
      }
      // default artist
      location.hash = '#/peticiones';
      return;
    }

    if (route === 'dashboard') {
      setActive('dashboard');
      setTitle('Dashboard', 'Vista general (estilo demo aprobado)');
      showPanel('panelDashboard');
      return;
    }
    if (route === 'operativo') {
      setActive('operativo');
      setTitle('Operativo 2026', 'Mapa de Peticiones + facturación interna + DELSOL desacoplado');
      showPanel('panelFrame');
      document.getElementById('frame2').src = '/labonita-operativo.html';
      return;
    }
    if (route === 'mapa') {
      setActive('mapa');
      setTitle('Mapa de Peticiones', 'Progreso por pasos + filtros por etapa');
      showPanel('panelMap');
      wireMapControls();
      loadMapSummary().catch(() => {});
      return;
    }
  
    if (route === 'controles') {
      setActive('controles');
      setTitle('Controles', 'Ledger + gastos + comisiones + exports');
      showPanel('panelFrame');
      document.getElementById('frame2').src = '/admin-controles.html';
      return;
    }
  
    if (route === 'avisos') {
      setActive('avisos');
      setTitle('Inbox', 'Notificaciones / Avisos / Mensajes (premium)');
      showPanel('panelAvisos');
      wireInbox();
      loadInbox().catch(() => {});
      return;
    }
    if (route === 'facturacion') {
      setActive('facturacion');
      setTitle('Facturación', 'Editar datos fiscales y conciliar DelSol');
      showPanel('panelFacturacion');
      const pid = Number(new URLSearchParams(location.hash.split('?')[1]||'').get('petition_id')||0);
      loadFacturacion(pid);
      return;
    }
  
    if (route === 'delsol') {
      setActive('delsol');
      setTitle('DelSol Sync', 'Preparado para integrar sin romper nada');
      showPanel('panelDelSol');
      return;
    }
  
    // legacy pages
    setActive(route);
    showPanel('panelFrame');
  
    const frame = document.getElementById('frame2');
    const map = {
      peticiones: '/admin-peticiones.html',
      controles: '/admin-controles.html',
    };
    const base = map[route] || '/admin.html';
    if (route === 'peticiones' && __openPetitionId) {
      frame.src = `${base}?petition_id=${encodeURIComponent(__openPetitionId)}`;
      __openPetitionId = null;
    } else {
      frame.src = base;
    }
    if (route === 'peticiones') setTitle('Peticiones', 'Gestión completa + validación + workflow');
    if (route === 'controles') setTitle('Controles', 'Exports CSV/XLSX + Ledger + SS diario + Payouts');
  }
  
  function parseHash() {
    const h = location.hash || '#/dashboard';
    const m = h.match(/^#\/([^?]+)/);
    return (m ? m[1] : 'dashboard').trim();
  }
  
  async function refreshBadges() {
    // Best-effort KPIs
    document.getElementById('whoami').textContent = `${ME.role}: ${ME.email || ''}`;
  
    let validation = 0;
    let active = 0;
    let alerts = 0;
  
    try {
      const list = await api('/admin/petitions');
      const rows = list.rows || list.petitions || [];
      active = rows.filter((p) => !['CERRADA_CERO','RECHAZADA'].includes(p.status)).length;
      validation = rows.filter((p) => p.status === 'PENDIENTE_VALIDACION').length;
    } catch {}
  
    try {
      const n = await api('/notifications');
      const rows = n.rows || [];
      alerts = rows.length;
    } catch {}
  
    document.getElementById('badgeValidation').textContent = String(validation);
    document.getElementById('badgePeticiones').textContent = String(active);
    document.getElementById('badgeAvisos').textContent = String(alerts);
  
    document.getElementById('kpiActive').textContent = String(active);
    document.getElementById('kpiValidation').textContent = String(validation);
    document.getElementById('kpiAlerts').textContent = String(alerts);
  }
  
  function wireSearch() {
    const input = document.getElementById('globalSearch');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = input.value.trim();
      if (!q) return;
  
      // Phase 1: route to peticiones, and pass a query in hash (future)
      location.hash = '#/peticiones';
      // Try to open legacy page with search query (future improvement)
    });
  }
  
  function wireLogout() {
    document.getElementById('btnLogout').onclick = async () => {
      try { await api('/auth/logout', { method: 'POST' }); } catch {}
      location.href = '/login.html';
    };
  }
  
  window.addEventListener('hashchange', () => routeTo(parseHash()));
  
  (async function boot() {
    renderNavForRole();
    wireSearch();
    wireLogout();
    wireAnnouncements();
    routeTo(parseHash());
    await refreshBadges();
    setInterval(refreshBadges, 15000);
  })();
  
  
  // ---- Map (Phase 2) ----
  let mapRows = [];
  let mapFilter = 'all';
  let selectedPetitionId = null;
  let __openPetitionId = null;
  
  function stepMeta() {
    return [
      { key: 'petition', label: '1) Petición', hint: 'Datos base', icon: 'fa-solid fa-file-circle-plus' },
      { key: 'validation', label: '2) Validación', hint: 'Admin valida', icon: 'fa-solid fa-shield-check' },
      { key: 'altas_bajas', label: '3) Altas/Bajas', hint: 'Laboral / A1', icon: 'fa-solid fa-id-card-clip' },
      { key: 'contratos', label: '4) Contratos', hint: 'Doc contrato', icon: 'fa-solid fa-file-signature' },
      { key: 'facturacion', label: '5) Facturación', hint: 'Factura emitida', icon: 'fa-solid fa-receipt' },
      { key: 'calculos', label: '6) Cálculos', hint: 'Gastos/Comisión/Ledger', icon: 'fa-solid fa-calculator' },
      { key: 'cierre', label: '7) Cierre', hint: 'CERRADA_CERO', icon: 'fa-solid fa-lock' },
    ];
  }
  
  async function loadMapSummary() {
    const data = await api('/admin/map/summary');
    mapRows = data.rows || [];
    renderMapSelect();
    renderMapTable();
    renderMapSteps();
  }
  
  function rowLabel(r) {
    const ref = r.reference ? ` · ${r.reference}` : '';
    return `#${r.id} · ${r.type} · ${r.status}${ref}`;
  }
  
  function renderMapSelect() {
    const sel = document.getElementById('mapPetitionSelect');
    if (!sel) return;
    sel.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = 'Seleccionar petición…';
    sel.appendChild(optAll);
  
    mapRows.slice(0, 300).forEach((r) => {
      const o = document.createElement('option');
      o.value = String(r.id);
      o.textContent = rowLabel(r);
      sel.appendChild(o);
    });
  
    if (selectedPetitionId) sel.value = String(selectedPetitionId);
    sel.onchange = () => {
      selectedPetitionId = sel.value ? Number(sel.value) : null;
      renderMapSteps();
      renderMapActions();
      renderMapTable();
    };
  }
  
  
  function renderMapActions() {
    const wrap = document.getElementById('mapActions');
    if (!wrap) return;
    wrap.innerHTML = '';
    const row = selectedPetitionId ? mapRows.find((x) => x.id === selectedPetitionId) : null;
  
    if (!row) {
      wrap.innerHTML = '<span class="small">Selecciona una petición para ver acciones.</span>';
      return;
    }
  
    const addBtn = (label, onClick) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.type = 'button';
      b.textContent = label;
      b.onclick = onClick;
      wrap.appendChild(b);
    };
  
    // Assignment / priority
    const pr = document.createElement('input');
    pr.className = 'btn';
    pr.style.maxWidth = '120px';
    pr.placeholder = 'Prioridad';
    pr.value = String(row.priority || 0);
  
    const btnAssignMe = document.createElement('button');
    btnAssignMe.className = 'btn';
    btnAssignMe.type = 'button';
    btnAssignMe.textContent = 'Asignar a mí';
  
    const btnSavePr = document.createElement('button');
    btnSavePr.className = 'btn';
    btnSavePr.type = 'button';
    btnSavePr.textContent = 'Guardar prio';
  
    const info = document.createElement('span');
    info.className = 'small';
    info.textContent = row.assigned_admin_id ? `Asignada a admin#${row.assigned_admin_id}` : 'Sin asignación';
  
    wrap.appendChild(pr);
    wrap.appendChild(btnSavePr);
    wrap.appendChild(btnAssignMe);
    wrap.appendChild(info);
  
    btnAssignMe.onclick = async () => {
      const me = await api('/auth/me');
      await api(`/admin/petitions/${row.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_admin_id: me.id }),
      });
      await loadMapSummary();
    };
  
    btnSavePr.onclick = async () => {
      await api(`/admin/petitions/${row.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: Number(pr.value || 0) }),
      });
      await loadMapSummary();
    };
  
    addBtn('Abrir petición (nativo)', () => {
      __openPetitionId = row.id;
      location.hash = '#/peticiones';
    });
  
    addBtn('Abrir en modo completo', () => {
      window.open(`/admin-peticiones.html?petition_id=${encodeURIComponent(row.id)}#docs`, '_blank');
    });
  
    if (mapFilter === 'contratos') {
      addBtn('Publicar documento (Contratos)', () => {
        window.open(`/admin-peticiones.html?petition_id=${encodeURIComponent(row.id)}#docs`, '_blank');
      });
    }
  
    if (mapFilter === 'calculos' || mapFilter === 'cierre' || mapFilter === 'facturacion') {
      addBtn('Ir a Controles → Ledger', () => {
        window.open(`/admin-controles.html?petition_id=${encodeURIComponent(row.id)}&focus=ledger`, '_blank');
      });
      addBtn('Ir a Controles → Control Total', () => {
        window.open(`/admin-controles.html?petition_id=${encodeURIComponent(row.id)}&focus=control-total`, '_blank');
      });
    }
  }
  
  function renderMapSteps() {
    const wrap = document.getElementById('mapSteps');
    const hint = document.getElementById('mapHint');
    if (!wrap) return;
    wrap.innerHTML = '';
  
    const row = selectedPetitionId ? mapRows.find((x) => x.id === selectedPetitionId) : null;
    renderMapActions();
  
    if (!row) {
      hint.textContent = 'Selecciona una petición para ver el progreso. También puedes filtrar por paso.';
    } else {
      const bal = Number(row.balance_to_zero || 0);
      hint.textContent = `Balance a cero: €${bal.toFixed(2)} · Checklist faltantes: ${row.checklist_missing}`;
    }
  
    stepMeta().forEach((s) => {
      const div = document.createElement('div');
      div.className = 'step';
      div.dataset.step = s.key;
  
      const state = row && row.step_state ? row.step_state[s.key] : null;
      const ok = row ? Boolean(row.steps?.[s.key]) : false;
      if (state === 'NA') div.classList.add('todo');
      else if (state === 'OK') div.classList.add('ok');
      else if (state === 'BLOCK') div.classList.add('block');
      else div.classList.add('todo');
  
      if (state === 'NA') {
        div.style.opacity = '.55';
        div.style.cursor = 'not-allowed';
      }
  
      if (row && s.key === 'cierre' && row.status !== 'CERRADA_CERO') {
        // if trying to close but balance isn't ~0, show as block
        const bal = Math.abs(Number(row.balance_to_zero || 0));
        if (bal > 0.01) {
          div.classList.remove('todo');
          div.classList.add('block');
        }
      }
  
      if (mapFilter === s.key) div.classList.add('active');
  
      const miss = row && row.missing_by_step ? (row.missing_by_step[s.key] || []) : [];
      const missText = miss.length ? miss.slice(0,3).join(' · ') : '';
      div.title = miss.length ? miss.join('\n') : '';
      div.innerHTML = `
        <div class="label" style="display:flex; align-items:center; gap:8px;"><span class="badge" style="background:rgba(253,250,0,.22);"><i class="${s.icon||'fa-solid fa-circle' }"></i></span> ${s.label}</div>
        <div class="value">${s.hint}</div>
        <div class="label" style="margin-top:6px;">${row ? (ok ? '✅ OK' : '⏳ Pendiente') : '—'}</div>
        ${row ? `<div class="label" style="margin-top:6px; opacity:.85;">${miss.length ? `Falta: ${missText}${miss.length>3?'…':''}` : ''}</div>` : ''}
      `;
  
      div.onclick = () => {
        if (state === 'NA') return;
        mapFilter = s.key;
        renderMapTable();
        renderMapSteps();
      };
  
      wrap.appendChild(div);
    });
  }
  
  function passesFilter(r) {
    if (mapFilter === 'all') return true;
    // show petitions where that step is not completed yet (work queue),
    // except "cierre" where we show those not closed.
    if (mapFilter === 'cierre') return r.status !== 'CERRADA_CERO' && (r.step_state?.cierre !== 'NA');
    if (r.step_state && r.step_state[mapFilter] === 'NA') return false;
    if (!r.steps) return false;
    return !Boolean(r.steps[mapFilter]);
  }
  
  function renderMapTable() {
    const tbody = document.getElementById('mapTable');
    if (!tbody) return;
    tbody.innerHTML = '';
  
    let rows = mapRows.slice();
    if (selectedPetitionId) rows = rows.filter((r) => r.id === selectedPetitionId);
    rows = rows.filter(passesFilter);
  
    // Sort: priority desc, checklist missing desc, newest
    rows.sort((a, b) => (Number(b.priority||0) - Number(a.priority||0)) || (Number(b.checklist_missing) - Number(a.checklist_missing)) || String(b.created_at).localeCompare(String(a.created_at)));
  
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9">Sin resultados.</td></tr>';
      return;
    }
  
    rows.slice(0, 200).forEach((r) => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      if (selectedPetitionId === r.id) tr.style.background = 'rgba(253,250,0,.20)';
      tr.innerHTML = `
        <td>#${r.id}</td>
        <td>${r.type}</td>
        <td>${r.status}</td>
        <td>${(r.reference || '')}</td>
        <td>${r.checklist_missing}</td>
        <td>${r.docs_count}</td>
        <td>€${Number(r.flags?.ledgerIn || 0).toFixed(2)}</td>
        <td>€${Number(r.flags?.ledgerOut || 0).toFixed(2)}</td>
        <td>€${Number(r.balance_to_zero || 0).toFixed(2)}</td>
      `;
      tr.onclick = () => {
        selectedPetitionId = r.id;
        document.getElementById('mapPetitionSelect').value = String(r.id);
        renderMapSteps();
        renderMapActions();
        renderMapTable();
        // jump to peticiones view in legacy and open detail
        __openPetitionId = r.id;
        location.hash = '#/peticiones';
      };
      tbody.appendChild(tr);
    });
  }
  
  function wireMapControls() {
    const btn = document.getElementById('btnMapRefresh');
    if (btn) btn.onclick = () => loadMapSummary();
  
    document.querySelectorAll('[data-stepfilter]').forEach((b) => {
      b.addEventListener('click', () => {
        mapFilter = b.dataset.stepfilter;
        renderMapSteps();
        renderMapActions();
        renderMapTable();
      });
    });
  }
  
  
  // ---- Peticiones (Phase 3 native - read-only) ----
  let petNativeRows = [];
  let petNativeSelected = null;
  
  function wirePetitionsUI() {
    const btn = document.getElementById('btnPetRefresh');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.onclick = () => loadPetitionsNative();
    }
  
    const inp = document.getElementById('petSearch');
    if (inp && !inp.dataset.wired) {
      inp.dataset.wired = '1';
      inp.addEventListener('input', () => renderPetitionsNative());
    }
  
    const btnOpen = document.getElementById('btnPetOpenFull');
    if (btnOpen && !btnOpen.dataset.wired) {
      btnOpen.dataset.wired = '1';
      btnOpen.onclick = () => {
        if (!petNativeSelected) return;
        window.open(`/admin-peticiones.html?petition_id=${encodeURIComponent(petNativeSelected)}#docs`, '_blank');
      };
    }
  }
  
  async function loadPetitionsNative() {
    const data = await api('/admin/map/summary');
    petNativeRows = data.rows || [];
    renderPetitionsNative();
  }
  
  function renderPetitionsNative() {
    const tbody = document.getElementById('petTable');
    if (!tbody) return;
    tbody.innerHTML = '';
  
    const q = (document.getElementById('petSearch')?.value || '').trim().toLowerCase();
  
    let rows = petNativeRows.slice();
    if (q) {
      rows = rows.filter((r) => String(r.id).includes(q) || String(r.reference || '').toLowerCase().includes(q));
    }
  
    rows.slice(0, 250).forEach((r) => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      if (petNativeSelected === r.id) tr.style.background = 'rgba(253,250,0,.20)';
      tr.innerHTML = `<td>#${r.id}</td><td>${r.type}</td><td>${r.status}</td><td>${r.reference || ''}</td><td>${r.checklist_missing}</td>`;
      tr.onclick = () => selectPetitionNative(r.id);
      tbody.appendChild(tr);
    });
    if (rows.length === 0) tbody.innerHTML = '<tr><td colspan="5">Sin resultados.</td></tr>';
  }
  
  async function selectPetitionNative(id) {
    petNativeSelected = id;
    renderPetitionsNative();
  
    const empty = document.getElementById('petDetailEmpty');
    const wrap = document.getElementById('petDetail');
    if (!wrap) return;
  
    empty.classList.add('hidden');
    wrap.classList.remove('hidden');
    wrap.innerHTML = '<div class="small">Cargando…</div>';
  
    try {
      const p = await api(`/admin/petitions/${id}`);
      const chk = await api(`/admin/petitions/${id}/checklist`);
  
      const row = petNativeRows.find((x) => x.id === id) || {};
      const bal = Number(row.balance_to_zero || 0);
  
      wrap.innerHTML = `
        <h3 style="margin:0 0 8px 0;">#${id} · ${p.type} · ${p.status}</h3>
        <div class="small">Referencia: <strong>${row.reference || ''}</strong></div>
        <div class="small">Checklist faltantes: <strong>${row.checklist_missing}</strong> · Docs: <strong>${row.docs_count}</strong></div>
        <div id="petMissingBox" style="margin-top:10px;"></div>
        <div class="small">Ledger IN: <strong>€${Number(row.flags?.ledgerIn || 0).toFixed(2)}</strong> · OUT: <strong>€${Number(row.flags?.ledgerOut || 0).toFixed(2)}</strong></div>
        <div class="small">Balance a cero: <strong>€${bal.toFixed(2)}</strong></div>
  
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn" type="button" onclick="window.open('/admin-controles.html?petition_id=${id}&focus=ledger','_blank')">Ir a Controles → Ledger</button>
          <button class="btn" type="button" onclick="window.open('/admin-controles.html?petition_id=${id}&focus=control-total','_blank')">Ir a Controles → Control Total</button>
          <button class="btn" type="button" onclick="window.open('/admin-peticiones.html?petition_id=${id}#docs','_blank')">Abrir modo completo</button>
        </div>
  
        
        <h4 style="margin:14px 0 6px 0;">Acciones (Admin)</h4>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <select id="petStatusSelect" class="btn"></select>
          <button id="btnPetSetStatus" class="btn" type="button">Cambiar estado</button>
          <button id="btnPetApprove" class="btn" type="button">Aprobar (VALIDAR)</button>
          <button id="btnPetNeedInfo" class="btn" type="button">Pedir info</button>
          <button id="btnPetReject" class="btn" type="button">Rechazar</button>
        </div>
  
        <h4 style="margin:14px 0 6px 0;">Publicar documento oficial</h4>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <input id="petDocFile" type="file" class="btn" />
          <button id="btnPetUploadDoc" class="btn" type="button">Subir documento</button>
          <button id="btnPetEmitPresupuesto" class="btn" type="button">Emitir PDF Presupuesto</button>
          <button id="btnPetEmitFactura" class="btn btn-primary" type="button">Emitir PDF Factura</button>
          <button id="btnPetEmitContrato" class="btn btn-primary" type="button">Emitir PDF Contrato</button>
          <button id="btnPetEmitNomina" class="btn btn-primary" type="button">Emitir PDF Nómina</button>
          <button id="btnOpenAdminWizard" class="btn" type="button">Editar (Wizard)</button>
        </div>
        <div class="small" id="petDocResult" style="margin-top:6px;"></div>
  
        <h4 style="margin:14px 0 6px 0;">Mensajes internos</h4>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <select id="petMsgKind" class="btn"><option value="CHAT">Chat</option><option value="AVISO">Aviso</option></select>
          <input id="petMsgBody" class="btn" placeholder="Escribir…" style="flex:1; min-width:260px;" />
          <button id="btnPetSendMsg" class="btn" type="button">Enviar</button>
        </div>
        <div id="petMessages" class="small" style="margin-top:8px;">—</div>
  
        <h4 style="margin:14px 0 6px 0;">Timeline</h4>
        <div id="petTimeline" class="small">Cargando timeline…</div>
  
        <h4 style="margin:14px 0 6px 0;">Qué falta por paso</h4>
  
        ${stepMeta().map((s) => {
          const miss = (row.missing_by_step && row.missing_by_step[s.key]) ? row.missing_by_step[s.key] : [];
          const st = row.step_state ? row.step_state[s.key] : null;
          const badge = st === 'OK' ? '✅' : (st === 'NA' ? '—' : (st === 'BLOCK' ? '⛔' : '⏳'));
          return `<div class="small"><strong>${badge} ${s.label}</strong>: ${miss.length ? miss.map((x)=>String(x)).join(' · ') : ''}</div>`;
        }).join('')}
      `;
      await wirePetitionActionsNative(id, p.type, p.status);
    } catch (err) {
      wrap.innerHTML = `<div class="small">ERROR: ${err.message}</div>`;
    }
  }
  
  
  async function uploadFile(path, file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api' + path, { method: 'POST', credentials: 'include', body: fd });
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (!res.ok) {
      const e = new Error(body?.error || 'Upload failed');
      e.status = res.status;
      e.body = body;
      throw e;
    }
    return body;
  }
  
  
  function statusOptions() {
    return [
      'BORRADOR',
      'PENDIENTE_VALIDACION',
      'PENDIENTE_INFO',
      'VALIDADA',
      'LABORAL_EN_CURSO',
      'CONTRATO_EN_CURSO',
      'FACTURA_EMITIDA',
      'NOMINA_PUBLICADA',
      'COBRADA',
      'PAGADA',
      'CERRADA_CERO',
      'RECHAZADA',
    ];
  }
  
  async function loadTimelineNative(petitionId) {
    const el = document.getElementById('petTimeline');
    if (!el) return;
    el.textContent = 'Cargando timeline…';
    try {
      const data = await api(`/admin/petitions/${petitionId}/timeline`);
      const rows = data.rows || [];
      if (!rows.length) { el.textContent = 'Sin eventos.'; return; }
      el.innerHTML = rows.slice(0, 40).map((r) => {
        const when = r.created_at || '';
        const who = r.actor_role ? `${r.actor_role}${r.actor_user_id ? `#${r.actor_user_id}` : ''}` : '';
        const payload = r.payload ? JSON.stringify(r.payload) : '';
        return `<div style="padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06);">
          <strong>${r.event_type}</strong> · ${when} · ${who}<br/>
          <span style="opacity:.85">${payload}</span>
        </div>`;
      }).join('');
    } catch (e) {
      el.textContent = `ERROR timeline: ${e.message}`;
    }
  }
  
  async function wirePetitionActionsNative(petitionId, type, currentStatus) {
    const sel = document.getElementById('petStatusSelect');
    if (!sel) return;
    sel.innerHTML = '';
    statusOptions().forEach((s) => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = s;
      if (s === currentStatus) o.selected = true;
      sel.appendChild(o);
    });
  
    document.getElementById('btnPetSetStatus').onclick = async () => {
      await api(`/admin/petitions/${petitionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: sel.value }),
      });
      await loadPetitionsNative();
      await selectPetitionNative(petitionId);
    };
  
    document.getElementById('btnPetApprove').onclick = async () => {
      await api(`/admin/petitions/${petitionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VALIDADA' }),
      });
      await loadPetitionsNative();
      await selectPetitionNative(petitionId);
    };
  
    document.getElementById('btnPetNeedInfo').onclick = async () => {
      await api(`/admin/petitions/${petitionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDIENTE_INFO' }),
      });
      await loadPetitionsNative();
      await selectPetitionNative(petitionId);
    };
  
    document.getElementById('btnPetReject').onclick = async () => {
      if (!confirm('Rechazar petición?')) return;
      await api(`/admin/petitions/${petitionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECHAZADA' }),
      });
      await loadPetitionsNative();
      await selectPetitionNative(petitionId);
    };
  
    const emitBtn = document.getElementById('btnPetEmitPresupuesto');
    emitBtn.style.display = (String(type).toUpperCase() === 'PRESUPUESTO') ? '' : 'none';
    emitBtn.onclick = async () => {
      const out = document.getElementById('petDocResult');
      out.textContent = 'Emitiendo PDF...';
      await api(`/admin/petitions/${petitionId}/emit/PRESUPUESTO`, { method: 'POST' });
      out.textContent = 'OK. PDF publicado.';
    };
  
    const emitFactura = document.getElementById('btnPetEmitFactura');
    const emitContrato = document.getElementById('btnPetEmitContrato');
    const emitNomina = document.getElementById('btnPetEmitNomina');
  
    const tU = String(type).toUpperCase();
    emitFactura.style.display = (tU === 'ALTA_FACTURA' || tU === 'FORMACION') ? '' : 'none';
    emitContrato.style.display = (tU === 'FORMACION') ? '' : 'none';
    emitNomina.style.display = (tU === 'FORMACION') ? '' : 'none';
  
    emitFactura.onclick = async () => {
      const out = document.getElementById('petDocResult');
      out.textContent = 'Emitiendo FACTURA...';
      await api(`/admin/petitions/${petitionId}/emit/FACTURA`, { method: 'POST' });
      out.textContent = 'OK. Factura PDF publicada.';
    };
  
    emitContrato.onclick = async () => {
      const out = document.getElementById('petDocResult');
      out.textContent = 'Emitiendo CONTRATO...';
      await api(`/admin/petitions/${petitionId}/emit/CONTRATO`, { method: 'POST' });
      out.textContent = 'OK. Contrato PDF publicado.';
    };
  
    emitNomina.onclick = async () => {
      const out = document.getElementById('petDocResult');
      out.textContent = 'Emitiendo NÓMINA...';
      await api(`/admin/petitions/${petitionId}/emit/NOMINA`, { method: 'POST' });
      out.textContent = 'OK. Nómina PDF publicada.';
    };
  
    document.getElementById('btnOpenAdminWizard').onclick = () => {
      location.hash = `#/admin-wizard?petition_id=${petitionId}`;
    };
  
      document.getElementById('btnPetUploadDoc').onclick = async () => {
      const input = document.getElementById('petDocFile');
      const out = document.getElementById('petDocResult');
      const file = input.files && input.files[0];
      if (!file) { out.textContent = 'Selecciona un archivo.'; return; }
      out.textContent = 'Subiendo...';
      await uploadFile(`/admin/petitions/${petitionId}/documents`, file);
      out.textContent = 'OK. Documento publicado.';
    };
  
    await loadPetitionMessagesNative(petitionId);
    await wireMessagesComposer(petitionId);
    await loadTimelineNative(petitionId);
  }
  
  
  async function loadPetitionMessagesNative(petitionId) {
    const box = document.getElementById('petMessages');
    if (!box) return;
    box.innerHTML = 'Cargando mensajes…';
    try {
      const data = await api(`/petitions/${petitionId}/messages`);
      const rows = data.rows || [];
      if (!rows.length) { box.innerHTML = '<div class="small">Sin mensajes.</div>'; return; }
      box.innerHTML = rows.slice(-30).map((m) => {
        const who = `${m.from_role}#${m.from_user_id}`;
        const kind = m.kind === 'AVISO' ? '🔔 AVISO' : '💬';
        return `<div style="padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06);">
          <strong>${kind}</strong> · ${who} · ${m.created_at}<br/>
          ${String(m.body).replace(/</g,'&lt;')}
        </div>`;
      }).join('');
    } catch (e) {
      box.textContent = `ERROR mensajes: ${e.message}`;
    }
  }
  
  async function wireMessagesComposer(petitionId) {
    const input = document.getElementById('petMsgBody');
    const btn = document.getElementById('btnPetSendMsg');
    const kind = document.getElementById('petMsgKind');
    if (!btn || !input || !kind) return;
  
    btn.onclick = async () => {
      const body = input.value.trim();
      if (!body) return;
      await api(`/petitions/${petitionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, kind: kind.value }),
      });
      input.value = '';
      await loadPetitionMessagesNative(petitionId);
      await refreshBadges();
    };
  }
  
  
  function wireAnnouncements() {
    const btn = document.getElementById('btnSendAnn');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.onclick = async () => {
      const title = (document.getElementById('annTitle')?.value || '').trim();
      const body = (document.getElementById('annBody')?.value || '').trim();
      const scope = (document.getElementById('annScope')?.value || '').trim();
      const scope_value = (document.getElementById('annScopeValue')?.value || '').trim() || null;
      const out = document.getElementById('annResult');
      out.textContent = 'Enviando...';
      try {
        const payload = { title, body, scope, scope_value };
        const data = await api('/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        out.textContent = `OK. Recipients: ${data.recipients}`;
        document.getElementById('annTitle').value = '';
        document.getElementById('annBody').value = '';
        await refreshBadges();
      } catch (e) {
        out.textContent = `ERROR: ${e.message}`;
      }
    };
  }
  
  
  // ---- Inbox (premium) ----
  let inboxTab = 'notifs';
  let inboxCache = { notifs: [], ann: [], threads: [], groups: [], groupMembers: {} };
  let inboxSelected = null;
  
  function setInboxTab(tab) {
    inboxTab = tab;
    inboxSelected = null;
    renderInboxList();
    renderInboxDetail();
  }
  
  function wireInbox() {
    document.querySelectorAll('[data-inboxtab]').forEach((b) => {
      if (b.dataset.wired) return;
      b.dataset.wired = '1';
      b.onclick = () => setInboxTab(b.dataset.inboxtab);
    });
  
    wireNotifFilters();
  
    const btn = document.getElementById('btnInboxRefresh');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.onclick = () => loadInbox();
    }
  
    const btnAll = document.getElementById('btnMarkAllRead');
    if (btnAll && !btnAll.dataset.wired) {
      btnAll.dataset.wired = '1';
      btnAll.onclick = async () => {
        // mark all notifications read
        for (const n of inboxCache.notifs) {
          if (!n.read) {
            try { await api(`/notifications/${n.id}/read`, { method: 'PUT' }); } catch {}
          }
        }
        await loadInbox();
      };
    }
  }
  
  async function loadInbox() {
    // notifications
    try {
      const n = await api('/notifications');
      inboxCache.notifs = Array.isArray(n) ? n : (n.rows || []);
    } catch { inboxCache.notifs = []; }
  
    // announcements
    try {
      const a = await api('/announcements');
      inboxCache.ann = a.rows || [];
    } catch { inboxCache.ann = []; }
  
    // threads
    try {
      const t = await api('/messages/threads');
      inboxCache.threads = t.rows || [];
    } catch { inboxCache.threads = []; }
  
    // groups (admin)
    try {
      const g = await api('/admin/groups');
      inboxCache.groups = g.rows || [];
    } catch { inboxCache.groups = []; }
  
    wireNotifFilters();
    renderInboxList();
    renderInboxDetail();
    await refreshBadges();
  }
  
  function renderInboxList() {
    const el = document.getElementById('inboxList');
    if (!el) return;
  
    if (inboxTab === 'notifs') {
      const rows = inboxCache.notifs.filter(notifPasses).slice(0, 200);
      el.innerHTML = rows.length ? rows.map((n) => {
        const unread = n.read ? '' : '🔴 ';
        const sel = inboxSelected && inboxSelected.type === 'notif' && inboxSelected.id === n.id ? 'style="background:rgba(253,250,0,.20); padding:8px; border-radius:12px;"' : '';
        return `<div ${sel} style="padding:8px; border-bottom:1px solid rgba(0,0,0,.06); cursor:pointer;" data-notif="${n.id}">
          <div><strong>${unread}${(n.message || '').slice(0, 90)}</strong></div>
          <div class="small">${n.created_at || ''}</div>
        </div>`;
      }).join('') : '<div class="small">Sin notificaciones.</div>';
  
      el.querySelectorAll('[data-notif]').forEach((d) => {
        d.onclick = () => { inboxSelected = { type: 'notif', id: Number(d.dataset.notif) }; renderInboxList(); renderInboxDetail(); };
      });
      return;
    }
  
    if (inboxTab === 'ann') {
      const rows = inboxCache.ann.slice(0, 200);
      el.innerHTML = rows.length ? rows.map((a) => {
        const sel = inboxSelected && inboxSelected.type === 'ann' && inboxSelected.id === a.id ? 'style="background:rgba(253,250,0,.20); padding:8px; border-radius:12px;"' : '';
        return `<div ${sel} style="padding:8px; border-bottom:1px solid rgba(0,0,0,.06); cursor:pointer;" data-ann="${a.id}">
          <div><strong>📣 ${(a.title || '').slice(0, 90)}</strong></div>
          <div class="small">${a.scope}${a.scope_value ? ` · ${a.scope_value}` : ''} · ${a.created_at || ''}</div>
        </div>`;
      }).join('') : '<div class="small">Sin avisos.</div>';
  
      el.querySelectorAll('[data-ann]').forEach((d) => {
        d.onclick = () => { inboxSelected = { type: 'ann', id: Number(d.dataset.ann) }; renderInboxList(); renderInboxDetail(); };
      });
      return;
    }
  
    if (inboxTab === 'threads') {
      const rows = inboxCache.threads.slice(0, 200);
      el.innerHTML = rows.length ? rows.map((t) => {
        const unread = Number(t.unread_count || 0) ? `🔴 ${t.unread_count} ` : '';
        const sel = inboxSelected && inboxSelected.type === 'thread' && inboxSelected.id === t.petition_id ? 'style="background:rgba(253,250,0,.20); padding:8px; border-radius:12px;"' : '';
        return `<div ${sel} style="padding:8px; border-bottom:1px solid rgba(0,0,0,.06); cursor:pointer;" data-thread="${t.petition_id}">
          <div><strong>${unread}Petición #${t.petition_id} · ${t.type}</strong></div>
          <div class="small">${(t.last_body || '').slice(0, 120)}</div>
          <div class="small">${t.status} · ${t.last_at || ''}</div>
        </div>`;
      }).join('') : '<div class="small">Sin threads.</div>';
  
      el.querySelectorAll('[data-thread]').forEach((d) => {
        d.onclick = () => { inboxSelected = { type: 'thread', id: Number(d.dataset.thread) }; renderInboxList(); renderInboxDetail(); };
      });
      return;
    }
  
    if (inboxTab === 'groups') {
      const rows = inboxCache.groups.slice(0, 200);
      el.innerHTML = `
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
          <input id="grpName" class="btn" placeholder="Nombre grupo" />
          <input id="grpDesc" class="btn" placeholder="Descripción" style="flex:1; min-width:220px;" />
          <button id="btnGrpCreate" class="btn" type="button">Crear</button>
          <span id="grpOut" class="small"></span>
        </div>
        ${rows.length ? rows.map((g) => {
          const sel = inboxSelected && inboxSelected.type === 'group' && inboxSelected.id === g.id ? 'style="background:rgba(253,250,0,.20); padding:8px; border-radius:12px;"' : '';
          return `<div ${sel} style="padding:8px; border-bottom:1px solid rgba(0,0,0,.06); cursor:pointer;" data-group="${g.id}">
            <div><strong>👥 ${g.name}</strong></div>
            <div class="small">${g.description || ''}</div>
          </div>`;
        }).join('') : '<div class="small">Sin grupos.</div>'}
      `;
      const btn = document.getElementById('btnGrpCreate');
      if (btn && !btn.dataset.wired) {
        btn.dataset.wired = '1';
        btn.onclick = async () => {
          const name = (document.getElementById('grpName').value || '').trim();
          const description = (document.getElementById('grpDesc').value || '').trim() || null;
          const out = document.getElementById('grpOut');
          out.textContent = '...';
          try {
            await api('/admin/groups', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, description }) });
            out.textContent = 'OK';
            await loadInbox();
          } catch (e) {
            out.textContent = `ERROR: ${e.message}`;
          }
        };
      }
      el.querySelectorAll('[data-group]').forEach((d) => {
        d.onclick = () => { inboxSelected = { type: 'group', id: Number(d.dataset.group) }; renderInboxList(); renderInboxDetail(); };
      });
      return;
    }
  }
  
  async function renderInboxDetail() {
    const el = document.getElementById('inboxDetail');
    if (!el) return;
  
    if (!inboxSelected) {
      el.textContent = 'Seleccioná un item.';
      return;
    }
  
    if (inboxSelected.type === 'notif') {
      const n = inboxCache.notifs.find((x) => x.id === inboxSelected.id);
      if (!n) { el.textContent = 'No encontrado.'; return; }
      el.innerHTML = `
        <h3 style="margin:0 0 8px 0;">Notificación</h3>
        <div class="small">${n.created_at || ''}</div>
        <p>${(n.message || '').replace(/</g,'&lt;')}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
          <button class="btn" type="button" id="btnNotifRead">${n.read ? 'Leída' : 'Marcar leída'}</button>
          <button class="btn" type="button" id="btnNotifOpen">Abrir</button>
        </div>
      `;
      document.getElementById('btnNotifOpen').onclick = () => {
        const link = notifDeepLink(n);
        if (!link) return;
        if (link.hash) {
          __openPetitionId = link.petition_id || null;
          location.hash = link.hash;
        } else if (link.open) {
          window.open(link.open, '_blank');
        }
      };
  
      document.getElementById('btnNotifRead').onclick = async () => {
        await api(`/notifications/${n.id}/read`, { method: 'PUT' });
        await loadInbox();
      };
      return;
    }
  
    if (inboxSelected.type === 'ann') {
      const a = inboxCache.ann.find((x) => x.id === inboxSelected.id);
      if (!a) { el.textContent = 'No encontrado.'; return; }
      el.innerHTML = `
        <h3 style="margin:0 0 8px 0;">📣 ${String(a.title||'').replace(/</g,'&lt;')}</h3>
        <div class="small">${a.created_at || ''} · ${a.scope}${a.scope_value ? ` · ${a.scope_value}` : ''}</div>
        <p>${String(a.body||'').replace(/</g,'&lt;')}</p>
      `;
      return;
    }
  
    if (inboxSelected.type === 'thread') {
      const pid = inboxSelected.id;
      el.innerHTML = `<div class="small">Cargando thread #${pid}...</div>`;
      try {
        const data = await api(`/petitions/${pid}/messages`);
        const rows = data.rows || [];
        // mark read for current user
        try { await api(`/petitions/${pid}/messages/read`, { method: 'PUT' }); } catch {}
        await refreshBadges();
  
        el.innerHTML = `
          <h3 style="margin:0 0 8px 0;">Thread — Petición #${pid}</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
            <select id="inboxMsgKind" class="btn"><option value="CHAT">Chat</option><option value="AVISO">Aviso</option></select>
            <input id="inboxMsgBody" class="btn" placeholder="Escribir..." style="flex:1; min-width:260px;" />
            <button id="btnInboxSend" class="btn" type="button">Enviar</button>
          </div>
          <div id="inboxMsgs">
            ${rows.map((m) => `<div style="padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06);">
              <strong>${m.kind === 'AVISO' ? '🔔 AVISO' : '💬'}</strong> · ${m.from_role}#${m.from_user_id} · ${m.created_at}<br/>
              ${String(m.body).replace(/</g,'&lt;')}
            </div>`).join('') || '<div class="small">Sin mensajes.</div>'}
          </div>
        `;
        document.getElementById('btnInboxSend').onclick = async () => {
          const body = (document.getElementById('inboxMsgBody').value || '').trim();
          const kind = document.getElementById('inboxMsgKind').value;
          if (!body) return;
          await api(`/petitions/${pid}/messages`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ body, kind }) });
          document.getElementById('inboxMsgBody').value = '';
          await loadInbox();
          inboxSelected = { type: 'thread', id: pid };
          await renderInboxDetail();
        };
      } catch (e) {
        el.textContent = `ERROR thread: ${e.message}`;
      }
      return;
    }
  
    if (inboxSelected.type === 'group') {
      const gid = inboxSelected.id;
      el.innerHTML = `<div class="small">Cargando miembros...</div>`;
      try {
        const mem = await api(`/admin/groups/${gid}/members`);
        const rows = mem.rows || [];
        el.innerHTML = `
          <h3 style="margin:0 0 8px 0;">Grupo #${gid}</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
            <input id="grpUserEmail" class="btn" placeholder="Buscar email…" style="flex:1; min-width:220px;" /><div id="grpUserResults" class="small" style="width:100%;"></div>
            <button id="btnGrpAdd" class="btn" type="button">Agregar</button>
            <span id="grpMemOut" class="small"></span>
          </div>
          <div>
            ${rows.length ? rows.map((u) => `<div style="padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06);">
              <strong>${u.email}</strong> · ${u.role} · id=${u.id}
              <button class="btn" style="margin-left:8px;" data-rm="${u.id}">Quitar</button>
            </div>`).join('') : '<div class="small">Sin miembros.</div>'}
          </div>
        `;
        await wireGroupUserSearch(gid);
  
        document.getElementById('btnGrpAdd').onclick = async () => {
          // kept for compatibility (no-op)
        };
        el.querySelectorAll('[data-rm]').forEach((b) => {
          b.onclick = async () => {
            const uid = Number(b.dataset.rm);
            await api(`/admin/groups/${gid}/members/${uid}`, { method: 'DELETE' });
            await renderInboxDetail();
          };
        });
      } catch (e) {
        el.textContent = `ERROR grupo: ${e.message}`;
      }
      return;
    }
  }
  
  
  async function wireGroupUserSearch(gid) {
    const inp = document.getElementById('grpUserEmail');
    const box = document.getElementById('grpUserResults');
    const out = document.getElementById('grpMemOut');
    if (!inp || !box) return;
  
    let lastQ = '';
    inp.oninput = async () => {
      const q = (inp.value || '').trim();
      if (q.length < 2) { box.innerHTML = ''; return; }
      if (q === lastQ) return;
      lastQ = q;
      try {
        const data = await api(`/admin/users/search?q=${encodeURIComponent(q)}`);
        const rows = data.rows || [];
        box.innerHTML = rows.length ? rows.map((u) => 
          `<div style="padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06); display:flex; justify-content:space-between; gap:8px;">
             <span><strong>${u.email}</strong> · ${u.role} · id=${u.id}</span>
             <button class="btn" type="button" data-adduid="${u.id}">Agregar</button>
           </div>`
        ).join('') : '<div class="small">Sin resultados.</div>';
  
        box.querySelectorAll('[data-adduid]').forEach((b) => {
          b.onclick = async () => {
            const uid = Number(b.dataset.adduid);
            out.textContent = '...';
            try {
              await api(`/admin/groups/${gid}/members`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: uid }) });
              out.textContent = 'OK';
              await renderInboxDetail();
            } catch (e) {
              out.textContent = `ERROR: ${e.message}`;
            }
          };
        });
      } catch (e) {
        box.innerHTML = `<div class="small">ERROR: ${e.message}</div>`;
      }
    };
  }
  
  
  let notifFilterState = { unread: 'all', type: 'all', severity: 'all' };
  
  function wireNotifFilters() {
    const u = document.getElementById('notifFilterUnread');
    const t = document.getElementById('notifFilterType');
    const s = document.getElementById('notifFilterSeverity');
    if (!u || u.dataset.wired) return;
    u.dataset.wired = '1';
    t.dataset.wired = '1';
    s.dataset.wired = '1';
  
    const refreshOpts = () => {
      const types = Array.from(new Set(inboxCache.notifs.map((n) => n.notif_type || 'GENERIC'))).sort();
      const sevs = Array.from(new Set(inboxCache.notifs.map((n) => n.severity || 'INFO'))).sort();
      t.innerHTML = `<option value="all">Tipo: todas</option>` + types.map((x) => `<option value="${x}">${x}</option>`).join('');
      s.innerHTML = `<option value="all">Severidad: todas</option>` + sevs.map((x) => `<option value="${x}">${x}</option>`).join('');
      t.value = notifFilterState.type;
      s.value = notifFilterState.severity;
      u.value = notifFilterState.unread;
    };
  
    u.onchange = () => { notifFilterState.unread = u.value; renderInboxList(); };
    t.onchange = () => { notifFilterState.type = t.value; renderInboxList(); };
    s.onchange = () => { notifFilterState.severity = s.value; renderInboxList(); };
  
    refreshOpts();
  }
  
  function notifPasses(n) {
    if (notifFilterState.unread === 'unread' && n.read) return false;
    if (notifFilterState.type !== 'all' && (n.notif_type || 'GENERIC') !== notifFilterState.type) return false;
    if (notifFilterState.severity !== 'all' && (n.severity || 'INFO') !== notifFilterState.severity) return false;
    return true;
  }
  
  function parseNotifMeta(n) {
    try { return n.meta_json ? JSON.parse(n.meta_json) : {}; } catch { return {}; }
  }
  
  function notifDeepLink(n) {
    const meta = parseNotifMeta(n);
    if (meta?.route === 'peticiones' && meta.petition_id) {
      return { hash: '#/peticiones', petition_id: meta.petition_id };
    }
    if (meta?.route === 'controles' && meta.petition_id) {
      return { open: `/admin-controles.html?petition_id=${encodeURIComponent(meta.petition_id)}&focus=${encodeURIComponent(meta.focus||'ledger')}` };
    }
    // fallback: parse "[Petición #123]"
    const m = String(n.message||'').match(/Petición\s*#(\d+)/i);
    if (m) return { hash: '#/peticiones', petition_id: Number(m[1]) };
    return null;
  }
  
  
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  
  function renderPetMissing(id, chk) {
    const box = document.getElementById('petMissingBox');
    if (!box || !chk?.checklist) return;
    const { missingFields = [], missingDocs = [], ruleErrors = [] } = chk.checklist || {};
    const total = missingFields.length + missingDocs.length + ruleErrors.length;
  
    const linkFull = `/admin-peticiones.html?petition_id=${id}`;
    const linkDocs = `${linkFull}#docs`;
    const linkData = `${linkFull}#data`;
  
    const fieldsHtml = missingFields.length ? `
      <div class="card" style="padding:12px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
          <div><strong>Faltan ${missingFields.length} campos</strong></div>
          <button class="btn btn-primary" type="button" onclick="window.open('${linkData}','_blank')">Abrir formulario</button>
        </div>
        <div class="small" style="margin-top:8px;">
          ${missingFields.slice(0, 30).map((f) => {
            const path = String(f.path || '');
            const target = path.startsWith('payload.invoice') || path.startsWith('invoice.')
              ? `location.hash='#/facturacion?petition_id=${id}'`
              : `window.open('/admin-peticiones.html?petition_id=${id}&focus_field=${encodeURIComponent(path)}','_blank')`;
            return `<div>• <strong>${esc(f.label)}</strong> <span class="small">(${esc(path)})</span> <button class="btn" style="margin-left:8px; padding:6px 10px;" type="button" onclick="${target}">Ir</button></div>`;
          }).join('')}
          ${missingFields.length > 30 ? `<div class="small">+${missingFields.length-30} más…</div>` : ''}
        </div>
      </div>` : '';
  
    const docsHtml = missingDocs.length ? `
      <div class="card" style="padding:12px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
          <div><strong>Faltan ${missingDocs.length} documentos</strong></div>
          <button class="btn btn-primary" type="button" onclick="window.open('${linkDocs}','_blank')">Subir docs</button>
        </div>
        <div class="small" style="margin-top:8px;">
          ${missingDocs.map((d) => `<div>• <strong>${esc(d.doc_type)}</strong></div>`).join('')}
        </div>
      </div>` : '';
  
    const rulesHtml = ruleErrors.length ? `
      <div class="card" style="padding:12px; margin-top:10px;">
        <div><strong>Reglas bloqueantes (${ruleErrors.length})</strong></div>
        <div class="small" style="margin-top:8px;">
          ${ruleErrors.map((r) => `<div>• <strong>${esc(r.code)}</strong>: ${esc(r.message)}</div>`).join('')}
        </div>
      </div>` : '';
  
    box.innerHTML = `
      <div class="small">Detalle de faltantes (schema por tipo): <strong>${total}</strong></div>
      ${fieldsHtml}${docsHtml}${rulesHtml}
    `;
  }
  
  
  function wireDrawer() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const btnBurger = document.getElementById('btnBurger');
    const btnClose = document.getElementById('btnCloseSidebar');
    if (!sidebar || !overlay || !btnBurger || !btnClose) return;
  
    const ensureDrawerClass = () => {
      if (window.matchMedia('(max-width: 900px)').matches) {
        sidebar.classList.add('drawer');
      } else {
        sidebar.classList.remove('drawer', 'open');
        overlay.classList.add('hidden');
      }
    };
  
    const open = () => {
      sidebar.classList.add('open');
      overlay.classList.remove('hidden');
    };
    const close = () => {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
    };
  
    btnBurger.onclick = open;
    btnClose.onclick = close;
    overlay.onclick = close;
  
    window.addEventListener('resize', ensureDrawerClass);
    ensureDrawerClass();
  
    // auto-close when navigating on mobile
    document.querySelectorAll('.sidebar .nav a').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 900px)').matches) close();
      });
    });
  }
  
  
  async function renderInvoiceRecon(petitionId, type) {
    const box = document.getElementById('petInvoiceRecon');
    if (!box) return;
    const tU = String(type||'').toUpperCase();
    if (!['ALTA_FACTURA','FORMACION'].includes(tU)) { box.innerHTML=''; return; }
  
    // Pull latest invoice doc (if any)
    let invDoc = null;
    try {
      const docs = await api(`/admin/petitions/${petitionId}/documents`);
      const rows = docs.rows || [];
      invDoc = rows.find((d) => d.doc_type === 'FACTURA_PDF') || null;
    } catch { invDoc = null; }
  
    const ext = invDoc ? {
      system: invDoc.external_system || '',
      external_id: invDoc.external_id || '',
      series: invDoc.external_series || '',
      number: invDoc.external_number || '',
      status: invDoc.sync_status || ''
    } : { system:'', external_id:'', series:'', number:'', status:'' };
  
    box.innerHTML = `
      <div class="card" style="padding:12px;">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
          <div>
            <strong>Facturación · Conciliación DelSol</strong>
            <div class="small">La numeración oficial se asigna al conciliar con DelSol (auto o manual). Antes de eso, el PDF queda “sin número”.</div>
          </div>
          <span class="badge ${ext.status==='MATCHED'?'ok':(ext.status?'warn':'info')}">${ext.status || 'PENDING'}</span>
        </div>
  
        <div class="small" style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px;" id="invGrid">
          <div>
            <div class="small"><strong>External ID (DelSol)</strong></div>
            <input class="btn" id="invExternalId" placeholder="id en DelSol" value="${esc(ext.external_id)}" />
          </div>
          <div>
            <div class="small"><strong>Serie</strong></div>
            <input class="btn" id="invSeries" placeholder="SERIE" value="${esc(ext.series)}" />
          </div>
          <div>
            <div class="small"><strong>Número</strong></div>
            <input class="btn" id="invNumber" placeholder="000123" value="${esc(ext.number)}" />
          </div>
          <div>
            <div class="small"><strong>Modo</strong></div>
            <select class="btn" id="invMode">
              <option value="MANUAL">MANUAL</option>
              <option value="AUTO">AUTO</option>
            </select>
          </div>
        </div>
  
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btnRecon" type="button">Conciliar</button>
          <button class="btn" id="btnReconClear" type="button">Limpiar</button>
        </div>
  
        <div class="small" id="invOut" style="margin-top:8px;"></div>
      </div>
    `;
  
    // responsive: grid to 1 col on mobile
    if (window.matchMedia('(max-width: 900px)').matches) {
      const g = document.getElementById('invGrid');
      if (g) g.style.gridTemplateColumns = '1fr';
    }
  
    document.getElementById('btnReconClear').onclick = () => {
      document.getElementById('invExternalId').value='';
      document.getElementById('invSeries').value='';
      document.getElementById('invNumber').value='';
    };
  
    document.getElementById('btnRecon').onclick = async () => {
      const out = document.getElementById('invOut');
      out.textContent = 'Conciliando...';
      const payload = {
        system: 'DELSOL',
        mode: document.getElementById('invMode').value,
        external_id: document.getElementById('invExternalId').value,
        external_series: document.getElementById('invSeries').value,
        external_number: document.getElementById('invNumber').value,
      };
      await api(`/admin/petitions/${petitionId}/reconcile-invoice`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      out.textContent = 'OK. Conciliación guardada.';
    };
  }
  
  
  function setByPath(obj, path, value){
    const parts=String(path||'').split('.');
    let cur=obj;
    for(let i=0;i<parts.length-1;i++){
      const k=parts[i];
      if(cur[k]==null || typeof cur[k]!=='object') cur[k]={};
      cur=cur[k];
    }
    cur[parts[parts.length-1]]=value;
  }
  function getByPath(obj, path){
    const parts=String(path||'').split('.');
    let cur=obj;
    for(const p of parts){
      if(cur==null) return null;
      cur=cur[p];
    }
    return cur;
  }
  
  function inputForField(f, value){
    const id = `af_${String(f.path||'').replaceAll('.','_')}`;
    const common = `id="${id}" data-path="${esc(f.path)}" class="btn" style="width:100%;"`;
    if (f.type === 'number') return `<input ${common} type="number" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder||'')}" />`;
    if (f.type === 'date') return `<input ${common} type="date" value="${esc(value ?? '')}" />`;
    if (f.type === 'select' && Array.isArray(f.options)) {
      return `<select ${common}>${f.options.map(o=>`<option value="${esc(o)}" ${String(o)===String(value)?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
    }
    return `<input ${common} type="text" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder||'')}" />`;
  }
  
  async function loadFacturacion(petitionId) {
    const body = document.getElementById('factBody');
    if (!body) return;
    if (!petitionId) { body.innerHTML = 'Seleccioná una petición.'; return; }
  
    body.innerHTML = `<div class="skeleton" style="height:22px; margin-bottom:10px;"></div><div class="skeleton" style="height:160px;"></div>`;
    const p = await api(`/admin/petitions/${petitionId}`);
    const schema = await api(`/admin/petitions/${petitionId}/schema`);
    const chk = await api(`/admin/petitions/${petitionId}/checklist`);
  
    const fields = (schema.fields||[]).filter((f)=>String(f.path||'').startsWith('payload.invoice'));
    const payload = p.payload || {};
    const invMissing = (chk?.checklist?.ruleErrors||[]).map((r)=>`• ${esc(r.message)}`).join('<br/>');
  
    body.innerHTML = `
      <div class="card" style="padding:12px;">
        <div class="card-header">
          <div>
            <div class="card-title">Datos de factura</div>
            <div class="card-subtitle">Reglas por país: ${invMissing ? '<span class="badge warn">Revisar</span>' : '<span class="badge ok">OK</span>'}</div>
          </div>
          <button class="btn" type="button" onclick="location.hash='#/peticiones?petition_id=${petitionId}'">Volver</button>
        </div>
        ${invMissing ? `<div class="small" style="margin-top:8px; color:#7a5200;">${invMissing}</div>` : ''}
        <div id="factForm" style="margin-top:10px; display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:10px;"></div>
        <div class="small" id="factOut" style="margin-top:8px;"></div>
      </div>
    `;
  
    const form = document.getElementById('factForm');
    form.innerHTML = fields.map((f)=>{
      const v = getByPath(payload, f.path);
      return `<div>
        <div class="small"><strong>${esc(f.label)}</strong> ${f.required ? '<span class="badge warn">REQ</span>' : ''}</div>
        ${inputForField(f, v)}
        <div class="small">${esc(f.path)}</div>
      </div>`;
    }).join('');
  
    if (window.matchMedia('(max-width: 900px)').matches) form.style.gridTemplateColumns = '1fr';
  
    document.getElementById('btnFactSave').onclick = async () => {
      const out = document.getElementById('factOut');
      out.textContent = 'Guardando...';
      const newPayload = JSON.parse(JSON.stringify(payload || {}));
      document.querySelectorAll('#factForm [data-path]').forEach((inp)=>{
        setByPath(newPayload, inp.dataset.path, inp.value);
      });
      await api(`/admin/petitions/${petitionId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ payload: newPayload }) });
      out.textContent = 'OK.';
    };
  
    document.getElementById('btnFactEmitFactura').onclick = async () => {
      const out = document.getElementById('factOut');
      out.textContent = 'Emitiendo FACTURA...';
      await api(`/admin/petitions/${petitionId}/emit/FACTURA`, { method:'POST' });
      out.textContent = 'OK. Factura PDF publicada.';
    };
  }
  
  
  function adminWizardStepsForType(type, fields) {
    const tU = String(type||'').toUpperCase();
    const mk = (key, title, icon, filterFn) => ({ key, title, icon, fields: fields.filter(filterFn) });
  
    const servicePrefixes = ['payload.reference','payload.responsable','payload.company','payload.show'];
    const datesPrefixes = ['payload.event','payload.dates','payload.dates_text'];
    const travelPrefixes = ['payload.travel','payload.hotel','payload.acomp','payload.companions'];
    const invoicePrefix = ['payload.invoice'];
  
    if (tU === 'ALTA_FACTURA') {
      return [
        mk('servicio','Servicio','fa-solid fa-file-circle-plus',(f)=>servicePrefixes.some(p=>String(f.path||'').startsWith(p))),
        mk('fechas','Fechas','fa-solid fa-calendar-days',(f)=>datesPrefixes.some(p=>String(f.path||'').startsWith(p)) || String(f.path||'').includes('dates_text')),
        mk('viajes','Viajes','fa-solid fa-plane',(f)=>travelPrefixes.some(p=>String(f.path||'').startsWith(p))),
        mk('factura','Facturación','fa-solid fa-receipt',(f)=>invoicePrefix.some(p=>String(f.path||'').startsWith(p))),
      ].filter(s=>s.fields.length);
    }
    if (tU === 'FORMACION') {
      return [
        mk('servicio','Servicio','fa-solid fa-file-circle-plus',(f)=>servicePrefixes.some(p=>String(f.path||'').startsWith(p))),
        mk('fechas','Periodo/Fechas','fa-solid fa-calendar-days',(f)=>datesPrefixes.some(p=>String(f.path||'').startsWith(p)) || String(f.path||'').includes('start') || String(f.path||'').includes('end')),
        mk('factura','Facturación','fa-solid fa-receipt',(f)=>invoicePrefix.some(p=>String(f.path||'').startsWith(p))),
      ].filter(s=>s.fields.length);
    }
    // default: only invoice
    return [mk('factura','Facturación','fa-solid fa-receipt',(f)=>String(f.path||'').startsWith('payload.invoice'))].filter(s=>s.fields.length);
  }
  
  function isAdminEditablePath(path) {
    const p = String(path||'');
    return (
      p.startsWith('payload.invoice') ||
      p.startsWith('payload.reference') ||
      p.startsWith('payload.responsable') ||
      p.startsWith('payload.company') ||
      p.startsWith('payload.show') ||
      p.startsWith('payload.event') ||
      p.startsWith('payload.dates') ||
      p.includes('dates_text') ||
      p.startsWith('payload.travel') ||
      p.startsWith('payload.hotel')
    );
  }
  
  function inputForFieldAdmin(f, value) {
    const disabled = !isAdminEditablePath(f.path);
    const id = `aw_${String(f.path||'').replaceAll('.','_')}`;
    const common = `id="${id}" data-path="${esc(f.path)}" class="btn" style="width:100%;" ${disabled ? 'disabled' : ''}`;
    if (f.type === 'number') return `<input ${common} type="number" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder||'')}" />`;
    if (f.type === 'date') return `<input ${common} type="date" value="${esc(value ?? '')}" />`;
    if (f.type === 'select' && Array.isArray(f.options)) {
      return `<select ${common}>${f.options.map(o=>`<option value="${esc(o)}" ${String(o)===String(value)?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
    }
    return `<input ${common} type="text" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder||'')}" />`;
  }
  
  async function loadAdminWizard(petitionId) {
    const body = document.getElementById('adminWizBody');
    if (!body) return;
    if (!petitionId) { body.innerHTML = 'Seleccioná una petición.'; return; }
  
    body.innerHTML = `<div class="skeleton" style="height:22px; margin-bottom:10px;"></div><div class="skeleton" style="height:220px;"></div>`;
    const p = await api(`/admin/petitions/${petitionId}`);
    const schema = await api(`/admin/petitions/${petitionId}/schema`);
    const chk = await api(`/admin/petitions/${petitionId}/checklist`);
  
    const payload = p.payload || {};
    const steps = adminWizardStepsForType(schema.type, schema.fields||[]);
    let stepIndex = 0;
  
    const render = () => {
      const step = steps[stepIndex] || steps[0];
      const missing = (chk?.checklist?.missingFields||[]).filter(m => step.fields.some(f=>f.path===m.path));
      const rules = (chk?.checklist?.ruleErrors||[]);
      const missingDocsAll = (chk?.checklist?.missingDocs||[]);
      const stepDocs = docsForStep(schema.type, (schema.docs||[]), step.key);
      const missingDocs = missingDocsAll.filter((d)=> stepDocs.includes(d));
      body.innerHTML = `
        <div class="card" style="padding:12px;">
          <div class="card-header">
            <div>
              <div class="card-title"><i class="${step.icon}"></i> ${esc(step.title)}</div>
              <div class="card-subtitle">Edición limitada (whitelist). Workflow no se toca. ${(missing.length||missingDocs.length) ? `<span class=\"badge warn\">Faltan ${missing.length} campos · ${missingDocs.length} docs</span>` : `<span class=\"badge ok\">OK</span>`}</div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn" id="awPrev" type="button">Atrás</button>
              <button class="btn btn-primary" id="awNext" type="button">Siguiente</button>
            </div>
          </div>
  
          ${rules.length ? `<div class="small" style="margin-top:8px; color:#7a5200;">${rules.map(r=>`• ${esc(r.message)}`).join('<br/>')}</div>` : ''}
          ${missingDocs.length ? `<div class=\"small\" style=\"margin-top:8px;\"><strong>Docs faltantes (este paso)</strong><br/>${missingDocs.map(d=>`• ${esc(d)}`).join('<br/>')}<br/><button class=\"btn\" type=\"button\" onclick=\"location.hash='#/peticiones?petition_id=${petitionId}'\">Ir a Docs</button></div>` : ''}
  
          <div style="margin-top:10px; display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:10px;" id="awGrid"></div>
          <div class="small" id="awOut" style="margin-top:8px;"></div>
        </div>
      `;
  
      const grid = document.getElementById('awGrid');
      grid.innerHTML = step.fields.map((f)=>{
        const v = getByPath(payload, f.path);
        const miss = missing.find(x=>x.path===f.path);
        const editable = isAdminEditablePath(f.path);
        return `<div style="${miss ? 'outline:2px solid var(--amarillo-neon); border-radius:12px; padding:8px;' : ''}">
          <div class="small"><strong>${esc(f.label)}</strong> ${f.required ? '<span class="badge warn">REQ</span>' : ''} ${miss ? '<span class="badge error">FALTA</span>' : ''} ${editable ? '' : '<span class="badge info">READ</span>'}</div>
          ${inputForFieldAdmin(f, v)}
          <div class="small">${esc(f.path)}</div>
        </div>`;
      }).join('');
  
      if (window.matchMedia('(max-width: 900px)').matches) grid.style.gridTemplateColumns = '1fr';
  
      document.getElementById('awPrev').disabled = stepIndex === 0;
      document.getElementById('awNext').innerHTML = stepIndex === steps.length-1 ? `Finalizar <i class="fa-solid fa-flag-checkered"></i>` : `Siguiente <i class="fa-solid fa-arrow-right"></i>`;
      document.getElementById('awPrev').onclick = () => { stepIndex = Math.max(0, stepIndex-1); render(); };
      document.getElementById('awNext').onclick = () => { stepIndex = Math.min(steps.length-1, stepIndex+1); render(); };
    };
  
    render();
  
    document.getElementById('btnWizBack').onclick = () => { location.hash = `#/peticiones?petition_id=${petitionId}`; };
  
    document.getElementById('btnWizSave').onclick = async () => {
      const out = document.getElementById('awOut') || document.getElementById('adminWizBody');
      if (out) out.textContent = 'Guardando...';
      const newPayload = JSON.parse(JSON.stringify(payload||{}));
      document.querySelectorAll('#adminWizBody [data-path]').forEach((inp)=>{
        if (inp.disabled) return;
        setByPath(newPayload, inp.dataset.path, inp.value);
      });
      await api(`/admin/petitions/${petitionId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ payload: newPayload }) });
      if (out) out.textContent = 'OK.';
    };
  }
  
  
  function docsForStep(petitionType, allDocs, stepKey) {
    const tU = String(petitionType||'').toUpperCase();
    const docs = Array.isArray(allDocs) ? allDocs : [];
  
    const norm = (s) => String(s||'').toUpperCase();
  
    const isFactura = (d) => /FACTURA|INVOICE/.test(norm(d));
    const isContrato = (d) => /CONTRATO|CONTRACT/.test(norm(d));
    const isNomina = (d) => /NOMINA|PAYROLL/.test(norm(d));
    const isIdentidad = (d) => /DNI|NIE|PASAPORTE|ID/.test(norm(d));
    const isBancario = (d) => /BANCO|BANK|IBAN/.test(norm(d));
    const isAlta = (d) => /ALTA|A1|LABORAL/.test(norm(d));
    const isOtros = (d) => true;
  
    // Heurística: suficiente para UX (la fuente de verdad sigue siendo checklist/schema).
    if (tU === 'ALTA_FACTURA') {
      if (stepKey === 'factura') return docs.filter(isFactura);
      if (stepKey === 'servicio' || stepKey === 'fechas' || stepKey === 'viajes') return docs.filter((d)=>!isFactura(d));
      return docs;
    }
    if (tU === 'FORMACION') {
      if (stepKey === 'factura') return docs.filter((d)=>isFactura(d));
      if (stepKey === 'servicio' || stepKey === 'fechas') return docs.filter((d)=>isContrato(d) || isNomina(d) || isFactura(d));
      return docs;
    }
    if (tU.startsWith('ONBOARDING_')) {
      if (stepKey === 'servicio') return docs.filter((d)=>isIdentidad(d) || isBancario(d));
      return docs;
    }
    return docs.filter(isOtros);
  }
})();
