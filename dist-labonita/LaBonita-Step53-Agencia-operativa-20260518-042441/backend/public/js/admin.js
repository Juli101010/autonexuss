import { requireAuth } from './guard.js';
import { api } from './api.js';

(async () => {
  await requireAuth({ minRole: 'ADMIN' });

  const container = document.getElementById('data');
  
  function render(p) {
    return `
      <pre>${JSON.stringify(p, null, 2)}</pre>
      <button data-id="${p.id}" data-action="approve">Aprobar</button>
      <button data-id="${p.id}" data-action="reject">Rechazar</button>
      <button data-id="${p.id}" data-action="request-info">Pedir info</button>
      <hr/>
    `;
  }
  
  async function load() {
    const petitions = await api('/admin/petitions');
    container.innerHTML = '';
  
    if (!petitions || petitions.length === 0) {
      container.textContent = 'No hay peticiones para revisar';
      return;
    }
  
    petitions.forEach(p => {
      const div = document.createElement('div');
      div.innerHTML = render(p);
      container.appendChild(div);
    });
  }
  
  container.onclick = async (e) => {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    if (!id || !action) return;
  
    if (action === 'reject') {
      const reason = prompt('Motivo del rechazo (opcional):') || '';
      await api(`/admin/petitions/${id}/reject`, { method: 'PUT', body: { reason } });
      return load();
    }
  
    if (action === 'request-info') {
      const note = prompt('Qué falta / qué pedirle al artista:') || '';
      await api(`/admin/petitions/${id}/request-info`, { method: 'PUT', body: { note } });
      return load();
    }
  
    if (action === 'approve') {
      await api(`/admin/petitions/${id}/approve`, { method: 'PUT' });
      return load();
    }
  };
  
  load();
  
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try { await api('/auth/logout', { method: 'POST' }); } catch {}
      window.location.href = '/login.html';
    };
  }
})();
