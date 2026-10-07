const { query } = require('../config/db');
const { traverseNetwork } = require('../services/network.service');
const { logAuditEvent } = require('../services/audit.service');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Native deterministic fallback for entity extraction if AI microservice is not responding
 */
function localDeterministicExtract(text) {
  const entities = [];
  const seen = new Set();

  // Phone regex
  const phoneRegex = /(?:(?:\+91|91|0)[\s\-]?)?([6-9]\d{9})\b/g;
  let m;
  while ((m = phoneRegex.exec(text)) !== null) {
    const canonical = `+91${m[1]}`;
    if (!seen.has(canonical)) {
      seen.add(canonical);
      entities.push({
        type: 'PHONE',
        value: canonical,
        confidence: 1.0,
        role: 'COMMUNICATION_CHANNEL'
      });
    }
  }

  // UPI regex
  const upiRegex = /\b([a-zA-Z0-9.\-_]{2,64}@(?:okaxis|okhdfcbank|oksbi|okicici|paytm|ybl|axl|sbi|apl|upi|ibl|icici|barodampay|federal|kotak|postbank|[a-zA-Z]{2,30}))\b/gi;
  while ((m = upiRegex.exec(text)) !== null) {
    const val = m[1].toLowerCase();
    if (!seen.has(val)) {
      seen.add(val);
      entities.push({
        type: 'UPI',
        value: val,
        confidence: 0.98,
        role: 'BENEFICIARY'
      });
    }
  }

  // IFSC
  const ifscRegex = /\b([A-Z]{4}0[A-Z0-9]{6})\b/g;
  let foundIfsc = null;
  const ifscMatch = ifscRegex.exec(text);
  if (ifscMatch) {
    foundIfsc = ifscMatch[1].toUpperCase();
  }

  // Bank Account
  const bankRegex = /(?:a\/c|ac|acc|account|acct|beneficiary)?[\s:#\-_]*\b(\d{9,18})\b/gi;
  while ((m = bankRegex.exec(text)) !== null) {
    const digits = m[1];
    if (digits.length === 10 && seen.has(`+91${digits}`)) continue;
    const canonical = foundIfsc ? `${digits}@${foundIfsc}` : digits;
    if (!seen.has(canonical)) {
      seen.add(canonical);
      entities.push({
        type: 'BANK_ACCOUNT',
        value: canonical,
        confidence: foundIfsc ? 0.95 : 0.88,
        role: 'BENEFICIARY',
        meta: { ifsc: foundIfsc || 'UNKNOWN' }
      });
    }
  }

  // Domains
  const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.(?:com|org|net|xyz|top|in|co\.in|online|site|shop|vip|live|club|app|info|biz|tk|ml))\b/gi;
  while ((m = domainRegex.exec(text)) !== null) {
    const d = m[1].toLowerCase();
    if (!seen.has(d)) {
      seen.add(d);
      entities.push({
        type: 'DOMAIN',
        value: d,
        confidence: 0.96,
        role: 'PHISHING_PORTAL'
      });
    }
  }

  return entities;
}

/**
 * Proxy / Fallback Entity Extraction
 */
async function extractEntities(req, res) {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Complaint text must contain at least 5 characters' }
      });
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const json = await response.json();
        return res.json({ success: true, data: json });
      }
    } catch (netErr) {
      // AI Service offline -> fallback seamlessly to local extractor
    }

    const fallbackEntities = localDeterministicExtract(text);
    return res.json({
      success: true,
      data: {
        success: true,
        entities: fallbackEntities,
        entity_count: fallbackEntities.length,
        engine: 'LOCAL_DETERMINISTIC_FALLBACK'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'EXTRACTION_FAILED', message: error.message }
    });
  }
}

/**
 * Proxy / Fallback Classification
 */
async function classifyComplaint(req, res) {
  try {
    const { title = '', description } = req.body;
    if (!description) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Description is required for classification' }
      });
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const json = await response.json();
        return res.json({ success: true, data: json });
      }
    } catch (netErr) {
      // AI Service offline fallback
    }

    // Heuristic rule-based fallback
    const t = `${title} ${description}`.toLowerCase();
    let cat = 'OTHER';
    if (t.includes('upi') || t.includes('qr') || t.includes('gpay') || t.includes('phonepe') || t.includes('paytm')) cat = 'UPI_FRAUD';
    else if (t.includes('kyc') || t.includes('sms') || t.includes('link') || t.includes('phish') || t.includes('click')) cat = 'PHISHING';
    else if (t.includes('telegram') || t.includes('invest') || t.includes('crypto') || t.includes('forex') || t.includes('profit')) cat = 'INVESTMENT_SCAM';
    else if (t.includes('job') || t.includes('work from home') || t.includes('task') || t.includes('recruitment')) cat = 'JOB_SCAM';
    else if (t.includes('order') || t.includes('shopping') || t.includes('instagram') || t.includes('olx')) cat = 'SHOPPING_FRAUD';
    else if (t.includes('bank') || t.includes('account') || t.includes('manager') || t.includes('otp')) cat = 'BANK_FRAUD';

    return res.json({
      success: true,
      data: {
        category: cat,
        confidence: 0.85,
        engine: 'HEURISTIC_RULE_FALLBACK'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'CLASSIFICATION_FAILED', message: error.message }
    });
  }
}

/**
 * Generates fact-grounded investigation summary for a case
 */
async function generateCaseAiSummary(req, res) {
  try {
    const { id } = req.params;

    // Fetch case and root complaint
    const caseRes = await query(`
      SELECT fc.case_id, fc.case_title, fc.primary_complaint_id,
             c.title as comp_title, c.description as comp_desc, c.category, c.reported_amount,
             rs.final_score as risk_score, rs.risk_level
      FROM fraud_cases fc
      JOIN complaints c ON fc.primary_complaint_id = c.complaint_id
      LEFT JOIN risk_scores rs ON fc.case_id = rs.case_id
      WHERE fc.case_id = $1;
    `, [id]);

    if (caseRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'CASE_NOT_FOUND', message: `Case ${id} not found` }
      });
    }

    const caseData = caseRes.rows[0];

    // Traverse network to gather graph facts
    const graph = await traverseNetwork(caseData.primary_complaint_id, 3);
    const connectedComplaints = graph.nodes
      .filter(n => n.type === 'COMPLAINT')
      .map(n => n.data.complaintId);

    const connectedIdentifiers = graph.nodes
      .filter(n => n.type !== 'COMPLAINT')
      .map(n => ({ type: n.type, value: n.label }));

    const summaryPayload = {
      case_id: id,
      category: caseData.category,
      complaint_title: caseData.comp_title,
      complaint_description: caseData.comp_desc,
      risk_score: caseData.risk_score || 50,
      risk_level: caseData.risk_level || 'MEDIUM',
      connected_complaints: connectedComplaints,
      connected_identifiers: connectedIdentifiers,
      total_financial_loss: graph.metrics.totalExposedAmount
    };

    let summaryResult = null;

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/summarize-case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryPayload)
      });
      if (response.ok) {
        summaryResult = await response.json();
      }
    } catch (e) {
      // Fallback
    }

    if (!summaryResult) {
      // Native summary synthesis
      const narrative = `Case ${id} connects ${connectedComplaints.length} complaint(s) across ` +
        `${connectedIdentifiers.length} shared identifier(s). Beneficiary infrastructure exhibits a risk score of ` +
        `${caseData.risk_score || 50}/100 with an assessed severity level of ${caseData.risk_level || 'MEDIUM'}. ` +
        `Investigation indicates potential multi-victim coordination requiring statutory review.`;

      summaryResult = {
        narrative_summary: narrative,
        suspicious_patterns: [
          `Identified ${connectedIdentifiers.length} recurring cyber/financial entities`,
          `Combined exposed financial loss evaluated at Rs. ${graph.metrics.totalExposedAmount.toLocaleString('en-IN')}`
        ],
        investigative_recommendations: [
          'Issue Section 91 CrPC notice for bank account statement freeze',
          'Coordinate with telecom providers to verify subscriber identity'
        ]
      };
    }

    // Persist summary in fraud_cases table
    await query(`
      UPDATE fraud_cases
      SET ai_summary = $1, ai_summary_generated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE case_id = $2;
    `, [summaryResult.narrative_summary, id]);

    // Audit log
    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'GENERATE_AI_SUMMARY',
      resource: 'CASE',
      resourceId: id,
      metadata: { riskScore: caseData.risk_score, connectedComplaints: connectedComplaints.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: {
        caseId: id,
        summary: summaryResult.narrative_summary,
        patterns: summaryResult.suspicious_patterns,
        recommendations: summaryResult.investigative_recommendations,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[AI Controller] Summary generation failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SUMMARY_GENERATION_FAILED', message: error.message }
    });
  }
}

module.exports = {
  extractEntities,
  classifyComplaint,
  generateCaseAiSummary
};
