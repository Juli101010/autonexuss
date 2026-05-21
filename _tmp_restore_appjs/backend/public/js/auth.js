async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const error = document.getElementById('error');

  error.textContent = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login error');

    const role = String(data.user.role || '').toUpperCase();
    window.location.href = '/app.html';
  } catch (e) {
    error.textContent = e.message;
  }
}

window.login = login;
