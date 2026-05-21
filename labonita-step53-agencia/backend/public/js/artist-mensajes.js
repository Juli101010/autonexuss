import { requireAuth } from './guard.js';
import { api } from './api.js';

(async () => {
  await requireAuth({ minRole: 'ARTIST' });

  const elPetitions = document.getElementById('petitions');
  const elThread = document.getElementById('thread');
  const elComposer = document.getElementById('composer');
  const elBody = document.getElementById('body');
  const elSend = document.getElementById('sendBtn');
  const elStatus = document.getElementById('status');
  const reloadBtn = document.getElementById('reloadBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  let petitions = [];
  let selectedId = null;
  
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c]));
  }
  
  function badge(status) {
    switch (status) {
      case 'BORRADOR': return '🟡 BORRADOR';
      case 'PENDIENTE_INFO': return '🟠 PENDIENTE INFO';
      case 'PENDIENTE_VALIDACION': return '🟣 PENDIENTE VALIDACIÓN';
      case 'VALIDADA': return '🟢 VALIDADA';
      case 'RECHAZADA': return '🔴 RECHAZADA';
      default: return status || '-';
    }
  }
  
  function renderPetitions() {
    if (!petitions.length) {
      elPetitions.textContent = 'No tenés peticiones.';
      return;
    }
  
    elPetitions.innerHTML = '';
    petitions.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `<div><b>#${p.id}</b> — ${esc(p.type)} — ${badge(p.status)}</div>`;
      div.onclick = () => openThread(p.id);
      elPetitions.appendChild(div);
    });
  }
  
  function renderThread(rows) {
    if (!rows.length) {
      elThread.innerHTML = '<div class="muted">Sin mensajes todavía.</div>';
      return;
    }
  
    elThread.innerHTML = rows.map((m) => {
      const who = (m.sender_role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'ARTISTA';
      return `
        <div class="msg">
          <div class="who">${who} <span class="muted">${esc(m.created_at)}</span></div>
          <div>${esc(m.body)}</div>
        </div>
      `;
    }).join('');
  }
  
  async function openThread(id) {
    selectedId = id;
    elThread.textContent = 'Cargando...';
    elComposer.style.display = 'block';
    elStatus.textContent = '';
    const rows = await api(`/petitions/${id}/messages`);
    renderThread(rows);
  }
  
  async function send() {
    if (!selectedId) return;
    elStatus.textContent = 'Enviando...';
    try {
      await api(`/petitions/${selectedId}/messages`, { method: 'POST', body: { body: elBody.value } });
      elBody.value = '';
      const rows = await api(`/petitions/${selectedId}/messages`);
      renderThread(rows);
      elStatus.textContent = 'Enviado.';
    } catch (e) {
      elStatus.textContent = e.message || 'Error';
    }
  }
  
  async function load() {
    petitions = await api('/petitions');
    renderPetitions();
  }
  
  reloadBtn.onclick = load;
  elSend.onclick = send;
  
  logoutBtn.onclick = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login.html';
  };
  
  load().catch((e) => { elPetitions.textContent = e.message || 'Error'; });
})();
