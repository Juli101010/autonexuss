(function(){
  const isAdmin = location.pathname.includes('labonita-operativo');
  const isArtist = location.pathname.includes('artist-operativo');
  const adminSteps = [
    {sel:'.brand',title:'Identidad del panel',body:'Este es el panel operativo de administración. Desde acá se gobierna el circuito completo: petición, planilla, validación, factura interna, liquidación, control y DELSOL.'},
    {sel:'#panel-dashboard',title:'Dashboard operativo',body:'Acá se ven los indicadores principales: peticiones activas, facturación interna, pendientes, bloqueos y cola de sincronización.'},
    {sel:'#panel-mapa',title:'Mapa de Peticiones',body:'El sistema no trabaja por pantallas sueltas. Todo nace desde el mapa: planilla → validación → factura/contrato/liquidación → control total → sincronización.'},
    {sel:'#panel-crear',title:'Nueva petición desde planilla',body:'Para crear una petición hay que elegir una planilla real. Puede guardarse incompleta, pero no se aprueba ni factura hasta completar los datos obligatorios.'},
    {sel:'#requiredText',title:'Control de campos obligatorios',body:'La barra de completitud muestra qué falta. Esto permite enviar a revisión con faltantes, pero bloquea la aprobación administrativa.'},
    {sel:'#btnSave',title:'Guardar borrador',body:'Guarda la petición aunque falten datos. Sirve para que usuario o administración puedan continuar luego.'},
    {sel:'#btnSubmit',title:'Enviar a revisión',body:'Envía la planilla a administración. Si hay faltantes queda como pendiente u observada hasta corregir.'},
    {sel:'#panel-lista',title:'Listado de peticiones',body:'Administración ve todas las peticiones, sus estados y referencias. Al seleccionar una fila se abre el detalle operativo.'},
    {sel:'#panel-detalle',title:'Detalle y validación',body:'Desde el detalle se aprueba, observa o rechaza. Observar y rechazar deben incluir mensaje para que el usuario sepa qué corregir o por qué se cerró.'},
    {sel:'.tabs',title:'Acciones posteriores',body:'Después de validar se habilitan factura interna, contrato, gastos, liquidación, control total y preparación de DELSOL.'},
    {sel:'#panel-delsol',title:'DELSOL desacoplado',body:'La Bonita guarda todo primero en su base. DELSOL se usa como sincronización externa. La factura fiscal y su numeración definitiva deben salir de DELSOL.'},
    {sel:'.actions',title:'Exportaciones y prueba',body:'Usá los CSV, PDFs y el plan de prueba para revisar el circuito antes de subirlo al servidor.'}
  ];
  const artistSteps = [
    {sel:'.hero',title:'Portal de usuario/artista',body:'Este portal es para cargar planillas, enviarlas a revisión, ver mensajes de administración y descargar documentos propios.'},
    {sel:'#newType',title:'Tipo de planilla',body:'La petición siempre nace desde una planilla real: Alta + Factura, Servicio Puntual, Contrato de Formación o Persona Asociada.'},
    {sel:'#requiredText',title:'Completitud',body:'El usuario puede guardar o enviar aunque falten datos. El sistema informa qué falta y administración no puede aprobar hasta completar.'},
    {sel:'#sourceLink',title:'Documentos fuente',body:'Acá se abren los PDF originales y documentación PRL de referencia.'},
    {sel:'#formContainer',title:'Carga de datos',body:'Los campos pedidos corresponden a las planillas. Los marcados con asterisco son obligatorios para aprobación final.'},
    {sel:'#btnSave',title:'Guardar borrador',body:'Guarda la planilla para continuar luego.'},
    {sel:'#btnSubmit',title:'Enviar a revisión',body:'Manda la petición a administración. Si falta información puede volver observada con mensaje.'},
    {sel:'table',title:'Mis peticiones',body:'El usuario solo ve sus propias peticiones, estados, observaciones y rechazos.'},
    {sel:'#detailCard',title:'Detalle y descarga',body:'Al seleccionar una petición puede ver el estado, mensajes y descargar la planilla completada en PDF.'},
    {sel:'#btnDownload',title:'PDF completado',body:'Cuando haya una petición seleccionada, este botón descarga la planilla con los datos cargados.'}
  ];
  const steps = isAdmin ? adminSteps : isArtist ? artistSteps : [];
  if(!steps.length) return;

  let index=0, overlay, spot, card;
  function qs(sel){ try{return document.querySelector(sel)}catch{return null} }
  function ensureHelp(){
    if(document.querySelector('.tutorial-help-btn')) return;
    const b=document.createElement('button');
    b.className='tutorial-help-btn';
    b.type='button';
    b.innerHTML='🧭 Modo tutorial';
    b.addEventListener('click',()=>start());
    document.body.appendChild(b);
  }
  function place(target){
    const rect = target ? target.getBoundingClientRect() : {left:24,top:120,width:260,height:80,right:284,bottom:200};
    const pad=8;
    spot.style.left=Math.max(8,rect.left-pad)+'px';
    spot.style.top=Math.max(8,rect.top-pad)+'px';
    spot.style.width=Math.max(80,rect.width+pad*2)+'px';
    spot.style.height=Math.max(46,rect.height+pad*2)+'px';
    const cw=430, ch=250, gap=18;
    let left = rect.right + gap;
    let top = rect.top;
    if(left + cw > innerWidth - 16) left = Math.max(16, rect.left - cw - gap);
    if(left < 16) left = 16;
    if(top + ch > innerHeight - 16) top = Math.max(16, innerHeight - ch - 16);
    card.style.left=left+'px'; card.style.top=top+'px';
  }
  function render(){
    const step=steps[index];
    const target=qs(step.sel);
    if(target){
      target.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});
      target.classList.add('tutorial-pulse');
      setTimeout(()=>place(target),260);
    } else setTimeout(()=>place(null),50);
    card.innerHTML=`<h3>${step.title}</h3><p>${step.body}</p><div class="tutorial-progress">Paso ${index+1} de ${steps.length}</div><div class="tutorial-actions"><button type="button" class="ghost" data-act="close">Cerrar</button><button type="button" data-act="prev" ${index===0?'disabled':''}>Anterior</button><button type="button" class="primary" data-act="next">${index===steps.length-1?'Finalizar':'Siguiente'}</button></div>`;
    card.querySelector('[data-act="close"]').onclick=close;
    card.querySelector('[data-act="prev"]').onclick=()=>{ if(index>0){ clearPulse(); index--; render(); }};
    card.querySelector('[data-act="next"]').onclick=()=>{ clearPulse(); if(index<steps.length-1){ index++; render(); } else close(); };
  }
  function clearPulse(){document.querySelectorAll('.tutorial-pulse').forEach(x=>x.classList.remove('tutorial-pulse'))}
  function start(){
    close(false); index=0;
    overlay=document.createElement('div'); overlay.className='tutorial-overlay';
    spot=document.createElement('div'); spot.className='tutorial-spotlight';
    card=document.createElement('div'); card.className='tutorial-card';
    document.body.append(overlay,spot,card); render();
  }
  function close(removePulse=true){
    if(removePulse) clearPulse();
    [overlay,spot,card].forEach(el=>el&&el.remove()); overlay=spot=card=null;
  }
  window.LaBonitaTutorial={start};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.addEventListener('DOMContentLoaded',ensureHelp);
  if(document.readyState!=='loading') ensureHelp();
})();
