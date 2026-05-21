async function registerUser() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const error = document.getElementById('error');

  error.textContent = '';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registro error');

    window.location.href = '/artist.html';
  } catch (e) {
    error.textContent = e.message;
  }
}

window.registerUser = registerUser;
