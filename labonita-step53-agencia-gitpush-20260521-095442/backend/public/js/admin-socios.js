import { api } from './api.js';

const sociosEl = document.getElementById('socios');
const noSociosEl = document.getElementById('nosocios');
const statusEl = document.getElementById('status');

function setStatus(msg = '', kind = 'ok') {
  statusEl.className = msg ? `status ${kind}` : 'status';
  statusEl.textContent = msg;
}

function renderSocioCard(s) {
  const d = document.createElement('article');
  d.className = 'row';
  d.innerHTML = `
    <div class="meta">
      <div class="title">${s.artist_name || 'Sin nombre artistico'}</div>
      <div class="small">${s.email || 'Sin email'}</div>
      <div class="small">ID asociada: ${s.id} · ID usuario: ${s.user_id || '-'}</div>
      <div class="small">Estado: ${Number(s.active) === 1 ? 'Activa' : 'Inactiva'}</div>
    </div>
    <div>
      <button data-id="${s.id}">Desactivar</button>
    </div>
  `;
  return d;
}

function renderNoSocioCard(n) {
  const d = document.createElement('article');
  d.className = 'row';
  d.innerHTML = `
    <div class="meta">
      <div class="title">${n.email || 'Sin email'}</div>
      <div class="small">ID usuario: ${n.id}</div>
      <div class="small">Rol: ${n.role || 'ARTIST'}</div>
    </div>
  `;
  return d;
}

async function load() {
  setStatus('');
  try {
    const [socios, noSocios] = await Promise.all([
      api('/admin/socios'),
      api('/admin/no-socios'),
    ]);

    sociosEl.innerHTML = '';
    noSociosEl.innerHTML = '';

    socios.forEach((s) => sociosEl.appendChild(renderSocioCard(s)));
    noSocios.forEach((n) => noSociosEl.appendChild(renderNoSocioCard(n)));
  } catch (err) {
    setStatus(`Error cargando datos: ${err.message}`, 'err');
  }
}

sociosEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;

  const id = btn.dataset.id;
  if (!confirm('¿Desactivar esta asociada?')) return;

  btn.disabled = true;
  try {
    await api(`/admin/socios/${id}/deactivate`, { method: 'PUT' });
    setStatus('Asociada desactivada.', 'ok');
    await load();
  } catch (err) {
    setStatus(`No se pudo desactivar: ${err.message}`, 'err');
  } finally {
    btn.disabled = false;
  }
});

load();
