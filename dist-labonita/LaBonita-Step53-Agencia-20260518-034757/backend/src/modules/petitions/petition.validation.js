const { PETITION_TYPES } = require('./petition.schemas');

function getByPath(obj, path) {
  const parts = String(path || '').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function isMissingValue(value, field) {
  const type = field?.type || 'string';

  if (type === 'boolean') {
    if (field?.mustBeTrue) return value !== true;
    return value !== true && value !== false;
  }

  if (value === null || value === undefined) return true;

  if (type === 'number') {
    if (typeof value !== 'number') return true;
    return Number.isNaN(value);
  }

  if (typeof value === 'string') return value.trim() === '';
  return false;
}

function normalizeType(type) {
  return String(type || '').trim().toUpperCase();
}

function getSchema(type) {
  const t = normalizeType(type);
  return PETITION_TYPES[t] || null;
}

/**
 * Returns { missingFields: [{path,label}], missingDocs: [{doc_type}], ruleErrors: [{code,message}] }
 */
function computeChecklist({ type, data, docsByType }) {
  const schema = getSchema(type);
  if (!schema) {
    return {
      missingFields: [{ path: 'type', label: 'Tipo de petición inválido' }],
      missingDocs: [],
      ruleErrors: [],
    };
  }

  const missingFields = [];
  for (const f of schema.fields) {
    if (f && f.required === false) continue;
    const v = getByPath(data, f.path);
    if (isMissingValue(v, f)) missingFields.push({ path: f.path, label: f.label });
  }

  const requiredDocs = Array.isArray(schema.docs) ? schema.docs : [];
  const missingDocs = [];
  for (const dt of requiredDocs) {
    if (!docsByType.has(dt)) missingDocs.push({ doc_type: dt });
  }

  const ruleErrors = [];
  const extraIssues = typeof schema.customValidate === 'function' ? schema.customValidate(data || {}) : [];
  for (const i of extraIssues) {
    if (i.kind === 'field') missingFields.push({ path: i.path, label: i.label });
    else if (i.kind === 'doc') {
      if (!docsByType.has(i.doc_type)) missingDocs.push({ doc_type: i.doc_type });
    } else if (i.kind === 'rule') ruleErrors.push({ code: i.code, message: i.message });
  }

  return { missingFields, missingDocs, ruleErrors };
}

module.exports = {
  PETITION_TYPES,
  normalizeType,
  getSchema,
  computeChecklist,
};
