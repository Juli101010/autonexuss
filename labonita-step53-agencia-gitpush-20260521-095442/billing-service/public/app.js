export function token() { return localStorage.getItem("billing_token") || ""; }
export function setToken(t) { localStorage.setItem("billing_token", t); }
export function clearToken() { localStorage.removeItem("billing_token"); }

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    let msg = "Error";
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
