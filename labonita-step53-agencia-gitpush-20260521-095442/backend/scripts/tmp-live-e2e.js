const assert=require('assert');
const base='http://127.0.0.1:3001';
async function req(path,opts={}){const r=await fetch(base+path,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});const t=await r.text();let b=null;try{b=t?JSON.parse(t):null}catch{b=t}return {status:r.status,body:b,cookie:r.headers.get('set-cookie')||''};}
async function login(){const r=await req('/api/auth/login',{method:'POST',body:JSON.stringify({email:'admin@test.com',password:'123456'})});assert.equal(r.status,200);return r.cookie.split(';')[0];}
(async()=>{
 const admin=await login();
 const status=await req('/api/admin/delsol/status',{headers:{Cookie:admin}});
 console.log('status',status.status,{mode:status.body.mode,write_enabled:status.body.write_enabled});
 const read=await req('/api/admin/delsol/test-read',{method:'POST',headers:{Cookie:admin},body:JSON.stringify({tabla:'F_FAC',codigo:207})});
 console.log('read',read.status,read.body?.respuesta||read.body?.error);
 const write=await req('/api/admin/delsol/test-write',{method:'POST',headers:{Cookie:admin},body:JSON.stringify({tabla:'F_FAC'})});
 console.log('write',write.status,write.body?.respuesta||write.body?.error);

 const ref='LIVE-'+Date.now();
 const create=await req('/api/admin/ops/petitions',{method:'POST',headers:{Cookie:admin},body:JSON.stringify({type:'ALTA_FACTURA',form_template:'ALTA_FACTURA',reference:ref,petition_date:'2026-05-18',responsible_name:'Admin Live',company_show:'LB Live',pais_ciudad_actuacion:'Madrid, ES',fecha_inicio_actuacion:'2026-05-21',client_name:'Cliente Live SL',client_tax_id:'B12345678',factura_direccion:'Calle 1',factura_cp:'28001',factura_ciudad:'Madrid',factura_pais:'Espana',factura_concepto:'Servicio live',factura_total_sin_iva:100,iva_tipo:'21%'})});
 assert.equal(create.status,201);
 const pid=create.body.id;
 await req(`/api/admin/ops/petitions/${pid}/validate`,{method:'POST',headers:{Cookie:admin},body:'{}'});
 await req(`/api/admin/ops/petitions/${pid}/laboral`,{method:'POST',headers:{Cookie:admin},body:JSON.stringify({person_name:'Admin Live',person_tax_id:'12345678A',start_date:'2026-05-21',end_date:'2026-05-21',requires_a1:'NO'})});
 const inv=await req(`/api/admin/ops/petitions/${pid}/invoices`,{method:'POST',headers:{Cookie:admin},body:JSON.stringify({concept:'Servicio live',subtotal:100,iva_rate:21,commission_rate:6,irpf_rate:2})});
 assert.equal(inv.status,201);
 const liq=await req(`/api/admin/ops/petitions/${pid}/liquidations`,{method:'POST',headers:{Cookie:admin},body:JSON.stringify({person_name:'Admin Live',person_tax_id:'12345678A',gross_amount:121,expense_reimbursements:0})});
 assert.equal(liq.status,201);

 const process=await req('/api/admin/delsol/queue/process',{method:'POST',headers:{Cookie:admin},body:JSON.stringify({limit:20})});
 console.log('queue_process',process.status,process.body?.processed,process.body?.results?.slice(0,3));
 const detail=await req(`/api/admin/ops/petitions/${pid}`,{headers:{Cookie:admin}});
 console.log('detail',detail.status,{petition_status:detail.body?.petition?.status,queue:detail.body?.queue?.map(q=>({id:q.id,status:q.status,error:q.last_error})).slice(0,5)});
})();
