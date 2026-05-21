import { requireAuth } from './guard.js';
import { api } from './api.js';

(async () => {
  await requireAuth({ minRole: 'ARTIST' });

  const els = {
    petitionType: document.getElementById('petitionType'),
    newPetition: document.getElementById('newPetition'),
    petitionsList: document.getElementById('petitionsList'),
    editor: document.getElementById('editor'),
    editorTitle: document.getElementById('editorTitle'),
    editorMeta: document.getElementById('editorMeta'),
    dynamicForm: document.getElementById('dynamicForm'),
    saveDraft: document.getElementById('saveDraft'),
    sendPetition: document.getElementById('sendPetition'),
    showChecklist: document.getElementById('showChecklist'),
    checklistBox: document.getElementById('checklistBox'),
    editorStatus: document.getElementById('editorStatus'),
    docType: document.getElementById('docType'),
    docFile: document.getElementById('docFile'),
    uploadDoc: document.getElementById('uploadDoc'),
    docsList: document.getElementById('docsList'),
    notifications: document.getElementById('notifications'),
    refreshNotifications: document.getElementById('refreshNotifications'),
    createReminders: document.getElementById('createReminders'),
    logoutBtn: document.getElementById('logoutBtn'),
  };
  
  let petitionTypes = [];
  let typesByKey = {};
  let currentPetition = null;
  let currentData = {};
  
  function setStatus(msg, ok = false) {
    els.editorStatus.style.color = ok ? 'green' : '#b00';
    els.editorStatus.textContent = msg || '';
  }
  
  function badge(status) {
    switch (status) {
      case 'BORRADOR': return '🟡 BORRADOR';
      case 'PENDIENTE_VALIDACION': return '🟣 ESPERANDO VALIDACIÓN';
      case 'PENDIENTE_INFO': return '🟠 PENDIENTE INFO';
      case 'ENVIADA': return '🔵 ENVIADA';
      case 'APROBADA': return '🟢 APROBADA';
      case 'LABORAL_EN_CURSO': return '🔧 LABORAL EN CURSO';
      case 'FACTURACION_EN_CURSO': return '🧾 FACTURACIÓN EN CURSO';
      case 'FACTURA_EMITIDA': return '📄 FACTURA EMITIDA';
      case 'COBRO_PENDIENTE': return '💸 COBRO PENDIENTE';
      case 'COBRO_PARCIAL': return '💸 COBRO PARCIAL';
      case 'COBRADA': return '✅ COBRADA';
      case 'NOMINA_PUBLICADA': return '🧮 NÓMINA PUBLICADA';
      case 'PAGADA': return '🏦 PAGADA';
      case 'CERRADA_CERO': return '🎯 CERRADA (CERO)';
      case 'RECHAZADA': return '🔴 RECHAZADA';
      default: return status || '-';
    }
  }
  
  function getByPath(obj, path) {
    const parts = String(path || '').split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }
  
  function setByPath(obj, path, value) {
    const parts = String(path || '').split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const k = parts[i];
      if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
  }
  
  function inputTypeForPath(path, fieldType) {
    if (fieldType === 'boolean') return 'checkbox';
    const p = String(path || '');
  
    if (
      p.endsWith('.date') ||
      p.endsWith('_date') ||
      p.includes('birth_date') ||
      p.includes('period_start') ||
      p.includes('period_end') ||
      p.includes('ida_date') ||
      p.includes('vuelta_date')
    ) return 'date';
  
    if (
      p.includes('amount') ||
      p.includes('total') ||
      p.includes('rate') ||
      p.includes('hourly_rate') ||
      p.includes('salary') ||
      p.includes('cache') ||
      p.includes('days_per_week') ||
      p.includes('invoice_month') ||
      p.includes('invoice_quarter')
    ) return 'number';
  
    if (
      p.includes('address') ||
      p.includes('concept') ||
      p.includes('notes') ||
      p.includes('comments') ||
      p.endsWith('_text') ||
      p.includes('explain') ||
      p.includes('case_other')
    ) return 'textarea';
  
    return 'text';
  }
  
  function selectOptionsForPath(path) {
    switch (path) {
      case 'irpf.situation_option':
        return [
          { v: '1', t: '1) Soltera/viuda/separada con hijos menores a cargo' },
          { v: '2', t: '2) Casada con cónyuge a cargo (pareja < 1.500€/año)' },
          { v: '3', t: '3) Soltera/pareja de hecho/sin hijos o tutela compartida' },
        ];
  
      case 'puntual.case':
        return [
          { v: 'RESIDO_OTRO_PAIS_PERMISO_ES', t: 'Resido en otro país + permiso ES: soporte legal completo + salario' },
          { v: 'RESIDO_ES_PROYECTO_PUNTUAL', t: 'Resido en España: soporte legal proyecto puntual + salario' },
          { v: 'AUTONOMO_SIN_RESPONSABLE', t: 'Estoy en Autónomos: proyecto puntual sin ser responsable legal' },
          { v: 'GRUPO_UE', t: 'Grupo/compañía: representante + trámites en UE' },
          { v: 'GRUPO_FUERA_UE', t: 'Grupo/compañía internacional (fuera UE): representante' },
          { v: 'OTRO', t: 'Otro (explicar)' },
        ];
  
      case 'vat.type':
        return [
          { v: 'IVA_21', t: '21%' },
          { v: 'IVA_4', t: '4%' },
          { v: 'EXENTO_UE_VIES', t: 'Exento UE con VIES' },
          { v: 'EXENTO_NO_UE', t: 'Exento por país no UE' },
          { v: 'EXENTO_FORMACION', t: 'Exento por formación' },
          { v: 'OTRO', t: 'Otro' },
        ];
  
      case 'training.class_type':
        return [
          { v: 'INTENSIVAS', t: 'Clases intensivas' },
          { v: 'REGULARES', t: 'Clases regulares' },
        ];
  
      case 'training.rate_mode':
        return [
          { v: 'NETO', t: 'Líquido (dinero en mano)' },
          { v: 'COSTE_TOTAL', t: 'Coste total (todo incluido)' },
        ];
  
      case 'training.invoice_when':
        return [
          { v: 'MES', t: 'Mes' },
          { v: 'TRIMESTRE', t: 'Trimestre' },
          { v: 'FIN_PERIODO', t: 'Fin de periodo' },
          { v: 'ANTICIPADA', t: 'Anticipada' },
        ];
  
      default:
        return null;
    }
  }
  
  function labelText(field) {
    const required = field?.required !== false;
    return required ? `${field.label} *` : `${field.label} (opcional)`;
  }
  
  
  function renderDatesSelector(field) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '10px';
  
    const lab = document.createElement('label');
    lab.textContent = labelText(field);
    lab.style.display = 'block';
    lab.style.fontWeight = 'bold';
    wrap.appendChild(lab);
  
    const listWrap = document.createElement('div');
    listWrap.style.margin = '6px 0';
  
    const dates = Array.isArray(getByPath(currentData, 'event.dates')) ? getByPath(currentData, 'event.dates') : [];
    const setDates = (arr) => {
      const clean = Array.from(new Set(arr.filter(Boolean))).sort();
      setByPath(currentData, 'event.dates', clean);
      // keep backward compatible text
      setByPath(currentData, 'event.dates_text', clean.join(', '));
      refreshList();
    };
  
    const refreshList = () => {
      listWrap.innerHTML = '';
      const cur = Array.isArray(getByPath(currentData, 'event.dates')) ? getByPath(currentData, 'event.dates') : [];
      if (cur.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'Sin fechas seleccionadas.';
        listWrap.appendChild(p);
        return;
      }
      const ul = document.createElement('ul');
      cur.forEach((d) => {
        const li = document.createElement('li');
        li.textContent = d + ' ';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Quitar';
        btn.onclick = () => setDates(cur.filter((x) => x !== d));
        li.appendChild(btn);
        ul.appendChild(li);
      });
      listWrap.appendChild(ul);
    };
  
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.flexWrap = 'wrap';
  
    const start = document.createElement('input');
    start.type = 'date';
    const end = document.createElement('input');
    end.type = 'date';
  
    const btnAddRange = document.createElement('button');
    btnAddRange.type = 'button';
    btnAddRange.textContent = 'Agregar rango';
  
    const btnAddOne = document.createElement('button');
    btnAddOne.type = 'button';
    btnAddOne.textContent = 'Agregar fecha';
  
    const addRange = () => {
      if (!start.value) return;
      if (!end.value) {
        const cur = Array.isArray(getByPath(currentData, 'event.dates')) ? getByPath(currentData, 'event.dates') : [];
        setDates(cur.concat([start.value]));
        return;
      }
      const s = new Date(start.value + 'T00:00:00Z');
      const e = new Date(end.value + 'T00:00:00Z');
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return;
      const cur = Array.isArray(getByPath(currentData, 'event.dates')) ? getByPath(currentData, 'event.dates') : [];
      const add = [];
      for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
        add.push(d.toISOString().slice(0, 10));
      }
      setDates(cur.concat(add));
    };
  
    btnAddRange.onclick = addRange;
    btnAddOne.onclick = () => {
      if (!start.value) return;
      const cur = Array.isArray(getByPath(currentData, 'event.dates')) ? getByPath(currentData, 'event.dates') : [];
      setDates(cur.concat([start.value]));
    };
  
    row.appendChild(start);
    row.appendChild(end);
    row.appendChild(btnAddOne);
    row.appendChild(btnAddRange);
  
    wrap.appendChild(row);
    wrap.appendChild(listWrap);
  
    // init from dates_text if dates missing
    const curDates = Array.isArray(getByPath(currentData, 'event.dates')) ? getByPath(currentData, 'event.dates') : [];
    const text = String(getByPath(currentData, 'event.dates_text') || '').trim();
    if (curDates.length === 0 && text) {
      const parsed = text.split(/[,;\n]+/).map((s) => s.trim()).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
      if (parsed.length) setDates(parsed);
    } else {
      refreshList();
    }
  
    return wrap;
  }
  
  function renderField(field) {
    const { path, type } = field;
    if (path === 'event.dates') return renderDatesSelector(field);
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '10px';
  
    const lab = document.createElement('label');
    lab.textContent = labelText(field);
    lab.style.display = 'block';
    lab.style.fontWeight = 'bold';
  
    const options = selectOptionsForPath(path);
    const t = inputTypeForPath(path, type);
  
    let input;
  
    if (options) {
      input = document.createElement('select');
      options.forEach((o) => {
        const opt = document.createElement('option');
        opt.value = o.v;
        opt.textContent = o.t;
        input.appendChild(opt);
      });
      input.value = getByPath(currentData, path) ?? '';
    } else if (t === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      const curVal = getByPath(currentData, path);
      if (curVal === undefined && field?.mustBeTrue !== true) setByPath(currentData, path, false);
      input.checked = getByPath(currentData, path) === true;
    } else if (t === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
      const v = getByPath(currentData, path);
      input.value = v === undefined || v === null ? '' : String(v);
    } else {
      input = document.createElement('input');
      input.type = t;
      if (t === 'number') input.step = '0.01';
  
      // IRPF is stored as decimal (0.02) but entered as percent (2)
      if (path === 'fiscal.irpf_rate') {
        const v = getByPath(currentData, path);
        input.value = v === undefined || v === null ? '' : String(Number(v) * 100);
        input.onchange = () => {
          const raw = input.value === '' ? null : Number(input.value);
          setByPath(currentData, path, raw === null ? null : raw / 100);
        };
      } else {
        const v = getByPath(currentData, path);
        input.value = v === undefined || v === null ? '' : String(v);
      }
    }
  
    if (!input.onchange) {
      input.onchange = () => {
        if (t === 'checkbox') setByPath(currentData, path, input.checked === true);
        else if (t === 'number') setByPath(currentData, path, input.value === '' ? null : Number(input.value));
        else setByPath(currentData, path, input.value);
      };
    }
  
    wrap.appendChild(lab);
    wrap.appendChild(input);
    return wrap;
  }
  
  function renderListEditor({ path, title, columns }) {
    const box = document.createElement('div');
    box.style.borderTop = '1px solid #ddd';
    box.style.paddingTop = '10px';
    box.style.marginTop = '10px';
  
    const h = document.createElement('h4');
    h.textContent = title;
    box.appendChild(h);
  
    const btn = document.createElement('button');
    btn.textContent = 'Agregar';
    btn.onclick = () => {
      const cur = Array.isArray(getByPath(currentData, path)) ? getByPath(currentData, path) : [];
      const obj = {};
      columns.forEach((c) => { obj[c.key] = c.type === 'number' ? null : ''; });
      cur.push(obj);
      setByPath(currentData, path, cur);
      draw();
    };
  
    const list = document.createElement('div');
    box.appendChild(btn);
    box.appendChild(list);
  
    function draw() {
      list.innerHTML = '';
      const rows = Array.isArray(getByPath(currentData, path)) ? getByPath(currentData, path) : [];
  
      rows.forEach((row, idx) => {
        const r = document.createElement('div');
        r.style.margin = '8px 0';
        r.style.padding = '8px';
        r.style.border = '1px solid #eee';
  
        columns.forEach((c) => {
          const l = document.createElement('label');
          l.textContent = c.label;
          l.style.display = 'block';
  
          let inp;
          if (c.type === 'boolean') {
            inp = document.createElement('input');
            inp.type = 'checkbox';
            inp.checked = row[c.key] === true;
            inp.onchange = () => { row[c.key] = inp.checked === true; };
          } else {
            inp = document.createElement('input');
            inp.type = c.type === 'number' ? 'number' : 'text';
            if (c.type === 'number') inp.step = '1';
            inp.value = row[c.key] === undefined || row[c.key] === null ? '' : String(row[c.key]);
            inp.onchange = () => {
              row[c.key] = c.type === 'number' ? (inp.value === '' ? null : Number(inp.value)) : inp.value;
            };
          }
  
          r.appendChild(l);
          r.appendChild(inp);
        });
  
        const del = document.createElement('button');
        del.textContent = 'Eliminar';
        del.onclick = () => {
          rows.splice(idx, 1);
          setByPath(currentData, path, rows);
          draw();
        };
  
        r.appendChild(del);
        list.appendChild(r);
      });
    }
  
    draw();
    return box;
  }
  
  function renderAltaFacturaReparto() {
    return renderListEditor({
      path: 'reparto.lines',
      title: 'Reparto (caché por persona) — obligatorio si marcás “compañía/grupo”',
      columns: [
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'amount', label: 'Importe (€)', type: 'number' },
        { key: 'retention_included', label: 'Retención incluida (SI/NO)', type: 'boolean' },
      ],
    });
  }
  
  function renderIrpfChildren() {
    return renderListEditor({
      path: 'irpf.children',
      title: 'Hijos/as (nombre y año de nacimiento)',
      columns: [
        { key: 'full_name', label: 'Nombre y apellidos', type: 'text' },
        { key: 'birth_year', label: 'Año de nacimiento', type: 'number' },
      ],
    });
  }
  
  function renderOtherDescendants() {
    return renderListEditor({
      path: 'irpf.other_descendants',
      title: 'Otros descendientes (nombre, año nacimiento, discapacidad si aplica)',
      columns: [
        { key: 'full_name', label: 'Nombre y apellidos', type: 'text' },
        { key: 'birth_year', label: 'Año de nacimiento', type: 'number' },
        { key: 'disability_grade', label: 'Grado discapacidad (opcional)', type: 'text' },
      ],
    });
  }
  
  function renderSchedule() {
    const box = document.createElement('div');
    box.style.borderTop = '1px solid #ddd';
    box.style.paddingTop = '10px';
    box.style.marginTop = '10px';
  
    const title = document.createElement('h4');
    title.textContent = 'Calendario (sesiones) — opcional';
    box.appendChild(title);
  
    const list = document.createElement('div');
    const btn = document.createElement('button');
    btn.textContent = 'Agregar sesión';
    btn.onclick = () => {
      currentData.training = currentData.training || {};
      currentData.training.schedule = Array.isArray(currentData.training.schedule) ? currentData.training.schedule : [];
      currentData.training.schedule.push({ date: '', start_time: '', end_time: '' });
      draw();
    };
  
    box.appendChild(btn);
    box.appendChild(list);
  
    function draw() {
      list.innerHTML = '';
      const schedule = Array.isArray(currentData?.training?.schedule) ? currentData.training.schedule : [];
      schedule.forEach((s, idx) => {
        const row = document.createElement('div');
        row.style.margin = '8px 0';
        row.style.padding = '8px';
        row.style.border = '1px solid #eee';
  
        const date = document.createElement('input');
        date.type = 'date';
        date.value = s.date || '';
        date.onchange = () => { s.date = date.value; };
  
        const start = document.createElement('input');
        start.placeholder = 'HH:MM';
        start.value = s.start_time || '';
        start.onchange = () => { s.start_time = start.value; };
  
        const end = document.createElement('input');
        end.placeholder = 'HH:MM';
        end.value = s.end_time || '';
        end.onchange = () => { s.end_time = end.value; };
  
        const del = document.createElement('button');
        del.textContent = 'Eliminar';
        del.onclick = () => {
          currentData.training.schedule.splice(idx, 1);
          draw();
        };
  
        row.appendChild(date);
        row.appendChild(start);
        row.appendChild(end);
        row.appendChild(del);
        list.appendChild(row);
      });
    }
  
    draw();
    return box;
  }
  
  function drawDynamicForm() {
    els.dynamicForm.innerHTML = '';
    const type = String(currentPetition?.type || '').toUpperCase();
    const schema = typesByKey[type];
  
    if (!schema) {
      els.dynamicForm.textContent = 'Tipo inválido.';
      return;
    }
  
    schema.required_fields.forEach((f) => {
      els.dynamicForm.appendChild(renderField(f));
    });
  
    if (type === 'ONBOARDING_ASSOCIADO' || type === 'ONBOARDING_PUNTUAL') {
      els.dynamicForm.appendChild(renderIrpfChildren());
      els.dynamicForm.appendChild(renderOtherDescendants());
    }
  
    if (type === 'ALTA_FACTURA') {
      els.dynamicForm.appendChild(renderAltaFacturaReparto());
    }
  
    if (type === 'FORMACION') {
      els.dynamicForm.appendChild(renderSchedule());
    }
  }
  
  async function refreshDocs() {
    if (!currentPetition) return;
    const rows = await api(`/petitions/${currentPetition.id}/documents`);
    els.docsList.innerHTML = '';
  
    if (!rows || rows.length === 0) {
      els.docsList.innerHTML = '<li>Sin documentos</li>';
      return;
    }
  
    rows.forEach((d) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `/api/documents/${d.id}/download`;
      const prefix = d.is_official ? '✅ OFICIAL: ' : '';
      a.textContent = `${prefix}${d.doc_type} - ${d.original_name}`;
      a.target = '_blank';
      li.appendChild(a);
      els.docsList.appendChild(li);
    });
  }
  
  function setDocTypeOptions(missingDocs = []) {
    const base = [
      'DNI',
      'ACOMPANANTE_ALTA',
      'ACOMPANANTE_FACTURA',
      'DNI_ACOMPANANTE',
      'FICHA_ACOMPANANTE',
      'FACTURA_GASTOS_REPRESENTACION',
      'OTRO',
    ];
    const all = Array.from(new Set([...missingDocs.map((d) => d.doc_type), ...base]));
    els.docType.innerHTML = '';
    all.forEach((dt) => {
      const opt = document.createElement('option');
      opt.value = dt;
      opt.textContent = dt;
      els.docType.appendChild(opt);
    });
  }
  
  async function refreshChecklist() {
    if (!currentPetition) return;
    const c = await api(`/petitions/${currentPetition.id}/checklist`);
  
    const lines = [];
    if (c.ruleErrors?.length) {
      lines.push('<b>Reglas</b><ul>' + c.ruleErrors.map((e) => `<li>${e.message}</li>`).join('') + '</ul>');
    }
    if (c.missingFields?.length) {
      lines.push('<b>Campos faltantes</b><ul>' + c.missingFields.map((f) => `<li>${f.label}</li>`).join('') + '</ul>');
    }
    if (c.missingDocs?.length) {
      lines.push('<b>Docs faltantes</b><ul>' + c.missingDocs.map((d) => `<li>${d.doc_type}</li>`).join('') + '</ul>');
    }
    if (!lines.length) lines.push('✅ No faltan requisitos.');
  
    els.checklistBox.innerHTML = lines.join('');
    setDocTypeOptions(c.missingDocs || []);
    const editable = (currentPetition && (currentPetition.status === 'BORRADOR' || currentPetition.status === 'PENDIENTE_INFO') && !currentPetition.locked);
    els.sendPetition.disabled = !editable;
  }
  
  async function openPetition(id) {
    const p = await api(`/petitions/${id}`);
    currentPetition = p;
    currentData = p.data || {};
  
    els.editor.style.display = 'block';
    els.editorTitle.textContent = `Editando petición #${p.id}`;
    const noteLine = p.admin_note ? `<div style="color:#b00;">Admin: ${p.admin_note}</div>` : '';
    els.editorMeta.innerHTML = `<div>Tipo: <b>${p.type}</b> | Estado: <b>${badge(p.status)}</b></div>${noteLine}`;
  
    drawDynamicForm();
    await refreshDocs();
    await refreshChecklist();
    setStatus('');
  }
  
  async function loadPetitions() {
    const rows = await api('/petitions');
    els.petitionsList.innerHTML = '';
  
    if (!rows || rows.length === 0) {
      els.petitionsList.textContent = 'No tenés peticiones.';
      return;
    }
  
    rows.forEach((p) => {
      const div = document.createElement('div');
      div.style.border = '1px solid #ddd';
      div.style.padding = '10px';
      div.style.marginBottom = '8px';
  
      const label = typesByKey[String(p.type || '').toUpperCase()]?.label || p.type;
  
      const missing = p.summary && p.summary.total_missing ? `Faltan: ${p.summary.total_missing} ${p.summary_preview ? '(' + p.summary_preview + ')' : ''}` : '';
  
      div.innerHTML = `
        <div><b>#${p.id}</b> — ${label} — ${badge(p.status)}</div>
        ${missing ? `<div style="color:#b00;">${missing}</div>` : ''}
        <button data-open="${p.id}">Abrir</button>
      `;
  
      els.petitionsList.appendChild(div);
    });
  
    els.petitionsList.querySelectorAll('button[data-open]').forEach((b) => {
      b.onclick = () => openPetition(b.dataset.open);
    });
  }
  
  async function loadNotifications() {
    els.notifications.innerHTML = '<li>Cargando...</li>';
    try {
      const notes = await api('/notifications');
      els.notifications.innerHTML = '';
      if (!notes || notes.length === 0) {
        els.notifications.innerHTML = '<li>No tenés notificaciones</li>';
        return;
      }
      notes.forEach((n) => {
        const li = document.createElement('li');
        li.textContent = n.message;
        els.notifications.appendChild(li);
      });
    } catch {
      els.notifications.innerHTML = '<li>Error cargando notificaciones</li>';
    }
  }
  
  async function init() {
    petitionTypes = await api('/petition-types');
    petitionTypes.forEach((t) => { typesByKey[String(t.type).toUpperCase()] = t; });
  
    els.petitionType.innerHTML = '';
    petitionTypes.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.type;
      opt.textContent = t.label;
      els.petitionType.appendChild(opt);
    });
  
    await loadPetitions();
    await loadNotifications();
  }
  
  els.newPetition.onclick = async () => {
    const type = els.petitionType.value;
    const r = await api('/petitions', { method: 'POST', body: { type } });
    await loadPetitions();
    await openPetition(r.id);
  };
  
  els.saveDraft.onclick = async () => {
    if (!currentPetition) return;
    setStatus('Guardando...');
    try {
      await api(`/petitions/${currentPetition.id}`, { method: 'PUT', body: currentData });
      await openPetition(currentPetition.id);
      setStatus('Borrador guardado.', true);
      await loadPetitions();
    } catch (e) {
      setStatus(e.message || 'Error');
    }
  };
  
  els.showChecklist.onclick = async () => {
    try {
      await refreshChecklist();
    } catch (e) {
      setStatus(e.message || 'Error');
    }
  };
  
  els.sendPetition.onclick = async () => {
    if (!currentPetition) return;
    setStatus('Enviando...');
    try {
      await api(`/petitions/${currentPetition.id}/send`, { method: 'PUT' });
      setStatus('Enviada.', true);
      els.editor.style.display = 'none';
      await loadPetitions();
      await loadNotifications();
    } catch (e) {
      setStatus(e.message || 'No se pudo enviar');
      try { await refreshChecklist(); } catch {}
    }
  };
  
  els.uploadDoc.onclick = async () => {
    if (!currentPetition) return;
    const dt = els.docType.value;
    const file = els.docFile.files?.[0];
    if (!file) return setStatus('Seleccioná un archivo.');
  
    setStatus('Subiendo documento...');
    const fd = new FormData();
    fd.append('doc_type', dt);
    fd.append('file', file);
  
    try {
      await api(`/petitions/${currentPetition.id}/documents`, { method: 'POST', body: fd, isForm: true });
      els.docFile.value = '';
      await refreshDocs();
      await refreshChecklist();
      setStatus('Documento subido.', true);
    } catch (e) {
      setStatus(e.message || 'Error subiendo doc');
    }
  };
  
  els.refreshNotifications.onclick = loadNotifications;
  
  els.createReminders.onclick = async () => {
    try {
      await api('/notifications/remind', { method: 'POST' });
      await loadNotifications();
    } catch (e) {
      setStatus(e.message || 'Error generando recordatorios');
    }
  };
  
  els.logoutBtn.onclick = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login.html';
  };
  
  init().catch((e) => {
    els.petitionsList.textContent = e.message || 'Error inicializando';
  });
})();
