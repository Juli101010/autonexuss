import { api } from "./api.js";

const rows = document.getElementById("rows");
const status = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");
const processBtn = document.getElementById("processBtn");

function esc(s) {
  return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

async function load() {
  status.textContent = "Cargando...";
  rows.innerHTML = "";
  const out = await api("/admin/billing-outbox", { method: "GET" });
  const items = out.items || [];
  for (const it of items) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(it.id)}</td>
      <td>${esc(it.petition_id)}</td>
      <td>${esc(it.action)}</td>
      <td>${esc(it.status)}</td>
      <td>${esc(it.attempts)}</td>
      <td style="max-width:420px;white-space:pre-wrap">${esc(it.last_error || "")}</td>
      <td>${esc(it.created_at || "")}</td>
      <td><button data-id="${esc(it.id)}">Reintentar</button></td>
    `;
    tr.querySelector("button").addEventListener("click", async () => {
      const id = tr.querySelector("button").dataset.id;
      status.textContent = `Procesando #${id}...`;
      try {
        await api(`/admin/billing-outbox/${id}/process`, { method: "POST", body: {} });
        await load();
      } catch (e) {
        status.textContent = `Error: ${e.message || e}`;
      }
    });
    rows.appendChild(tr);
  }
  status.textContent = `OK. Items: ${items.length}`;
}

refreshBtn.addEventListener("click", load);
processBtn.addEventListener("click", async () => {
  status.textContent = "Procesando pendientes...";
  try {
    await api("/admin/billing-outbox/process", { method: "POST", body: { limit: 50 } });
    await load();
  } catch (e) {
    status.textContent = `Error: ${e.message || e}`;
  }
});

load();
