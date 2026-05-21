import { api } from './api.js';

const sociosEl = document.getElementById('socios');
const noSociosEl = document.getElementById('nosocios');
const statusEl = document.getElementById('status');

function setStatus(msg = '', kind = 'ok') {
  statusEl.className = msg ? kind : '';
  statusEl.textContent = msg;
}

async function load() {
  setStatus('');
  try {
    const [socios, noSocios] = await Promise.all([
      api('/admin/socios'),
      api('/admin/no-socios')
    ]);

    sociosEl.innerHTML = '';
    noSociosEl.innerHTML = '';

    socios.forEach((s) => {
      const d = document.createElement('div');
      d.innerHTML = `
        <pre>${JSON.stringify(s, null, 2)}</pre>
        <button data-id="${s.id}">Desactivar</button>
        <hr/>
      `;
      sociosEl.appendChild(d);
    });

    noSocios.forEach((n) => {
      const d = document.createElement('div');
      d.innerHTML = `<pre>${JSON.stringify(n, null, 2)}</pre><hr/>`;
      noSociosEl.appendChild(d);
    });
  } catch (err) {
    setStatus(`Error cargando datos: ${err.message}`, 'err');
  }
}

sociosEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;

  const id = btn.dataset.id;
  if (!confirm('¿Desactivar este socio?')) return;

  btn.disabled = true;
  try {
    await api(`/admin/socios/${id}/deactivate`, { method: 'PUT' });
    setStatus('Socio desactivado.', 'ok');
    await load();
  } catch (err) {
    setStatus(`No se pudo desactivar: ${err.message}`, 'err');
  } finally {
    btn.disabled = false;
  }
});

load();


// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login.html';
  };
}
