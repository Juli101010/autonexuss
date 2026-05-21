import { requireAuth } from './guard.js';
import { api } from './api.js';

(async () => {
  await requireAuth({ minRole: null });

  function v(id) {
    return document.getElementById(id);
  }
  
  function setStatus(msg, ok = false) {
    const el = v('status');
    el.style.color = ok ? 'green' : '#b00';
    el.textContent = msg || '';
  }
  
  async function load() {
    const { profile, fiscal } = await api('/profile/me');
    const p = profile || {};
    const f = fiscal || {};
  
    v('artist_name').value = p.artist_name || '';
    v('legal_name').value = p.legal_name || '';
    v('phone').value = p.phone || '';
    v('address_line1').value = p.address_line1 || '';
    v('address_line2').value = p.address_line2 || '';
    v('city').value = p.city || '';
    v('region').value = p.region || '';
    v('postal_code').value = p.postal_code || '';
    v('country').value = p.country || '';
  
    v('tax_id').value = f.tax_id || '';
    v('vat_number').value = f.vat_number || '';
    v('residence_country').value = f.residence_country || '';
    v('irpf_rate').value = String(f.irpf_rate ?? 0.02);
    v('bank_iban').value = f.bank_iban || '';
    v('bank_bic').value = f.bank_bic || '';
  }
  
  function readPayload() {
    const profile = {
      artist_name: v('artist_name').value.trim(),
      legal_name: v('legal_name').value.trim(),
      phone: v('phone').value.trim(),
      address_line1: v('address_line1').value.trim(),
      address_line2: v('address_line2').value.trim(),
      city: v('city').value.trim(),
      region: v('region').value.trim(),
      postal_code: v('postal_code').value.trim(),
      country: v('country').value.trim(),
    };
  
    const fiscal = {
      tax_id: v('tax_id').value.trim(),
      vat_number: v('vat_number').value.trim(),
      residence_country: v('residence_country').value.trim(),
      irpf_rate: Number(v('irpf_rate').value || '0.02'),
      bank_iban: v('bank_iban').value.trim(),
      bank_bic: v('bank_bic').value.trim(),
    };
  
    return { profile, fiscal };
  }
  
  async function save() {
    setStatus('Guardando...');
    try {
      await api('/profile/me', { method: 'PUT', body: readPayload() });
      await load();
      setStatus('Guardado.', true);
    } catch (err) {
      setStatus(err.message || 'Error');
    }
  }
  
  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login.html';
  }
  
  v('saveBtn').addEventListener('click', save);
  v('logoutBtn').addEventListener('click', logout);
  
  load().catch((e) => setStatus(e.message || 'Error cargando perfil'));
})();
