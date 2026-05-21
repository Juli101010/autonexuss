/**
 * Minimal fetch wrapper for the demo UI.
 * Uses HttpOnly cookie session (credentials: include).
 */
export async function api(path, options = {}) {
  const isFormData = Boolean(options.isFormData);

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
    body: options.body
      ? (isFormData ? options.body : JSON.stringify(options.body))
      : undefined,
  });

  const text = await res.text();
  const data = text ? (() => {
    try { return JSON.parse(text); } catch { return text; }
  })() : null;

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

