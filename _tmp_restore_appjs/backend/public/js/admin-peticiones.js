import { api } from './api.js';

const elList = document.getElementById('list');
const elDetail = document.getElementById('detail');
const reloadBtn = document.getElementById('reloadBtn');
const logoutBtn = document.getElementById('logoutBtn');

let petitions = [];

function badge(status) {
  switch (status) {
    case 'BORRADOR': return '🟡 BORRADOR';
    case 'PENDIENTE_VALIDACION': return '🟣 ESPERANDO VALIDACIÓN';
    case 'PENDIENTE_INFO': return '🟠 PENDIENTE INFO';
    case 'ENVIADA': return '🔵 ENVIADA';
    case 'APROBADA': return '🟢 APROBADA';
    case 'LABORAL_EN_CURSO': return '🔧 LABORAL EN CURSO';
    case 'FACTURACION_EN_CURSO': return '🧾 FACTURACIÓN EN CURSO';
    case 'FACTURA_EMITIDA': return '📄 FACTURA EMITIDA';
    case 'COBRO_PENDIENTE': return '💸 COBRO PENDIENTE';
    case 'COBRO_PARCIAL': return '💸 COBRO PARCIAL';
    case 'COBRADA': return '✅ COBRADA';
    case 'NOMINA_PUBLICADA': return '🧮 NÓMINA PUBLICADA';
    case 'PAGADA': return '🏦 PAGADA';
    case 'CERRADA_CERO': return '🎯 CERRADA (CERO)';
    case 'RECHAZADA': return '🔴 RECHAZADA';
    default: return status || '-';
  }
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

function renderList() {
  if (!petitions.length) {
    elList.textContent = 'No hay peticiones ENVIADAS / PENDIENTE_INFO';
    return;
  }

  elList.innerHTML = '';
  petitions.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    const email = p.user_email || `(user_id: ${p.user_id})`;
    div.innerHTML = `
      <div><b>#${p.id}</b> — <span class="badge">${badge(p.status)}</span></div>
      <div class="muted">${esc(p.type)} — ${esc(email)}</div>
      <div class="muted">${esc(p.created_at || '')}</div>
      ${p.summary && p.summary.total_missing ? `<div class="err">Faltan: ${p.summary.total_missing} (${p.summary_preview || ''})</div>` : ''}
    `;
    div.onclick = () => openDetail(p.id);
    elList.appendChild(div);
  });
}

function renderChecklist(checklist) {
  const parts = [];

  if (checklist.ruleErrors?.length) {
    parts.push('<h3 class="err">Reglas</h3><ul>' + checklist.ruleErrors.map((r) => `<li>${esc(r.message || r.code)}</li>`).join('') + '</ul>');
  }

  if (checklist.missingFields?.length) {
    parts.push('<h3 class="err">Campos faltantes</h3><ul>' + checklist.missingFields.map((f) => `<li id="mf_${esc(f.path).replace(/[^a-zA-Z0-9_]/g,'_')}">${esc(f.label)} <span class="muted">(<code>${esc(f.path)}</code>)</span> <a class="muted" href="/admin-peticiones.html?petition_id=${petition.id}&focus_field=${encodeURIComponent(f.path)}">ver</a></li>`).join('') + '</ul>');
  }

  if (checklist.missingDocs?.length) {
    parts.push('<h3 class="err">Docs faltantes</h3><ul>' + checklist.missingDocs.map((d) => `<li>${esc(d.doc_type)}</li>`).join('') + '</ul>');
  }

  if (!parts.length) parts.push('<div class="ok"><b>✅ Checklist OK</b></div>');

  return parts.join('');
}

function renderDocs(docs) {
  if (!docs || docs.length === 0) return '<div class="muted">Sin documentos adjuntos.</div>';

  return '<ul>' + docs.map((d) => {
    const href = `/api/documents/${d.id}/download`;
    const tag = d.is_official ? ' <span class="muted">[OFICIAL]</span>' : '';
    return `<li><a href="${href}" target="_blank">${esc(d.doc_type)} — ${esc(d.original_name)}</a>${tag}</li>`;
  }).join('') + '</ul>';
}

function renderThread(rows) {
  if (!rows || rows.length === 0) return '<div class="muted">Sin mensajes todavía.</div>';
  return rows.map((m) => {
    const who = (m.sender_role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'ARTISTA';
    return `
      <div class="msg">
        <div class="who">${who} <span class="muted">${esc(m.created_at)}</span></div>
        <div>${esc(m.body)}</div>
      </div>
    `;
  }).join('');
}

async function openDetail(id) {
  elDetail.innerHTML = 'Cargando...';

  const [{ petition, checklist }, docs, thread] = await Promise.all([
    api(`/admin/petitions/${id}/checklist`),
    api(`/admin/petitions/${id}/documents`),
    api(`/petitions/${id}/messages`)
  ]);

  elDetail.innerHTML = `
    <div>
      <div><b>Petición #${petition.id}</b> — <span class="badge">${badge(petition.status)}</span></div>
      <div class="muted">${esc(petition.type)} — ${esc(petition.user_email || '')}</div>
      <div class="muted">Creada: ${esc(petition.created_at || '')}</div>
      <div class="muted">Actualizada: ${esc(petition.updated_at || '')}</div>
      <div class="muted">Último recordatorio: ${esc(petition.last_reminder_at || '-')} | Enviados: ${petition.reminder_count || 0}</div>
    </div>

    <hr/>

    <h3>Checklist</h3>
    ${renderChecklist(checklist)}

    <hr/>

    <h3>Documentos</h3>
    ${renderDocs(docs)}

    <hr/>

    <h3>Mensajes</h3>
    <div id="threadBox">${renderThread(thread)}</div>

    <div style="margin-top:10px;">
      <textarea id="msgBody" placeholder="Responder al artista..."></textarea>
      <button id="btnSendMsg">Enviar mensaje</button>
      <span id="msgStatus" class="muted"></span>
    </div>

    <hr/>

    <h3>Acciones</h3>
    <div style="margin-bottom:10px;">
      <a id="btnTimeline" href="#" class="muted">Ver timeline (JSON)</a>
    </div>

    <h3>Workflow</h3>
    <div id="workflowActions" class="muted">(acciones según estado)</div>

    <h3>Revisión</h3>
    <div>
      <label class="muted">Pedir info (nota)</label>
      <textarea id="noteBox" placeholder="Qué falta...">${esc(petition.admin_note || '')}</textarea>
      <button id="btnRequestInfo">Pedir info</button>
    </div>

    <div style="margin-top:10px;">
      <label class="muted">Rechazar (motivo)</label>
      <textarea id="rejectBox" placeholder="Motivo (opcional)">${esc(petition.rejection_reason || '')}</textarea>
      <button id="btnReject">Rechazar</button>
    </div>

    <div style="margin-top:10px;">
      <button id="btnApprove">Aprobar</button>
    </div>
  `;


    <div id="convertBudgetWrap" style="margin-top:10px; display:none;">
      <button id="btnEmitPresupuesto">Emitir PDF Presupuesto (oficial)</button>
      <button id="btnConvertBudget">Convertir Presupuesto → Alta+Factura (nuevo borrador)</button>
      <p id="convertBudgetResult"></p>
    </div>

  // Publicar documento oficial
  document.getElementById('btnPublishDoc').onclick = async () => {
    const status = document.getElementById('pubStatus');
    const file = document.getElementById('pubFile').files?.[0];
    const doc_type = document.getElementById('pubDocType').value;
    if (!file) { status.textContent = 'Seleccioná un archivo.'; return; }
    status.textContent = 'Subiendo...';
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', doc_type);
      await api(`/admin/petitions/${id}/documents`, { method: 'POST', body: fd, isFormData: true });
      status.textContent = 'Publicado.';
      const d = await api(`/admin/petitions/${id}/documents`);
      // Re-render documentos
      elDetail.querySelector('h3:nth-of-type(2)').nextElementSibling?.remove?.();
      // simpler: reopen detail
      await openDetail(id);
    } catch (e) {
      status.textContent = e.message || 'Error';
    }
  };

document.getElementById('btnSendMsg').onclick = async () => {
    const body = document.getElementById('msgBody').value;
    const status = document.getElementById('msgStatus');
    status.textContent = 'Enviando...';
    try {
      await api(`/petitions/${id}/messages`, { method: 'POST', body: { body } });
      document.getElementById('msgBody').value = '';
      const t = await api(`/petitions/${id}/messages`);
      document.getElementById('threadBox').innerHTML = renderThread(t);
      status.textContent = 'Enviado.';
    } catch (e) {
      status.textContent = e.message || 'Error';
    }
  };

  document.getElementById('btnRequestInfo').onclick = async () => {
    const note = document.getElementById('noteBox').value || '';
    await api(`/admin/petitions/${id}/request-info`, { method: 'PUT', body: { note } });
    await load();
    await openDetail(id);
  };

  document.getElementById('btnReject').onclick = async () => {
    const reason = document.getElementById('rejectBox').value || '';
    await api(`/admin/petitions/${id}/reject`, { method: 'PUT', body: { reason } });
    await load();
    elDetail.innerHTML = '<div class="ok">Rechazada.</div>';
  };


  // Convert Presupuesto -> Alta
  const convertWrap = document.getElementById('convertBudgetWrap');
  if (convertWrap) {
    if (petition.type === 'PRESUPUESTO') {
      convertWrap.style.display = '';
      document.getElementById('btnEmitPresupuesto').onclick = async () => {
        const out = document.getElementById('convertBudgetResult');
        out.textContent = 'Emitiendo PDF...';
        try {
          await api(`/admin/petitions/${id}/emit-presupuesto`, { method: 'POST' });
          out.textContent = 'OK. PDF publicado como documento oficial (PRESUPUESTO_PDF)';
          await loadDetail();
        } catch (err) {
          out.textContent = `ERROR: ${err.message}`;
        }
      };

      document.getElementById('btnConvertBudget').onclick = async () => {
        const out = document.getElementById('convertBudgetResult');
        out.textContent = 'Convirtiendo...';
        try {
          const resp = await api(`/admin/petitions/${id}/convert-budget-to-alta`, { method: 'POST' });
          out.textContent = `OK. Nuevo borrador ALTA_FACTURA: #${resp.new_petition_id}`;
        } catch (err) {
          out.textContent = `ERROR: ${err.message}`;
        }
      };
    } else {
      convertWrap.style.display = 'none';
    }
  }

  // Timeline
  document.getElementById('btnTimeline').onclick = (e) => {
    e.preventDefault();
    window.open(`/api/admin/petitions/${id}/timeline`, '_blank');
  };

  // Workflow buttons
  const wf = document.getElementById('workflowActions');
  const statusNow = petition.status;

  const transitions = {
    APROBADA: [{ to: 'LABORAL_EN_CURSO', label: '➡️ Pasar a LABORAL' }, { to: 'FACTURACION_EN_CURSO', label: '➡️ Pasar a FACTURACIÓN' }],
    LABORAL_EN_CURSO: [{ to: 'FACTURA_EMITIDA', label: '➡️ Marcar FACTURA EMITIDA' }, { to: 'NOMINA_PUBLICADA', label: '➡️ Publicar NÓMINA' }],
    FACTURACION_EN_CURSO: [{ to: 'FACTURA_EMITIDA', label: '➡️ Marcar FACTURA EMITIDA' }],
    FACTURA_EMITIDA: [{ to: 'COBRO_PENDIENTE', label: '➡️ Marcar COBRO PENDIENTE' }, { to: 'NOMINA_PUBLICADA', label: '➡️ Publicar NÓMINA' }],
    COBRO_PENDIENTE: [{ to: 'COBRO_PARCIAL', label: '➡️ Marcar COBRO PARCIAL' }, { to: 'COBRADA', label: '➡️ Marcar COBRADA' }],
    COBRO_PARCIAL: [{ to: 'COBRADA', label: '➡️ Marcar COBRADA' }],
    COBRADA: [{ to: 'NOMINA_PUBLICADA', label: '➡️ Publicar NÓMINA' }],
    NOMINA_PUBLICADA: [{ to: 'PAGADA', label: '➡️ Marcar PAGADA' }],
    PAGADA: [{ to: 'CERRADA_CERO', label: '➡️ Cerrar (CERO)' }]
  };

  const actions = transitions[statusNow] || [];
  wf.innerHTML = actions.length ? actions.map((a) => `<button class="btnWf" data-to="${a.to}">${a.label}</button>`).join(' ') : '<span class="muted">Sin acciones.</span>';

  for (const btn of Array.from(document.querySelectorAll('.btnWf'))) {
    btn.onclick = async () => {
      const to = btn.getAttribute('data-to');
      await api(`/admin/petitions/${id}/status`, { method: 'PUT', body: { to_status: to } });
      await loadPetitions();
      showDetail(id);
    };
  }
document.getElementById('btnApprove').onclick = async () => {
    await api(`/admin/petitions/${id}/approve`, { method: 'PUT' });
    await load();
    elDetail.innerHTML = '<div class="ok">Aprobada.</div>';
  };
  document.getElementById('btnRemind').onclick = async () => {
    const st = document.getElementById('remindStatus');
    st.textContent = 'Enviando...';
    try {
      await api(`/admin/petitions/${id}/remind`, { method: 'POST' });
      st.textContent = 'Recordatorio enviado.';
      await openDetail(id);
    } catch (e) {
      st.textContent = e.message || 'Error';
    }
  };

}

async function load() {
  petitions = await api('/admin/petitions');
  renderList();
}

reloadBtn.onclick = load;

logoutBtn.onclick = async () => {
  try { await api('/auth/logout', { method: 'POST' }); } catch {}
  window.location.href = '/login.html';
};

load().catch((e) => { elList.textContent = e.message || 'Error'; });


function formatCloseError(errBody) {
  const s = errBody && errBody.summary ? errBody.summary : null;
  if (!s) return null;
  const lines = [
    'No se puede cerrar: el balance no es cero.',
    '',
    `Cobros (IN): €${Number(s.receipts_total || 0).toFixed(2)}`,
    `Pagos (OUT): €${Number(s.payouts_total || 0).toFixed(2)}`,
    `Gastos: €${Number(s.expenses_total || 0).toFixed(2)}`,
    `Comisiones: €${Number(s.commissions_total || 0).toFixed(2)}`,
    '-------------------------',
    `Balance a cero: €${Number(s.balance_to_zero || 0).toFixed(2)}`,
    '',
    'Tip: revisa Ledger/Comisiones/Gastos en Controles para ajustar.',
  ];
  return lines.join('\n');
}


function scrollToDocsAnchor() {
  if (window.location.hash !== '#docs') return;
  const el = document.getElementById('docsSection') || document.querySelector('h3') || null;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
