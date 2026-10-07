const { query } = require('../config/db');

/**
 * Normalizes identifier values to canonical representations
 */
function normalizeIdentifier(type, rawValue) {
  if (!rawValue) return '';
  const trimmed = String(rawValue).trim();

  switch (type.toUpperCase()) {
    case 'PHONE': {
      let digits = trimmed.replace(/[^0-9+]/g, '');
      if (digits.startsWith('+91')) {
        return digits;
      } else if (digits.length === 10) {
        return `+91${digits}`;
      } else if (digits.startsWith('0') && digits.length === 11) {
        return `+91${digits.substring(1)}`;
      }
      return digits.startsWith('+') ? digits : `+${digits}`;
    }

    case 'UPI':
      return trimmed.toLowerCase();

    case 'DOMAIN': {
      let clean = trimmed.toLowerCase();
      clean = clean.replace(/^https?:\/\//i, '');
      clean = clean.replace(/\/.*$/, ''); // strip path
      clean = clean.replace(/:\d+$/, ''); // strip port
      return clean;
    }

    case 'BANK_ACCOUNT': {
      // If already formatted as ACC@IFSC
      if (trimmed.includes('@')) {
        return trimmed.toUpperCase();
      }
      return trimmed.toUpperCase();
    }

    case 'EMAIL':
      return trimmed.toLowerCase();

    default:
      return trimmed;
  }
}

/**
 * Upserts canonical identifier and updates last_seen_at
 */
async function upsertIdentifier(type, rawValue, details = {}) {
  const normType = type.toUpperCase();
  const canonicalValue = normalizeIdentifier(normType, rawValue);

  if (!canonicalValue) {
    throw new Error(`Invalid identifier value for type ${type}`);
  }

  // 1. Upsert into identifiers table
  const upsertQuery = `
    INSERT INTO identifiers (type, value, first_seen_at, last_seen_at, risk_weight)
    VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3)
    ON CONFLICT (type, value) DO UPDATE 
    SET last_seen_at = CURRENT_TIMESTAMP
    RETURNING identifier_id, type, value, first_seen_at, last_seen_at, risk_weight;
  `;
  const weight = details.riskWeight || 1.00;
  const res = await query(upsertQuery, [normType, canonicalValue, weight]);
  const identifier = res.rows[0];
  const identId = identifier.identifier_id;

  // 2. Upsert into specialized subtype table
  try {
    if (normType === 'PHONE') {
      const carrier = details.carrier || 'Unknown Carrier';
      const isVoip = details.isVoip || false;
      await query(`
        INSERT INTO phone_numbers (identifier_id, phone_number, country_code, carrier_name, is_voip)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (phone_number) DO NOTHING;
      `, [identId, canonicalValue, canonicalValue.substring(0, 3), carrier, isVoip]);
    } else if (normType === 'UPI') {
      const handleBank = details.handleBank || (canonicalValue.split('@')[1] || 'Unknown');
      const provider = details.provider || 'UPI';
      await query(`
        INSERT INTO upi_ids (identifier_id, upi_address, handle_bank, vpa_provider)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (upi_address) DO NOTHING;
      `, [identId, canonicalValue, handleBank, provider]);
    } else if (normType === 'BANK_ACCOUNT') {
      let accNum = details.accountNumber;
      let ifsc = details.ifsc || 'UNKNOWN';
      if (!accNum && canonicalValue.includes('@')) {
        [accNum, ifsc] = canonicalValue.split('@');
      } else if (!accNum) {
        accNum = canonicalValue;
      }
      const bankName = details.bankName || 'Scheduled Commercial Bank';
      const branchName = details.branchName || 'Main Branch';

      await query(`
        INSERT INTO bank_accounts (identifier_id, account_number, ifsc_code, bank_name, branch_name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (account_number, ifsc_code) DO NOTHING;
      `, [identId, accNum, ifsc, bankName, branchName]);
    } else if (normType === 'DOMAIN') {
      const registrar = details.registrar || 'Public Registrar';
      const tld = canonicalValue.split('.').pop() || 'com';
      await query(`
        INSERT INTO domains (identifier_id, domain_name, registrar, tld)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (domain_name) DO NOTHING;
      `, [identId, canonicalValue, registrar, tld]);
    }
  } catch (subErr) {
    console.warn(`[Identifier Service] Sub-entity record warning for ${normType} (${canonicalValue}):`, subErr.message);
  }

  return identifier;
}

/**
 * Links an identifier to a complaint
 */
async function linkIdentifierToComplaint(complaintId, identifierId, options = {}) {
  const roleInFraud = options.roleInFraud || 'BENEFICIARY';
  const confidenceScore = options.confidenceScore ?? 1.00;
  const extractedBy = options.extractedBy || 'MANUAL';

  const linkQuery = `
    INSERT INTO complaint_identifiers (complaint_id, identifier_id, role_in_fraud, confidence_score, extracted_by)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (complaint_id, identifier_id) DO UPDATE
    SET role_in_fraud = EXCLUDED.role_in_fraud,
        confidence_score = EXCLUDED.confidence_score
    RETURNING id, complaint_id, identifier_id, role_in_fraud, confidence_score;
  `;
  const res = await query(linkQuery, [complaintId, identifierId, roleInFraud, confidenceScore, extractedBy]);
  return res.rows[0];
}

/**
 * Gets all identifiers linked to a complaint with their rich subtype attributes
 */
async function getComplaintIdentifiers(complaintId) {
  const sql = `
    SELECT 
      ci.id as link_id,
      ci.role_in_fraud,
      ci.confidence_score,
      ci.extracted_by,
      i.identifier_id,
      i.type,
      i.value,
      i.first_seen_at,
      i.last_seen_at,
      p.carrier_name,
      p.is_flagged_spammer,
      u.handle_bank,
      u.vpa_provider,
      b.account_number,
      b.ifsc_code,
      b.bank_name,
      d.registrar,
      d.ip_address as domain_ip,
      (SELECT COUNT(DISTINCT ci2.complaint_id) 
       FROM complaint_identifiers ci2 
       WHERE ci2.identifier_id = i.identifier_id AND ci2.complaint_id != ci.complaint_id) as cross_complaint_count
    FROM complaint_identifiers ci
    JOIN identifiers i ON ci.identifier_id = i.identifier_id
    LEFT JOIN phone_numbers p ON i.identifier_id = p.identifier_id
    LEFT JOIN upi_ids u ON i.identifier_id = u.identifier_id
    LEFT JOIN bank_accounts b ON i.identifier_id = b.identifier_id
    LEFT JOIN domains d ON i.identifier_id = d.identifier_id
    WHERE ci.complaint_id = $1
    ORDER BY ci.id ASC;
  `;
  const res = await query(sql, [complaintId]);
  return res.rows;
}

module.exports = {
  normalizeIdentifier,
  upsertIdentifier,
  linkIdentifierToComplaint,
  getComplaintIdentifiers
};
