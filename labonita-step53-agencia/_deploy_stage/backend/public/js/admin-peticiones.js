// Legacy shim:
// this page is deprecated in favor of app.html#/peticiones.
(() => {
  const qs = new URLSearchParams(window.location.search);
  const petitionId = Number(qs.get('petition_id') || 0);
  const target = petitionId > 0
    ? `/app.html#/peticiones?petition_id=${encodeURIComponent(String(petitionId))}`
    : '/app.html#/peticiones';
  window.location.replace(target);
})();
