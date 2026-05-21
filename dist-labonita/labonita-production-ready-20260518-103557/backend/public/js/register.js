async function registerUser() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const error = document.getElementById('error');

  error.textContent = '';

  try {
    if (!email || !password || password.length < 8) {
      throw new Error('Usa un email valido y una clave de al menos 8 caracteres.');
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registro error');

    window.location.href = '/app.html#/peticiones';
  } catch (e) {
    error.textContent = e.message;
  }
}

window.registerUser = registerUser;
