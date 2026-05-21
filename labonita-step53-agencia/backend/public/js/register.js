async function registerUser() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const profileType = document.getElementById('profileType')?.value || 'ASOCIADA';
  const error = document.getElementById('error');

  error.textContent = '';

  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error('Ingresá un email válido.');
    }

    const missing = [];
    if (password.length < 8) missing.push('8 caracteres');
    if (!/[A-Z]/.test(password)) missing.push('una mayúscula');
    if (!/[a-z]/.test(password)) missing.push('una minúscula');
    if (!/\d/.test(password)) missing.push('un número');

    if (missing.length) {
      throw new Error(`La contraseña debe tener al menos ${missing.join(', ')}.`);
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, profile_type: profileType }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No pudimos crear la cuenta.');

    window.location.href = '/artist-operativo.html';
  } catch (e) {
    error.textContent = e.message;
  }
}

window.registerUser = registerUser;
