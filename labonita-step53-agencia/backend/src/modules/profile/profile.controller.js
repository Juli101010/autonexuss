const db = require('../../config/db');

function normalizeStr(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function isBlank(v) {
  return normalizeStr(v) === '';
}

function requireFields(profile, fiscal) {
  const missing = [];

  if (isBlank(profile.artist_name)) missing.push('Nombre artístico');
  if (isBlank(profile.legal_name)) missing.push('Nombre legal');
  if (isBlank(profile.phone)) missing.push('Teléfono');
  if (isBlank(profile.country)) missing.push('País');
  if (isBlank(fiscal.tax_id)) missing.push('NIF/NIE');
  if (isBlank(fiscal.residence_country)) missing.push('País residencia fiscal');
  if (isBlank(fiscal.bank_iban)) missing.push('IBAN');

  return missing;
}

function hasInvalidLength(value, max) {
  return normalizeStr(value).length > max;
}

function validateProfile(profile, fiscal) {
  const errors = [];

  if (hasInvalidLength(profile.artist_name, 120)) errors.push('El nombre artístico no puede superar 120 caracteres.');
  if (hasInvalidLength(profile.legal_name, 160)) errors.push('El nombre legal no puede superar 160 caracteres.');
  if (hasInvalidLength(profile.country, 80)) errors.push('El país no puede superar 80 caracteres.');

  if (!/^[0-9 +().-]{6,30}$/.test(profile.phone)) {
    errors.push('Ingresá un teléfono válido, con 6 a 30 caracteres.');
  }

  if (!/^[A-Za-z0-9 .-]{5,32}$/.test(fiscal.tax_id)) {
    errors.push('Ingresá un NIF/NIE válido.');
  }

  const iban = normalizeStr(fiscal.bank_iban).replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)) {
    errors.push('Ingresá un IBAN válido.');
  }

  if (!Number.isFinite(fiscal.irpf_rate) || fiscal.irpf_rate < 0 || fiscal.irpf_rate > 1) {
    errors.push('El IRPF debe ser un decimal entre 0 y 1. Ejemplo: 0.02 para 2%.');
  }

  return errors;
}

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await db.get(`SELECT * FROM profiles WHERE user_id = ?`, [userId]);
    const fiscal = await db.get(`SELECT * FROM fiscal_profiles WHERE user_id = ?`, [userId]);
    return res.json({ profile: profile || null, fiscal: fiscal || null });
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
};

exports.upsertMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profile = {}, fiscal = {} } = req.body || {};

    const pIn = {
      artist_name: normalizeStr(profile.artist_name),
      legal_name: normalizeStr(profile.legal_name),
      phone: normalizeStr(profile.phone),
      address_line1: normalizeStr(profile.address_line1) || null,
      address_line2: normalizeStr(profile.address_line2) || null,
      city: normalizeStr(profile.city) || null,
      region: normalizeStr(profile.region) || null,
      postal_code: normalizeStr(profile.postal_code) || null,
      country: normalizeStr(profile.country),
    };

    const rawIrpfRate = normalizeStr(fiscal.irpf_rate);
    const irpfRate = rawIrpfRate === '' ? 0.02 : Number(rawIrpfRate);
    const fIn = {
      tax_id: normalizeStr(fiscal.tax_id),
      vat_number: normalizeStr(fiscal.vat_number) || null,
      residence_country: normalizeStr(fiscal.residence_country),
      irpf_rate: Number.isFinite(irpfRate) ? irpfRate : NaN,
      bank_iban: normalizeStr(fiscal.bank_iban),
      bank_bic: normalizeStr(fiscal.bank_bic) || null,
      fiscal_address_line1: normalizeStr(fiscal.fiscal_address_line1) || null,
      fiscal_address_line2: normalizeStr(fiscal.fiscal_address_line2) || null,
      fiscal_city: normalizeStr(fiscal.fiscal_city) || null,
      fiscal_region: normalizeStr(fiscal.fiscal_region) || null,
      fiscal_postal_code: normalizeStr(fiscal.fiscal_postal_code) || null,
    };

    const missing = requireFields(pIn, fIn);
    if (missing.length) {
      return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}`, missing });
    }

    const validationErrors = validateProfile(pIn, fIn);
    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors.join(' '), errors: validationErrors });
    }

    await db.transaction(async () => {
      const p = await db.get(`SELECT id FROM profiles WHERE user_id = ?`, [userId]);
      if (p) {
        await db.run(
          `UPDATE profiles SET
            artist_name = ?, legal_name = ?, phone = ?,
            address_line1 = ?, address_line2 = ?, city = ?, region = ?, postal_code = ?, country = ?,
            updated_at = datetime('now')
          WHERE user_id = ?`,
          [
            pIn.artist_name,
            pIn.legal_name,
            pIn.phone,
            pIn.address_line1,
            pIn.address_line2,
            pIn.city,
            pIn.region,
            pIn.postal_code,
            pIn.country,
            userId,
          ]
        );
      } else {
        await db.run(
          `INSERT INTO profiles (
            user_id, artist_name, legal_name, phone,
            address_line1, address_line2, city, region, postal_code, country,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            userId,
            pIn.artist_name,
            pIn.legal_name,
            pIn.phone,
            pIn.address_line1,
            pIn.address_line2,
            pIn.city,
            pIn.region,
            pIn.postal_code,
            pIn.country,
          ]
        );
      }

      const f = await db.get(`SELECT id FROM fiscal_profiles WHERE user_id = ?`, [userId]);
      if (f) {
        await db.run(
          `UPDATE fiscal_profiles SET
            tax_id = ?, vat_number = ?, residence_country = ?,
            irpf_rate = ?, bank_iban = ?, bank_bic = ?,
            fiscal_address_line1 = ?, fiscal_address_line2 = ?, fiscal_city = ?, fiscal_region = ?, fiscal_postal_code = ?,
            updated_at = datetime('now')
          WHERE user_id = ?`,
          [
            fIn.tax_id,
            fIn.vat_number,
            fIn.residence_country,
            fIn.irpf_rate,
            fIn.bank_iban,
            fIn.bank_bic,
            fIn.fiscal_address_line1,
            fIn.fiscal_address_line2,
            fIn.fiscal_city,
            fIn.fiscal_region,
            fIn.fiscal_postal_code,
            userId,
          ]
        );
      } else {
        await db.run(
          `INSERT INTO fiscal_profiles (
            user_id, tax_id, vat_number, residence_country, irpf_rate,
            bank_iban, bank_bic,
            fiscal_address_line1, fiscal_address_line2, fiscal_city, fiscal_region, fiscal_postal_code,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            userId,
            fIn.tax_id,
            fIn.vat_number,
            fIn.residence_country,
            fIn.irpf_rate,
            fIn.bank_iban,
            fIn.bank_bic,
            fIn.fiscal_address_line1,
            fIn.fiscal_address_line2,
            fIn.fiscal_city,
            fIn.fiscal_region,
            fIn.fiscal_postal_code,
          ]
        );
      }
    });

    const profileOut = await db.get(`SELECT * FROM profiles WHERE user_id = ?`, [userId]);
    const fiscalOut = await db.get(`SELECT * FROM fiscal_profiles WHERE user_id = ?`, [userId]);

    return res.json({ profile: profileOut || null, fiscal: fiscalOut || null });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'DB error' });
  }
};
