import { requireAuth } from './guard.js';
import { api } from './api.js';

(async () => {
  await requireAuth({ minRole: 'ARTIST' });

  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function getParam(name){ return new URLSearchParams(location.search).get(name); }
  
  function badge(status){
    const map={
      BORRADOR:'🟡 BORRADOR',
      PENDIENTE_VALIDACION:'🟣 PENDIENTE VALIDACIÓN',
      PENDIENTE_INFO:'🟠 PENDIENTE INFO',
      VALIDADA:'🟢 VALIDADA',
      RECHAZADA:'🔴 RECHAZADA',
      CERRADA_CERO:'🎯 CERRADA (CERO)'
    };
    return map[status]||status||'-';
  }
  
  function setByPath(obj, path, value){
    const parts=path.split('.');
    let cur=obj;
    for(let i=0;i<parts.length-1;i++){
      const k=parts[i];
      if(cur[k]==null || typeof cur[k]!=='object') cur[k]={};
      cur=cur[k];
    }
    cur[parts[parts.length-1]]=value;
  }
  
  function getByPath(obj, path){
    const parts=path.split('.');
    let cur=obj;
    for(const p of parts){
      if(cur==null) return null;
      cur=cur[p];
    }
    return cur;
  }
  
  let petitions=[];
  let selected=null;
  let schemaCache={};
  let wizardState = { stepIndex: 0, steps: [] };
  
  async function who(){
    const me=await api('/me');
    document.getElementById('who').textContent=`${me.role} · ${me.email||('#'+me.id)}`;
  }
  
  function renderList(){
    const q=(document.getElementById('q').value||'').toLowerCase().trim();
    const rows=petitions.filter(p=>{
      const s=`${p.id} ${p.type} ${p.status}`.toLowerCase();
      return !q || s.includes(q);
    });
    const el=document.getElementById('list');
    el.innerHTML = rows.length ? rows.map(p=>{
      const sel = selected && selected.id===p.id ? 'style="background:rgba(253,250,0,.20); border-radius:12px;"' : '';
      return `<div ${sel} class="step" style="margin-bottom:10px; cursor:pointer;" data-id="${p.id}">
        <div style="display:flex; justify-content:space-between; gap:8px;">
          <strong>#${p.id} · ${esc(p.type)}</strong>
          <span class="badge">${badge(p.status)}</span>
        </div>
        <div class="small">${esc(p.created_at||'')}</div>
      </div>`;
    }).join('') : '<div class="small">Sin peticiones.</div>';
  
    el.querySelectorAll('[data-id]').forEach(d=>{
      d.onclick=()=>openDetail(Number(d.dataset.id));
    });
  }
  
  async function load(){
    document.getElementById('list').innerHTML = `<div class="skeleton" style="height:24px; margin-bottom:10px;"></div>
    <div class="skeleton" style="height:24px; margin-bottom:10px;"></div>
    <div class="skeleton" style="height:24px; margin-bottom:10px;"></div>`;
    petitions = await api('/petitions');
    renderList();
  
    const pid = Number(getParam('petition_id'));
    if (pid) openDetail(pid);
  }
  
  async function getSchema(type){
    if(schemaCache[type]) return schemaCache[type];
    const s=await api(`/petitions/schema?type=${encodeURIComponent(type)}`);
    schemaCache[type]=s;
    return s;
  }
  
  function inputForField(f, value){
    const id = `f_${f.path.replaceAll('.','_')}`;
    const common = `id="${id}" data-path="${esc(f.path)}" class="btn" style="width:100%;"`;
    if (f.type === 'number') return `<input ${common} type="number" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder||'')}" />`;
    if (f.type === 'date') return `<input ${common} type="date" value="${esc(value ?? '')}" />`;
    if (f.type === 'select' && Array.isArray(f.options)) {
      return `<select ${common}>${f.options.map(o=>`<option value="${esc(o)}" ${String(o)===String(value)?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
    }
    return `<input ${common} type="text" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder||'')}" />`;
  }
  
  async function openDetail(id){
    selected = await api(`/petitions/${id}`);
    const chk = await api(`/petitions/${id}/checklist`);
    const docs = await api(`/petitions/${id}/documents`);
    const sch = await getSchema(selected.type);
  
    const missingFields = (chk?.checklist?.missingFields)||[];
    const focus = getParam('focus_field');
  
    const el=document.getElementById('detail');
    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
        <div>
          <div><strong>Petición #${selected.id}</strong> · <span class="badge">${badge(selected.status)}</span></div>
          <div class="small">${esc(selected.type)} · ${esc(selected.updated_at||'')}</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn" id="btnSave" type="button"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
          <button class="btn btn-primary" id="btnSend" type="button"><i class="fa-solid fa-paper-plane"></i> Enviar</button>
        </div>
      </div>
  
      <div class="card" style="padding:12px; margin-top:12px;">
        <div class="small"><strong>Checklist</strong>: faltan ${missingFields.length} campos · docs requeridos ${sch.docs.length}</div>
        ${missingFields.length ? `<div style="margin-top:8px;">${missingFields.slice(0,30).map(m=>`<div>• <a href="?petition_id=${id}&focus_field=${encodeURIComponent(m.path)}">${esc(m.label)}</a></div>`).join('')}</div>` : `<div class="small" style="margin-top:8px;">✅ Sin faltantes de campos</div>`}
      </div>
  
      <div class="card" style="padding:12px; margin-top:12px;">
        <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; align-items:center;">
          <strong>Documentos</strong>
          <form id="docForm">
            <select id="docType" class="btn">${sch.docs.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select>
            <input type="file" id="docFile" class="btn" />
            <button class="btn btn-primary" type="submit">Subir</button>
          </form>
        </div>
        <div class="small" style="margin-top:10px;">
          ${(docs.rows||docs||[]).map(d=>`<div>• ${esc(d.doc_type)} · ${esc(d.filename)} · ${esc(d.created_at||'')}</div>`).join('') || '—'}
        </div>
        <div class="small" id="docOut"></div>
      </div>
  
      <div class="card" style="padding:12px; margin-top:12px;">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
          <div>
            <strong>Wizard</strong>
            <div class="small">Completá por pasos. Guardá cuando quieras; Enviar al final.</div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn" id="btnPrev" type="button"><i class="fa-solid fa-arrow-left"></i> Atrás</button>
            <button class="btn btn-primary" id="btnNext" type="button">Siguiente <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </div>
        <div id="wizSteps" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;"></div>
        <hr class="hr" />
        <div id="wizHeader" class="small">—</div>
        <div id="formBox" style="margin-top:10px; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px;"></div>
      </div>
    `;
  
      const box=document.getElementById('formBox');
    wizardState.steps = wizardStepsForType(selected.type, sch.fields);
    wizardState.stepIndex = 0;
    renderWizard(payload, missingFields, focus);
  
    // focus scroll
    if (focus) {
      const elF = document.querySelector(`[data-path="${CSS.escape(focus)}"]`);
      if (elF) elF.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  
    const saveFn = async () => {
      const newPayload = JSON.parse(JSON.stringify(payload || {}));
      document.querySelectorAll('[data-path]').forEach(inp=>{
        const pth=inp.dataset.path;
        const val = inp.tagName==='SELECT' ? inp.value : inp.value;
        setByPath(newPayload, pth, val);
      });
      await api(`/petitions/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ payload: newPayload }) });
      await load();
      await openDetail(id);
    };
  
    document.getElementById('btnSave').onclick = saveFn;
    document.getElementById('btnSend').onclick = sendFn;
    wireStickyActions(saveFn, sendFn);
  
  
    const sendFn = async () => {
      await api(`/petitions/${id}/send`, { method:'PUT' });
      await load();
      await openDetail(id);
    };
  
    document.getElementById('btnSave').onclick = saveFn;
    document.getElementById('btnSend').onclick = sendFn;
    wireStickyActions(saveFn, sendFn);
  
  
    document.getElementById('docForm').onsubmit = async (e) => {
      e.preventDefault();
      const out=document.getElementById('docOut');
      out.textContent='Subiendo...';
      const docType=document.getElementById('docType').value;
      const file=document.getElementById('docFile').files[0];
      if (!file) { out.textContent='Seleccioná un archivo'; return; }
      const fd=new FormData();
      fd.append('doc_type', docType);
      fd.append('file', file);
      await fetch(`/api/petitions/${id}/documents`, { method:'POST', body: fd, credentials:'include' });
      out.textContent='OK';
      await openDetail(id);
    };
  
    document.getElementById('btnSave').onclick = saveFn;
    document.getElementById('btnSend').onclick = sendFn;
    wireStickyActions(saveFn, sendFn);
  
  
    renderList();
  }
  
  async function createNew(){
    const type = prompt('Tipo (ONBOARDING_ASSOCIADO / ONBOARDING_PUNTUAL / ALTA_FACTURA / FORMACION / PRESUPUESTO):','ALTA_FACTURA');
    if (!type) return;
    const p = await api('/petitions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type }) });
    await load();
    await openDetail(p.id);
  }
  
  document.getElementById('btnReload').onclick=load;
  document.getElementById('btnNew').onclick=createNew;
  document.getElementById('q').oninput=renderList;
  
  (async function boot(){
    await who();
    await load();
  })();
  
  
  function wizardStepsForType(type, fields) {
    const t = String(type||'').toUpperCase();
    const byPrefix = (prefixes) => fields.filter((f) => prefixes.some((p) => String(f.path||'').startsWith(p)));
    const byContains = (subs) => fields.filter((f) => subs.some((s) => String(f.path||'').includes(s)));
  
    const mk = (key, title, icon, filterFn) => ({ key, title, icon, fields: fields.filter(filterFn) });
  
    if (t === 'ALTA_FACTURA') {
      return [
        mk('basico','Básico','fa-solid fa-file-circle-plus',(f)=>f.path.startsWith('payload.reference') || f.path.startsWith('payload.responsable') || f.path.startsWith('payload.company') || f.path.startsWith('payload.show')),
        mk('fechas','Fechas','fa-solid fa-calendar-days',(f)=>f.path.startsWith('payload.event') || f.path.startsWith('payload.dates') || f.path.includes('dates_text')),
        mk('viajes','Viajes','fa-solid fa-plane',(f)=>f.path.startsWith('payload.travel') || f.path.startsWith('payload.hotel') || f.path.includes('acomp') || f.path.includes('companions')),
        mk('factura','Datos factura','fa-solid fa-receipt',(f)=>f.path.startsWith('payload.invoice')),
        mk('importes','Importes','fa-solid fa-euro-sign',(f)=>f.path.includes('amount') || f.path.includes('iva') || f.path.includes('vat') || f.path.includes('total')),
        mk('comentarios','Comentarios','fa-solid fa-comment-dots',(f)=>f.path.includes('comments') || f.path.includes('notes') || f.path.includes('observaciones')),
      ].filter((s)=>s.fields.length);
    }
  
    if (t === 'FORMACION') {
      return [
        mk('basico','Básico','fa-solid fa-file-circle-plus',(f)=>f.path.startsWith('payload.reference') || f.path.startsWith('payload.responsable')),
        mk('periodo','Periodo','fa-solid fa-calendar-days',(f)=>f.path.startsWith('payload.period') || f.path.startsWith('payload.start') || f.path.startsWith('payload.end') || f.path.includes('fecha')),
        mk('clases','Clases','fa-solid fa-chalkboard-user',(f)=>f.path.startsWith('payload.clases') || f.path.includes('horario') || f.path.includes('dias')),
        mk('importes','Importes','fa-solid fa-euro-sign',(f)=>f.path.includes('importe') || f.path.includes('hora') || f.path.includes('liquido') || f.path.includes('coste') || f.path.includes('total') || f.path.includes('factura')),
        mk('direccion','Dirección','fa-solid fa-location-dot',(f)=>f.path.includes('direccion') || f.path.includes('ciudad') || f.path.includes('lugar')),
        mk('comentarios','Comentarios','fa-solid fa-comment-dots',(f)=>f.path.includes('comments') || f.path.includes('notes') || f.path.includes('observaciones')),
      ].filter((s)=>s.fields.length);
    }
  
    if (t === 'PRESUPUESTO') {
      return [
        mk('basico','Básico','fa-solid fa-file-circle-plus',()=>true),
      ];
    }
  
    // Onboarding: keep short
    if (t.startsWith('ONBOARDING_')) {
      return [
        mk('perfil','Perfil','fa-solid fa-user', (f)=>f.path.includes('personal') || f.path.includes('contact') || f.path.includes('bank') || f.path.includes('nif') || f.path.includes('dni')),
        mk('otros','Otros','fa-solid fa-folder-open', (f)=>!false),
      ].filter((s)=>s.fields.length);
    }
  
    // default: chunk by 12
    const chunk = [];
    for (let i=0;i<fields.length;i+=12) chunk.push({ key:`step${i}`, title:`Paso ${chunk.length+1}`, icon:'fa-solid fa-list', fields: fields.slice(i,i+12) });
    return chunk;
  }
  
  function requiredMissing(payload, stepFields) {
    const missing = [];
    for (const f of stepFields) {
      if (!f.required) continue;
      const v = getByPath(payload || {}, f.path);
      if (v == null || String(v).trim() === '') missing.push(f);
    }
    return missing;
  }
  
  
  function renderWizard(payload, missingFields, focusPath) {
    const stepBox = document.getElementById('wizSteps');
    const header = document.getElementById('wizHeader');
    const formBox = document.getElementById('formBox');
    if (!stepBox || !header || !formBox) return;
  
    const steps = wizardState.steps || [];
    const idx = Math.max(0, Math.min(wizardState.stepIndex || 0, steps.length-1));
    wizardState.stepIndex = idx;
  
    stepBox.innerHTML = steps.map((s, i) => {
      const miss = requiredMissing(payload, s.fields).length;
      const active = i === idx;
      const bg = active ? 'background:rgba(253,250,0,.25);' : 'background:rgba(0,0,0,.04);';
      return `<button class="btn" type="button" data-step="${i}" style="${bg} border-radius:14px; display:flex; gap:8px; align-items:center;">
        <i class="${s.icon}"></i> ${esc(s.title)}
        ${miss ? `<span class="badge warn">${miss} req</span>` : `<span class="badge ok">ok</span>`}
      </button>`;
    }).join('');
  
    stepBox.querySelectorAll('[data-step]').forEach((b) => {
      b.onclick = () => { wizardState.stepIndex = Number(b.dataset.step); renderWizard(payload, missingFields, focusPath); };
    });
  
    const step = steps[idx];
    const missReq = requiredMissing(payload, step.fields);
    header.innerHTML = `<strong>${esc(step.title)}</strong> · ${missReq.length ? `<span class="badge warn">Faltan ${missReq.length} requeridos</span>` : `<span class="badge ok">OK</span>`}`;
  
    // render only fields in this step
    formBox.innerHTML = step.fields.map((f) => {
      const v = getByPath(payload, f.path);
      const miss = missingFields.find((x) => x.path === f.path);
      const focusClass = focusPath === f.path ? 'style="outline:2px solid var(--amarillo-neon); border-radius:12px; padding:8px;"' : '';
      return `<div ${focusClass}>
        <div class="small"><strong>${esc(f.label)}</strong> ${f.required ? '<span class="badge warn">REQ</span>' : ''} ${miss ? '<span class="badge error">FALTA</span>' : ''}</div>
        ${inputForField(f, v)}
        <div class="small">${esc(f.path)}</div>
      </div>`;
    }).join('');
  
    // focus scroll to field if requested
    if (focusPath) {
      const elF = document.querySelector(`[data-path="${CSS.escape(focusPath)}"]`);
      if (elF) elF.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  
    // buttons
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    if (btnPrev) btnPrev.disabled = idx === 0;
    if (btnNext) btnNext.innerHTML = idx === steps.length - 1 ? `Finalizar <i class="fa-solid fa-flag-checkered"></i>` : `Siguiente <i class="fa-solid fa-arrow-right"></i>`;
  
    if (btnPrev) btnPrev.onclick = () => { wizardState.stepIndex = Math.max(0, idx-1); renderWizard(payload, missingFields, focusPath); };
    if (btnNext) btnNext.onclick = () => { wizardState.stepIndex = Math.min(steps.length-1, idx+1); renderWizard(payload, missingFields, focusPath); };
  }
  
  
  function wireStickyActions(saveFn, sendFn) {
    const bar = document.getElementById('stickyActions');
    const btnS = document.getElementById('btnSaveSticky');
    const btnE = document.getElementById('btnSendSticky');
    if (!bar || !btnS || !btnE) return;
  
    const refresh = () => {
      const onMobile = window.matchMedia('(max-width: 600px)').matches;
      bar.style.display = onMobile && selected ? 'flex' : 'none';
    };
  
    btnS.onclick = saveFn;
    btnE.onclick = sendFn;
  
    window.addEventListener('resize', refresh);
    refresh();
  }
})();
