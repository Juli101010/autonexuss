import { api } from './api.js';
let aTab = 'peticiones';
let aNotifs = [];
let aAvisos = [];
let aInboxSubTab = 'notifs';
let aSelectedAviso = null;
let aThreads = [];
let aSelectedNotif = null;
let aSelectedThread = null;

function showTab(tab) {
  aTab = tab;
  document.getElementById('panelArtistPeticiones').style.display = tab === 'peticiones' ? '' : 'none';
  document.getElementById('panelArtistInbox').style.display = tab === 'inbox' ? '' : 'none';
  document.getElementById('panelArtistMessages').style.display = tab === 'mensajes' ? '' : 'none';
}

async function whoAmI() {
  try {
    const me = await api('/me');
    document.getElementById('artistWho').textContent = `${me.role} · ${me.email || ('#' + me.id)}`;
  } catch {
    document.getElementById('artistWho').textContent = 'No autenticado';
  }
}

function notifPass(n) {
  const f = document.getElementById('aNotifUnread').value;
  if (f === 'unread' && n.read) return false;
  return true;
}

function parseNotifMeta(n) {
  try { return n.meta_json ? JSON.parse(n.meta_json) : {}; } catch { return {}; }
}

function renderNotifs() {
  const el = document.getElementById('aInboxList');
  const rows = aNotifs.filter(notifPass).slice(0, 200);
  el.innerHTML = rows.length ? rows.map((n) => {
    const unread = n.read ? '' : '🔴 ';
    const sel = aSelectedNotif === n.id ? 'style="background:rgba(253,250,0,.20); padding:8px; border-radius:12px;"' : '';
    return `<div ${sel} style="padding:8px; border-bottom:1px solid rgba(0,0,0,.06); cursor:pointer;" data-n="${n.id}">
      <div><strong>${unread}${(n.message || '').slice(0, 90)}</strong></div>
      <div class="small">${n.notif_type || 'GENERIC'} · ${n.severity || 'INFO'} · ${n.created_at || ''}</div>
    </div>`;
  }).join('') : '<div class="small">Sin notificaciones.</div>';

  el.querySelectorAll('[data-n]').forEach((d) => {
    d.onclick = () => { aSelectedNotif = Number(d.dataset.n); renderNotifs(); _renderNotifDetail(); };
  });
}

async function _renderNotifDetail() {
  const el = document.getElementById('aInboxDetail');
  const n = aNotifs.find((x) => x.id === aSelectedNotif);
  if (!n) { el.textContent = 'Seleccioná un item.'; return; }
  const meta = parseNotifMeta(n);
  el.innerHTML = `
    <h3 style="margin:0 0 8px 0;">Notificación</h3>
    <div class="small">${n.created_at || ''}</div>
    <p>${String(n.message||'').replace(/</g,'&lt;')}</p>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button class="btn" type="button" id="btnNRead">${n.read ? 'Leída' : 'Marcar leída'}</button>
    </div>
  `;
  document.getElementById('btnNRead').onclick = async () => {
    await api(`/notifications/${n.id}/read`, { method: 'PUT' });
    await loadNotifs();
  };

  // Auto-open petition thread if meta has petition_id
  if (meta.petition_id) {
    el.innerHTML += `<div class="small">Relacionado a petición #${meta.petition_id}. Mirá la pestaña Mensajes.</div>`;
  }
}

async function loadAvisos() {
  try {
    const a = await api('/announcements');
    aAvisos = a.rows || [];
  } catch { aAvisos = []; }
}

async function loadNotifs() {
  const n = await api('/notifications');
  aNotifs = Array.isArray(n) ? n : (n.rows || []);
  await loadAvisos();
  renderInboxList();
  await renderInboxDetail();
}

function renderThreads() {
  const el = document.getElementById('aThreads');
  const rows = aThreads.slice(0, 200);
  el.innerHTML = rows.length ? rows.map((t) => {
    const unread = Number(t.unread_count || 0) ? `🔴 ${t.unread_count} ` : '';
    const sel = aSelectedThread === t.petition_id ? 'style="background:rgba(253,250,0,.20); padding:8px; border-radius:12px;"' : '';
    return `<div ${sel} style="padding:8px; border-bottom:1px solid rgba(0,0,0,.06); cursor:pointer;" data-t="${t.petition_id}">
      <div><strong>${unread}Petición #${t.petition_id} · ${t.type}</strong></div>
      <div class="small">${(t.last_body || '').slice(0, 120)}</div>
      <div class="small">${t.status} · ${t.last_at || ''}</div>
    </div>`;
  }).join('') : '<div class="small">Sin threads.</div>';

  el.querySelectorAll('[data-t]').forEach((d) => {
    d.onclick = () => { aSelectedThread = Number(d.dataset.t); renderThreads(); loadThread(aSelectedThread); };
  });
}

async function loadThread(petitionId) {
  const el = document.getElementById('aThreadDetail');
  el.innerHTML = `<div class="small">Cargando thread #${petitionId}...</div>`;
  const data = await api(`/petitions/${petitionId}/messages`);
  try { await api(`/petitions/${petitionId}/messages/read`, { method: 'PUT' }); } catch {}
  const rows = data.rows || [];
  el.innerHTML = `
    <h3 style="margin:0 0 8px 0;">Thread — Petición #${petitionId}</h3>
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
      <input id="aMsgBody" class="btn" placeholder="Escribir..." style="flex:1; min-width:260px;" />
      <button id="btnASend" class="btn" type="button">Enviar</button>
    </div>
    <div>
      ${rows.map((m) => `<div style="padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06);">
        <strong>${m.kind === 'AVISO' ? '🔔 AVISO' : '💬'}</strong> · ${m.from_role}#${m.from_user_id} · ${m.created_at}<br/>
        ${String(m.body).replace(/</g,'&lt;')}
      </div>`).join('') || '<div class="small">Sin mensajes.</div>'}
    </div>
  `;
  document.getElementById('btnASend').onclick = async () => {
    const body = (document.getElementById('aMsgBody').value || '').trim();
    if (!body) return;
    await api(`/petitions/${petitionId}/messages`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ body, kind: 'CHAT' }) });
    document.getElementById('aMsgBody').value = '';
    await loadThreads();
    await loadThread(petitionId);
  };
}

async function loadThreads() {
  const t = await api('/messages/threads');
  aThreads = t.rows || [];
  renderThreads();
  if (aSelectedThread) await loadThread(aSelectedThread);
}

function wireArtistUI() {
  document.querySelectorAll('[data-atab]').forEach((b) => {
    b.onclick = () => {
      showTab(b.dataset.atab);
      if (b.dataset.atab === 'inbox') { wireInboxSubTabs(); loadNotifs(); }
      if (b.dataset.atab === 'mensajes') loadThreads();
    };
  });

  document.getElementById('btnAInboxRefresh').onclick = () => loadNotifs();
  document.getElementById('btnAThreadsRefresh').onclick = () => loadThreads();

  document.getElementById('btnAMarkAllRead').onclick = async () => {
    for (const n of aNotifs) {
      if (!n.read) { try { await api(`/notifications/${n.id}/read`, { method: 'PUT' }); } catch {} }
    }
    await loadNotifs();
  };
}

(async function boot() {
  await whoAmI();
  wireArtistUI();
  showTab('peticiones');
})();


function setInboxSubTab(tab) {
  aInboxSubTab = tab;
  aSelectedNotif = null;
  aSelectedAviso = null;
  renderInboxList();
  renderInboxDetail();
}

function renderAvisos() {
  const el = document.getElementById('aInboxList');
  const rows = aAvisos.slice(0, 200);
  el.innerHTML = rows.length ? rows.map((a) => {
    const sel = aSelectedAviso === a.id ? 'style="background:rgba(253,250,0,.20); padding:8px; border-radius:12px;"' : '';
    return `<div ${sel} style="padding:8px; border-bottom:1px solid rgba(0,0,0,.06); cursor:pointer;" data-a="${a.id}">
      <div><strong>📣 ${(a.title || '').slice(0, 90)}</strong></div>
      <div class="small">${a.scope}${a.scope_value ? ` · ${a.scope_value}` : ''} · ${a.created_at || ''}</div>
    </div>`;
  }).join('') : '<div class="small">Sin avisos.</div>';

  el.querySelectorAll('[data-a]').forEach((d) => {
    d.onclick = () => { aSelectedAviso = Number(d.dataset.a); renderAvisos(); renderInboxDetail(); };
  });
}

function renderInboxList() {
  if (aInboxSubTab === 'avisos') return renderAvisos();
  return renderNotifs();
}

async function renderInboxDetail() {
  const el = document.getElementById('aInboxDetail');

  if (aInboxSubTab === 'avisos') {
    const a = aAvisos.find((x) => x.id === aSelectedAviso);
    if (!a) { el.textContent = 'Seleccioná un item.'; return; }
    el.innerHTML = `
      <h3 style="margin:0 0 8px 0;">📣 ${String(a.title||'').replace(/</g,'&lt;')}</h3>
      <div class="small">${a.created_at || ''} · ${a.scope}${a.scope_value ? ` · ${a.scope_value}` : ''}</div>
      <p>${String(a.body||'').replace(/</g,'&lt;')}</p>
    `;
    return;
  }

  return _renderNotifDetail();
}


function wireInboxSubTabs() {
  document.querySelectorAll('[data-ainboxtab]').forEach((b) => {
    if (b.dataset.wired) return;
    b.dataset.wired = '1';
    b.onclick = () => setInboxSubTab(b.dataset.ainboxtab);
  });
}
