/**
 * Petition schemas (must match client PDFs).
 *
 * - fields: form fields displayed to the artist (paths live inside petitions.data JSON)
 * - docs: required document "doc_type" per petition (plus conditional docs via customValidate)
 * - customValidate: conditional rules (fields/docs) + business rules (e.g. 10-day training notice)
 *
 * Field format:
 *   { path, label, type?: 'string'|'number'|'boolean', required?: boolean }
 *
 * Note: required defaults to true. Set required:false for optional PDF fields.
 */
function normalizeCountry(c){
  const s=String(c||'').toUpperCase().trim();
  if (['ES','ESP','ESPAÑA','SPAIN'].includes(s)) return 'ES';
  if (s.length===2) return s;
  return s;
}

function invoiceCountryValidate(data){
  const payload = data?.payload || data || {};
  const inv = payload.invoice || {};
  const c = normalizeCountry(inv.country || inv.pais);
  const issues=[];
  if (!String(inv.country || inv.pais || '').trim()) issues.push({ kind:'rule', code:'INVOICE_COUNTRY_REQUIRED', message:'Falta país en datos de factura' });
  if (!String(inv.razon_social || inv.legal_name || '').trim()) issues.push({ kind:'rule', code:'INVOICE_LEGAL_NAME_REQUIRED', message:'Falta razón social en datos de factura' });
  if (c==='ES'){
    if (!String(inv.vat || inv.nif || '').trim()) issues.push({ kind:'rule', code:'INVOICE_VAT_REQUIRED', message:'Falta NIF/VAT (España)' });
    if (!String(inv.address || inv.direccion || '').trim()) issues.push({ kind:'rule', code:'INVOICE_ADDRESS_REQUIRED', message:'Falta dirección (España)' });
    if (!String(inv.city || inv.ciudad || '').trim()) issues.push({ kind:'rule', code:'INVOICE_CITY_REQUIRED', message:'Falta ciudad (España)' });
    if (!String(inv.postal_code || inv.cp || inv.codigo_postal || '').trim()) issues.push({ kind:'rule', code:'INVOICE_POSTAL_REQUIRED', message:'Falta código postal (España)' });
  }
  return issues;
}

const PETITION_TYPES = {
  ONBOARDING_ASSOCIADO: {
    label: 'Onboarding Persona Asociada',
    steps: [
      { key:'perfil', title:'Perfil', icon:'fa-solid fa-user', fieldPrefixes:['personal.','contact.'], docs:['DNI'] },
      { key:'fiscal', title:'Fiscal', icon:'fa-solid fa-file-invoice', fieldPrefixes:['irpf.','tax.'], docs:[] },
      { key:'banco', title:'Banco', icon:'fa-solid fa-building-columns', fieldPrefixes:['bank.'], docs:[] },
      { key:'otros', title:'Otros', icon:'fa-solid fa-folder-open', fieldPrefixes:[], docs:[] }
    ],
    docsByStep: { perfil: ['DNI'], fiscal: [], banco: [], otros: [] },
    fields: [
      // Datos personales
      { path: 'personal.full_name', label: 'Nombre y apellidos' },
      { path: 'personal.birth_date', label: 'Fecha de nacimiento' },
      { path: 'personal.estado_civil', label: 'Estado civil' },
      { path: 'personal.profession', label: 'Profesión' },

      { path: 'personal.address.street', label: 'Domicilio (calle)' },
      { path: 'personal.address.number', label: 'Domicilio (número)' },
      { path: 'personal.address.floor', label: 'Domicilio (piso)', required: false },
      { path: 'personal.address.door', label: 'Domicilio (puerta)', required: false },
      { path: 'personal.address.postal_code', label: 'Código postal' },
      { path: 'personal.address.city', label: 'Ciudad / localidad' },
      { path: 'personal.address.province', label: 'Provincia' },
      { path: 'personal.address.country', label: 'País', required: false },

      { path: 'personal.tax_id', label: 'DNI / NIE' },
      { path: 'personal.ss_number', label: 'Número seguridad social' },
      { path: 'personal.phone', label: 'Teléfono' },
      { path: 'personal.email_personal', label: 'Mail personal' },
      { path: 'personal.email_company', label: 'Mail compañía (si aplica)', required: false },

      // Cálculo IRPF
      { path: 'irpf.situation_option', label: 'Situación familiar (opción 1/2/3)' },
      { path: 'irpf.spouse_tax_id', label: 'DNI/NIE de la pareja (si opción 2)', required: false },
      { path: 'irpf.disability', label: 'Discapacidad reconocida', type: 'boolean', required: false },
      { path: 'irpf.disability_grade', label: 'Grado de discapacidad', required: false },
      { path: 'irpf.has_other_descendants', label: 'Otros descendientes a cargo', type: 'boolean', required: false },
      { path: 'irpf.ascendants_over_65', label: 'Ascendientes mayores de 65 años', type: 'boolean', required: false },

      // Ingresos (IRPF)
      { path: 'irpf.income.salary_ytd', label: 'Salario desde enero hasta hoy (€)', type: 'number' },
      { path: 'irpf.income.salary_forecast', label: 'Estimación salario desde hoy hasta diciembre (€)', type: 'number' },
      { path: 'irpf.income.other_employers', label: '¿Recibirás salarios de otras empresas?', type: 'boolean' },
      { path: 'irpf.income.unemployment_benefit', label: '¿Has cobrado el paro este año?', type: 'boolean' },

      // Domiciliación bancaria
      { path: 'bank.bank_name', label: 'Banco / Caja' },
      { path: 'bank.iban', label: 'IBAN' },

      // RGPD + cuotas + firma
      { path: 'legal.rgpd_accept', label: 'Acepto RGPD', type: 'boolean', mustBeTrue: true },
      { path: 'legal.bank_debit_authorize', label: 'Autorizo domiciliación de cuota anual', type: 'boolean', mustBeTrue: true },

      { path: 'signature.place', label: 'Lugar de firma' },
      { path: 'signature.date', label: 'Fecha de firma' },
      { path: 'signature.name', label: 'Firma (nombre y apellidos)' },
    ],
    docs: ['DNI'],
    customValidate: (data) => {
      const issues = [];

      const opt = String(data?.irpf?.situation_option || '').trim();
      const children = Array.isArray(data?.irpf?.children) ? data.irpf.children : [];
      const otherDesc = Array.isArray(data?.irpf?.other_descendants) ? data.irpf.other_descendants : [];

      const childOk = (c) => c && String(c.full_name || '').trim() && Number(c.birth_year);
      const descOk = (d) => d && String(d.full_name || '').trim() && Number(d.birth_year);

      if (opt === '1') {
        if (children.length === 0) issues.push({ kind: 'rule', code: 'IRPF_CHILDREN_REQUIRED', message: 'Opción 1: Debes cargar los datos de hijos/as menores (nombre y año de nacimiento).' });
        if (children.some((c) => !childOk(c))) issues.push({ kind: 'rule', code: 'IRPF_CHILDREN_INCOMPLETE', message: 'Hay hijos/as con datos incompletos (nombre y año de nacimiento).' });
      } else if (opt === '2') {
        if (!String(data?.irpf?.spouse_tax_id || '').trim()) issues.push({ kind: 'field', path: 'irpf.spouse_tax_id', label: 'DNI/NIE de la pareja (opción 2)' });
      } else if (opt === '3') {
        if (children.length > 0 && children.some((c) => !childOk(c))) issues.push({ kind: 'rule', code: 'IRPF_CHILDREN_INCOMPLETE', message: 'Hay hijos/as con datos incompletos (nombre y año de nacimiento).' });
      } else {
        issues.push({ kind: 'field', path: 'irpf.situation_option', label: 'Situación familiar (opción 1/2/3)' });
      }

      if (data?.irpf?.disability === true && !String(data?.irpf?.disability_grade || '').trim()) {
        issues.push({ kind: 'field', path: 'irpf.disability_grade', label: 'Grado de discapacidad' });
      }

      if (otherDesc.length > 0 && otherDesc.some((d) => !descOk(d))) {
        issues.push({ kind: 'rule', code: 'IRPF_DESC_INCOMPLETE', message: 'Otros descendientes: faltan datos (nombre y año de nacimiento).' });
      }

      return issues;
    },
  },

  ONBOARDING_PUNTUAL: {
    label: 'Onboarding Servicio Puntual',
    steps: [
      { key:'perfil', title:'Perfil', icon:'fa-solid fa-user', fieldPrefixes:['personal.','contact.'], docs:['DNI'] },
      { key:'fiscal', title:'Fiscal', icon:'fa-solid fa-file-invoice', fieldPrefixes:['irpf.','tax.'], docs:[] },
      { key:'banco', title:'Banco', icon:'fa-solid fa-building-columns', fieldPrefixes:['bank.'], docs:[] },
      { key:'otros', title:'Otros', icon:'fa-solid fa-folder-open', fieldPrefixes:[], docs:[] }
    ],
    docsByStep: { perfil: ['DNI'], fiscal: [], banco: [], otros: [] },
    fields: [
      // Datos personales (mismo set)
      { path: 'personal.full_name', label: 'Nombre y apellidos' },
      { path: 'personal.birth_date', label: 'Fecha de nacimiento' },
      { path: 'personal.estado_civil', label: 'Estado civil' },
      { path: 'personal.profession', label: 'Profesión' },

      { path: 'personal.address.street', label: 'Domicilio (calle)' },
      { path: 'personal.address.number', label: 'Domicilio (número)' },
      { path: 'personal.address.floor', label: 'Domicilio (piso)', required: false },
      { path: 'personal.address.door', label: 'Domicilio (puerta)', required: false },
      { path: 'personal.address.postal_code', label: 'Código postal' },
      { path: 'personal.address.city', label: 'Ciudad / localidad' },
      { path: 'personal.address.province', label: 'Provincia' },
      { path: 'personal.address.country', label: 'País', required: false },

      { path: 'personal.tax_id', label: 'DNI / NIE' },
      { path: 'personal.ss_number', label: 'Número seguridad social' },
      { path: 'personal.phone', label: 'Teléfono' },
      { path: 'personal.email_personal', label: 'Mail personal' },
      { path: 'personal.email_company', label: 'Mail compañía (si aplica)', required: false },

      // IRPF / situación familiar
      { path: 'irpf.situation_option', label: 'Situación familiar (opción 1/2/3)' },
      { path: 'irpf.spouse_tax_id', label: 'DNI/NIE de la pareja (si opción 2)', required: false },

      // Retención (por defecto 2% si no se indica)
      { path: 'fiscal.irpf_rate', label: 'IRPF deseado (%) (opcional)', type: 'number', required: false },

      // Situación puntual (casos)
      { path: 'puntual.case', label: '¿Cuál es tu situación? (caso)' },
      { path: 'puntual.case_other', label: 'Explicación (si no encaja en ningún caso)', required: false },

      { path: 'puntual.accompanies_socio', label: '¿A qué socio acompañas? (si aplica)', required: false },
      { path: 'puntual.is_unemployment_or_special', label: '¿Cobras el paro o situación especial?', type: 'boolean' },
      { path: 'puntual.special_explain', label: 'Explicación de situación especial', required: false },

      // Datos bancarios
      { path: 'bank.bank_name', label: 'Nombre del banco' },
      { path: 'bank.iban', label: 'Número de cuenta / IBAN' },

      // RGPD + firma
      { path: 'legal.rgpd_accept', label: 'Acepto RGPD', type: 'boolean', mustBeTrue: true },
      { path: 'signature.place', label: 'Lugar de firma' },
      { path: 'signature.date', label: 'Fecha de firma' },
      { path: 'signature.name', label: 'Firma (nombre y apellidos)' },
    ],
    docs: ['DNI'],
    customValidate: (data) => {
      const issues = [];

      const opt = String(data?.irpf?.situation_option || '').trim();
      const children = Array.isArray(data?.irpf?.children) ? data.irpf.children : [];

      const childOk = (c) => c && String(c.full_name || '').trim() && Number(c.birth_year);

      if (opt === '1') {
        if (children.length === 0) issues.push({ kind: 'rule', code: 'IRPF_CHILDREN_REQUIRED', message: 'Opción 1: Debes cargar los datos de hijos/as menores (nombre y año de nacimiento).' });
        if (children.some((c) => !childOk(c))) issues.push({ kind: 'rule', code: 'IRPF_CHILDREN_INCOMPLETE', message: 'Hay hijos/as con datos incompletos (nombre y año de nacimiento).' });
      } else if (opt === '2') {
        if (!String(data?.irpf?.spouse_tax_id || '').trim()) issues.push({ kind: 'field', path: 'irpf.spouse_tax_id', label: 'DNI/NIE de la pareja (opción 2)' });
      } else if (opt === '3') {
        if (children.length > 0 && children.some((c) => !childOk(c))) issues.push({ kind: 'rule', code: 'IRPF_CHILDREN_INCOMPLETE', message: 'Hay hijos/as con datos incompletos (nombre y año de nacimiento).' });
      } else {
        issues.push({ kind: 'field', path: 'irpf.situation_option', label: 'Situación familiar (opción 1/2/3)' });
      }

      const c = String(data?.puntual?.case || '').trim();
      if (!c) issues.push({ kind: 'field', path: 'puntual.case', label: '¿Cuál es tu situación? (caso)' });

      if (c === 'OTRO' && !String(data?.puntual?.case_other || '').trim()) {
        issues.push({ kind: 'field', path: 'puntual.case_other', label: 'Explicación (si no encaja en ningún caso)' });
      }

      if (data?.puntual?.is_unemployment_or_special === true && !String(data?.puntual?.special_explain || '').trim()) {
        issues.push({ kind: 'field', path: 'puntual.special_explain', label: 'Explicación de situación especial' });
      }

      return issues;
    },
  },


  PRESUPUESTO: {
    label: 'Presupuesto',
    fields: [
      { path: 'request.date', label: 'Fecha petición', required: false },
      { path: 'request.responsible_name', label: 'Nombre del socio / responsable de la compañía' },
      { path: 'event.company_show', label: 'Compañía + espectáculo' },
      { path: 'event.reference', label: 'Referencia (proyecto/bolo)' },
      { path: 'event.country', label: 'País' },
      { path: 'event.city', label: 'Ciudad' },
      { path: 'event.dates_text', label: 'Fecha/s (texto)' },

      // Datos de presupuesto (cliente)
      { path: 'budget.client_name', label: 'Cliente / empresa (nombre)', required: false },
      { path: 'budget.contact_email', label: 'Email contacto (opcional)', required: false },
      { path: 'budget.concept', label: 'Concepto / descripción', required: false },
      { path: 'budget.amount_without_vat', label: 'Importe estimado (sin IVA)', type: 'number' },
      { path: 'budget.vat_type', label: 'Tipo de IVA (estimado)', required: false },

      { path: 'comments', label: 'Comentarios / aclaraciones', required: false },
    ],
    docs: [],
    customValidate: (data) => {
      const issues = [];
      if (!String(data?.event?.reference || '').trim()) {
        issues.push({ kind: 'field', path: 'event.reference', label: 'Referencia (proyecto/bolo)' });
      }
      if (!String(data?.event?.country || '').trim()) {
        issues.push({ kind: 'field', path: 'event.country', label: 'País' });
      }
      if (!String(data?.event?.city || '').trim()) {
        issues.push({ kind: 'field', path: 'event.city', label: 'Ciudad' });
      }
      const amt = Number(data?.budget?.amount_without_vat);
      if (!(amt > 0)) {
        issues.push({ kind: 'field', path: 'budget.amount_without_vat', label: 'Importe estimado (sin IVA)' });
      }
      return issues;
    },
  },

  ALTA_FACTURA: {
    label: 'Petición Alta + Factura Puntual',
    fields: [
      { path: 'request.date', label: 'Fecha petición', required: false },
      { path: 'request.responsible_name', label: 'Nombre del socio / responsable de la compañía' },
      { path: 'event.company_show', label: 'Compañía + espectáculo' },
      { path: 'event.reference', label: 'Referencia de la actuación (proyecto/bolo)' },
      { path: 'event.country', label: 'País de la actuación' },
      { path: 'event.city', label: 'Ciudad de la actuación' },
      { path: 'event.dates_text', label: 'Fecha/s de la actuación/es (texto)' },

      { path: 'travel.ida_date', label: 'Viaje ida (si aplica)', required: false },
      { path: 'travel.vuelta_date', label: 'Viaje vuelta (si aplica)', required: false },

      { path: 'companions.external_invoice', label: '¿Te acompaña alguien que nos facturará y está de alta con otra empresa?', type: 'boolean', required: false },
      { path: 'companions.external_invoice_cache', label: 'Caché de esa persona (€)', type: 'number', required: false },

      { path: 'companions.non_labonita', label: '¿Te acompaña alguien que quieres que demos de alta y no es de LaBonita?', type: 'boolean', required: false },
      { path: 'companions.non_labonita_cache', label: 'Caché de esa persona (€)', type: 'number', required: false },
      { path: 'companions.non_labonita_retention_included', label: '¿La retención está incluida en el caché?', type: 'boolean', required: false },

      // Datos para la factura
      { path: 'invoice.razon_social', label: 'Razón social' },
      { path: 'invoice.tax_id', label: 'Número fiscal (NIF/VAT)' },
      { path: 'invoice.vies', label: 'VIES (si aplica UE)', required: false },
      { path: 'invoice.address', label: 'Dirección' },
      { path: 'invoice.postal_code', label: 'Código postal' },
      { path: 'invoice.city', label: 'Ciudad' },
      { path: 'invoice.province', label: 'Provincia' },
      { path: 'invoice.country', label: 'País' },

      { path: 'invoice.concept', label: 'Concepto de la factura' },
      { path: 'invoice.amount_without_vat', label: 'Cantidad total a facturar (sin IVA)', type: 'number' },

      { path: 'vat.type', label: 'Tipo de IVA' },
      { path: 'vat.other', label: 'Otro tipo de IVA (si aplica)', required: false },

      // Reparto + gastos
      { path: 'reparto.is_group', label: '¿Es compañía/grupo?', type: 'boolean', required: false },

      { path: 'expenses.gastos_puntuales_total', label: 'Gastos puntuales (total con IVA)', type: 'number', required: false },
      { path: 'expenses.gastos_representacion_total', label: 'Gastos de representación (total con IVA)', type: 'number', required: false },

      { path: 'comments', label: 'Comentarios / aclaraciones', required: false },
    ],
    docs: [],
    customValidate: (data) => {
      const issues = [];

      const vatType = String(data?.vat?.type || '').trim();
      if (!vatType) issues.push({ kind: 'field', path: 'vat.type', label: 'Tipo de IVA' });

      if (vatType === 'EXENTO_UE_VIES' && !String(data?.invoice?.vies || '').trim()) {
        issues.push({ kind: 'field', path: 'invoice.vies', label: 'VIES (exento UE)' });
      }

      if (vatType === 'OTRO' && !String(data?.vat?.other || '').trim()) {
        issues.push({ kind: 'field', path: 'vat.other', label: 'Otro tipo de IVA' });
      }

      if (data?.companions?.external_invoice === true) {
        if (!(data?.companions?.external_invoice_cache > 0)) {
          issues.push({ kind: 'field', path: 'companions.external_invoice_cache', label: 'Caché del acompañante (factura otra empresa)' });
        }
        issues.push({ kind: 'doc', doc_type: 'ACOMPANANTE_ALTA' });
        issues.push({ kind: 'doc', doc_type: 'ACOMPANANTE_FACTURA' });
      }

      if (data?.companions?.non_labonita === true) {
        if (!(data?.companions?.non_labonita_cache > 0)) {
          issues.push({ kind: 'field', path: 'companions.non_labonita_cache', label: 'Caché del acompañante (alta LaBonita)' });
        }
        if (data?.companions?.non_labonita_retention_included !== true && data?.companions?.non_labonita_retention_included !== false) {
          issues.push({ kind: 'field', path: 'companions.non_labonita_retention_included', label: '¿La retención está incluida en el caché?' });
        }
        issues.push({ kind: 'doc', doc_type: 'DNI_ACOMPANANTE' });
        issues.push({ kind: 'doc', doc_type: 'FICHA_ACOMPANANTE' });
      }

      const gr = Number(data?.expenses?.gastos_representacion_total || 0);
      if (gr > 0) {
        issues.push({ kind: 'doc', doc_type: 'FACTURA_GASTOS_REPRESENTACION' });
      }

      // Reparto lines (si es grupo)
      if (data?.reparto?.is_group === true) {
        const lines = Array.isArray(data?.reparto?.lines) ? data.reparto.lines : [];
        if (lines.length === 0) {
          issues.push({ kind: 'rule', code: 'REPARTO_REQUIRED', message: 'Si es compañía/grupo, debes completar el reparto (caché por persona).' });
        } else {
          const bad = lines.some((l) => !String(l.name || '').trim() || !(Number(l.amount) > 0));
          if (bad) issues.push({ kind: 'rule', code: 'REPARTO_INCOMPLETE', message: 'Reparto: hay filas incompletas (nombre + importe).' });
        }
      }

      return issues;
    },
  },

  FORMACION: {
    label: 'Petición Contrato de Formación',
    fields: [
      { path: 'training.name', label: 'Nombre' },
      { path: 'training.education_level', label: 'Nivel de estudios' },
      { path: 'training.reference', label: 'Referencia' },

      { path: 'training.period_start', label: 'Periodo (inicio)' },
      { path: 'training.period_end', label: 'Periodo (fin)' },

      { path: 'training.class_type', label: 'Clases intensivas o regulares' },

      { path: 'training.weekdays.monday', label: 'Lunes', type: 'boolean', required: false },
      { path: 'training.weekdays.tuesday', label: 'Martes', type: 'boolean', required: false },
      { path: 'training.weekdays.wednesday', label: 'Miércoles', type: 'boolean', required: false },
      { path: 'training.weekdays.thursday', label: 'Jueves', type: 'boolean', required: false },
      { path: 'training.weekdays.friday', label: 'Viernes', type: 'boolean', required: false },
      { path: 'training.weekdays.saturday', label: 'Sábado', type: 'boolean', required: false },
      { path: 'training.weekdays.sunday', label: 'Domingo', type: 'boolean', required: false },

      { path: 'training.days_per_week', label: 'Días a la semana', type: 'number' },
      { path: 'training.class_time', label: 'Horario de las clases' },

      { path: 'training.hourly_rate', label: 'Importe por hora', type: 'number' },
      { path: 'training.rate_mode', label: '¿Es líquido o coste total?' },

      { path: 'training.venue_name', label: 'Lugar (nombre del centro)' },
      { path: 'training.venue_address', label: 'Dirección' },
      { path: 'training.venue_city', label: 'Ciudad' },

      { path: 'training.invoice_when', label: '¿Cuándo quieres la factura?' },
      { path: 'training.invoice_month', label: 'Mes (si aplica)', type: 'number', required: false },
      { path: 'training.invoice_quarter', label: 'Trimestre (si aplica)', type: 'number', required: false },

      // Datos para la factura
      { path: 'invoice.razon_social', label: 'Razón social' },
      { path: 'invoice.tax_id', label: 'Número fiscal (NIF/VAT)' },
      { path: 'invoice.vies', label: 'VIES (si aplica UE)', required: false },

      { path: 'invoice.address', label: 'Dirección' },
      { path: 'invoice.postal_code', label: 'Código postal' },
      { path: 'invoice.city', label: 'Ciudad' },
      { path: 'invoice.province', label: 'Provincia' },
      { path: 'invoice.country', label: 'País' },

      { path: 'invoice.concept', label: 'Concepto de la factura' },
      { path: 'invoice.total_amount', label: 'Cantidad total a facturar', type: 'number' },

      { path: 'training.notes', label: 'Explicaciones o aclaraciones', required: false },
    ],
    docs: [],
    customValidate: (data) => {
      const issues = [];

      // 10-day notice rule (period start)
      const start = data?.training?.period_start;
      if (start) {
        const startDate = new Date(start);
        const now = new Date();
        const diffMs = startDate.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 10) {
          issues.push({ kind: 'rule', code: 'TRAINING_10_DAYS', message: 'La formación debe solicitarse con al menos 10 días de antelación.' });
        }
      }

      // At least one weekday checked (recommended)
      const w = data?.training?.weekdays || {};
      const hasAnyWeekday = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].some((k) => w[k] === true);
      if (!hasAnyWeekday) {
        issues.push({ kind: 'rule', code: 'TRAINING_WEEKDAY_REQUIRED', message: 'Selecciona al menos un día de la semana para las clases.' });
      }

      const when = String(data?.training?.invoice_when || '').trim();
      if (when === 'MES') {
        if (!(Number(data?.training?.invoice_month) >= 1 && Number(data?.training?.invoice_month) <= 12)) {
          issues.push({ kind: 'field', path: 'training.invoice_month', label: 'Mes (1-12)' });
        }
      }
      if (when === 'TRIMESTRE') {
        if (!(Number(data?.training?.invoice_quarter) >= 1 && Number(data?.training?.invoice_quarter) <= 4)) {
          issues.push({ kind: 'field', path: 'training.invoice_quarter', label: 'Trimestre (1-4)' });
        }
      }

      return issues;
    },
  },
};

module.exports = { PETITION_TYPES };
