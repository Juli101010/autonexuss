async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { credentials: 'include', ...opts });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) throw new Error(typeof body === 'string' ? body : (body.error || 'Request failed'));
  return body;
}

function download(endpoint, format) {
  const url = `${endpoint}?download=1&format=${encodeURIComponent(format)}`;
  window.open(url, '_blank');
}

document.querySelectorAll('button[data-endpoint]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const format = document.getElementById('formatSel').value;
    download(btn.dataset.endpoint, format);
  });
});

document.getElementById('commissionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    petition_id: Number(fd.get('petition_id')),
    month: String(fd.get('month')),
    label: String(fd.get('label')),
    amount_eur: Number(fd.get('amount_eur')),
  };
  const out = document.getElementById('result');
  out.textContent = 'Guardando...';
  try {
    await apiFetch('/api/admin/controls/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    out.textContent = 'OK';
    e.target.reset();
  } catch (err) {
    out.textContent = `ERROR: ${err.message}`;
  }
});


async function refreshLedger() {
  const tbody = document.getElementById('ledgerTable');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';
  try {
    const { petitionId } = getControlsParams();
  const url = petitionId ? `/api/admin/ledger?petition_id=${encodeURIComponent(petitionId)}` : '/api/admin/ledger';
  const data = await apiFetch(url);
    tbody.innerHTML = '';
    (data.rows || []).slice(0, 50).forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.petition_id}</td>
        <td>${r.direction}</td>
        <td>${r.category}</td>
        <td>${Number(r.amount_eur).toFixed(2)}</td>
        <td>${r.occurred_at}</td>
        <td>${(r.note || '').replaceAll('<','&lt;')}</td>
        <td><button data-del="${r.id}">Eliminar</button></td>
      `;
      tr.querySelector('button[data-del]').addEventListener('click', async () => {
        if (!confirm('Eliminar movimiento?')) return;
        await apiFetch(`/api/admin/ledger/${r.id}`, { method: 'DELETE' });
        refreshLedger();
      });
      tbody.appendChild(tr);
    });
    if ((data.rows || []).length === 0) tbody.innerHTML = '<tr><td colspan="8">Sin movimientos</td></tr>';
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8">ERROR: ${err.message}</td></tr>`;
  }
}

const ledgerForm = document.getElementById('ledgerForm');
if (ledgerForm) {
  ledgerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      petition_id: Number(fd.get('petition_id')),
      direction: String(fd.get('direction')),
      category: String(fd.get('category')),
      amount_eur: Number(fd.get('amount_eur')),
      occurred_at: String(fd.get('occurred_at')),
      note: String(fd.get('note') || ''),
    };
    const out = document.getElementById('ledgerResult');
    out.textContent = 'Guardando...';
    try {
      await apiFetch('/api/admin/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      out.textContent = 'OK';
      e.target.reset();
      refreshLedger();
    } catch (err) {
      out.textContent = `ERROR: ${err.message}`;
    }
  });

  const refreshBtn = document.getElementById('refreshLedgerBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshLedger);
  refreshLedger();
}


async function refreshPayoutProposals() {
  const tbody = document.getElementById('payoutProposalsTable');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
  try {
    const data = await apiFetch('/api/admin/payout-proposals?status=PENDING');
    tbody.innerHTML = '';
    (data.rows || []).forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.petition_id}</td>
        <td>${r.occurred_at}</td>
        <td>${Number(r.proposed_amount_eur).toFixed(2)}</td>
        <td>${r.status}</td>
        <td><button data-appr="${r.id}">Aprobar</button></td>
        <td><button data-rej="${r.id}">Rechazar</button></td>
      `;
      tr.querySelector('button[data-appr]').addEventListener('click', async () => {
        if (!confirm('Aprobar pago? Esto creará un OUT/PAGO en el ledger.')) return;
        await apiFetch(`/api/admin/payout-proposals/${r.id}/approve`, { method: 'POST' });
        refreshPayoutProposals();
        refreshLedger();
      });
      tr.querySelector('button[data-rej]').addEventListener('click', async () => {
        if (!confirm('Rechazar propuesta?')) return;
        await apiFetch(`/api/admin/payout-proposals/${r.id}/reject`, { method: 'POST' });
        refreshPayoutProposals();
      });
      tbody.appendChild(tr);
    });
    if ((data.rows || []).length === 0) tbody.innerHTML = '<tr><td colspan="7">Sin propuestas pendientes</td></tr>';
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">ERROR: ${err.message}</td></tr>`;
  }
}

const refreshPayoutBtn = document.getElementById('refreshPayoutProposalsBtn');
if (refreshPayoutBtn) refreshPayoutBtn.addEventListener('click', refreshPayoutProposals);
refreshPayoutProposals();


function getControlsParams() {
  try {
    const p = new URLSearchParams(window.location.search || '');
    return {
      petitionId: p.get('petition_id') ? Number(p.get('petition_id')) : null,
      focus: p.get('focus') || null,
    };
  } catch {
    return { petitionId: null, focus: null };
  }
}


function focusControlsFromUrl() {
  const { focus } = getControlsParams();
  if (!focus) return;
  const map = {
    'ledger': 'ledgerSection',
    'control-total': 'controlTotalSection',
  };
  const id = map[focus];
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

focusControlsFromUrl();
