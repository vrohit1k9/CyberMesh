const { query } = require('../config/db');
const { traverseNetwork } = require('./network.service');

/**
 * Calculates transparent, explainable 4-factor risk score for a case
 * @param {string} caseId 
 * @returns {Promise<Object>}
 */
async function calculateCaseRiskScore(caseId) {
  // 1. Fetch case details and root complaint
  const caseRes = await query(`
    SELECT fc.case_id, fc.case_title, fc.primary_complaint_id, c.reported_amount, c.category
    FROM fraud_cases fc
    JOIN complaints c ON fc.primary_complaint_id = c.complaint_id
    WHERE fc.case_id = $1 OR fc.primary_complaint_id = $1
  `, [caseId]);

  if (caseRes.rows.length === 0) {
    throw new Error(`Fraud case not found: ${caseId}`);
  }

  const caseObj = caseRes.rows[0];
  const actualCaseId = caseObj.case_id;
  const rootComplaintId = caseObj.primary_complaint_id;

  // 2. Perform graph traversal to understand syndicate depth and breadth
  const graph = await traverseNetwork(rootComplaintId, 3);
  const { totalComplaints, totalIdentifiers, totalExposedAmount } = graph.metrics;

  // 3. Count flagged transactions connected to these identifiers
  const identIds = graph.nodes
    .filter(n => n.type !== 'COMPLAINT')
    .map(n => n.data.identifierId);

  let flaggedTxnCount = 0;
  if (identIds.length > 0) {
    const placeholders = identIds.map((_, i) => `$${i + 1}`).join(',');
    const txRes = await query(`
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE (receiver_identifier_id IN (${placeholders}) OR sender_identifier_id IN (${placeholders}))
        AND is_flagged_anomaly = TRUE
    `, identIds);
    flaggedTxnCount = parseInt(txRes.rows[0].count, 10) || 0;
  }

  // 4. Compute 4 transparent factors:
  const factors = [];

  // Factor 1: Identifier Reuse Score (0 - 30 points)
  // Higher if identical bank account, phone, or UPI appears in multiple complaints
  let reuseScore = 0;
  if (totalComplaints > 1) {
    const reuseDegree = totalComplaints - 1;
    reuseScore = Math.min(30, reuseDegree * 10);
    factors.push({
      factor: 'IDENTIFIER_REUSE',
      weight: reuseScore,
      max: 30,
      detail: `Associated identifiers shared across ${totalComplaints} distinct complaints in investigation graph.`
    });
  } else {
    reuseScore = 5;
    factors.push({
      factor: 'IDENTIFIER_REUSE',
      weight: 5,
      max: 30,
      detail: 'No cross-complaint identifier reuse detected at this stage.'
    });
  }

  // Factor 2: Transaction Anomaly Score (0 - 25 points)
  let anomalyScore = 0;
  if (flaggedTxnCount > 0) {
    anomalyScore = Math.min(25, Math.round(flaggedTxnCount * 6.5));
    factors.push({
      factor: 'TRANSACTION_ANOMALY',
      weight: anomalyScore,
      max: 25,
      detail: `${flaggedTxnCount} transactions flagged for rapid dissipation, velocity spikes, or abnormal amounts.`
    });
  } else {
    anomalyScore = 5;
    factors.push({
      factor: 'TRANSACTION_ANOMALY',
      weight: 5,
      max: 25,
      detail: 'Transactions within expected statistical distribution thresholds.'
    });
  }

  // Factor 3: Network Density Score (0 - 25 points)
  // Reflects diversity of infrastructure (phones + upis + domains + accounts)
  let networkScore = 0;
  const distinctTypes = new Set(graph.nodes.map(n => n.type)).size;
  if (totalComplaints >= 2 && distinctTypes >= 3) {
    networkScore = Math.min(25, 12 + (totalIdentifiers * 2));
    factors.push({
      factor: 'NETWORK_DENSITY',
      weight: networkScore,
      max: 25,
      detail: `Complex multi-tier syndicate structure with ${totalIdentifiers} entities spanning ${distinctTypes} entity classes.`
    });
  } else {
    networkScore = Math.min(10, totalIdentifiers * 3);
    factors.push({
      factor: 'NETWORK_DENSITY',
      weight: networkScore,
      max: 25,
      detail: `Simple direct association network with ${totalIdentifiers} identified nodes.`
    });
  }

  // Factor 4: Financial Exposure & Recurrence (0 - 20 points)
  let exposureScore = 0;
  if (totalExposedAmount > 200000) {
    exposureScore = 20;
  } else if (totalExposedAmount > 100000) {
    exposureScore = 15;
  } else if (totalExposedAmount > 50000) {
    exposureScore = 10;
  } else {
    exposureScore = 5;
  }
  factors.push({
    factor: 'FINANCIAL_EXPOSURE',
    weight: exposureScore,
    max: 20,
    detail: `Aggregate network financial loss calculated at ₹${totalExposedAmount.toLocaleString('en-IN')}.`
  });

  // Calculate final score (0 - 100)
  const finalScore = Math.min(100, Math.max(0, reuseScore + anomalyScore + networkScore + exposureScore));

  let riskLevel = 'LOW';
  if (finalScore >= 81) riskLevel = 'CRITICAL';
  else if (finalScore >= 61) riskLevel = 'HIGH';
  else if (finalScore >= 31) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  // 5. Upsert into risk_scores table
  const upsertSql = `
    INSERT INTO risk_scores (
      case_id, final_score, risk_level, 
      identifier_reuse_score, transaction_anomaly_score, 
      network_density_score, complaint_frequency_score, 
      score_factors, calculated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (case_id) DO UPDATE
    SET final_score = EXCLUDED.final_score,
        risk_level = EXCLUDED.risk_level,
        identifier_reuse_score = EXCLUDED.identifier_reuse_score,
        transaction_anomaly_score = EXCLUDED.transaction_anomaly_score,
        network_density_score = EXCLUDED.network_density_score,
        complaint_frequency_score = EXCLUDED.complaint_frequency_score,
        score_factors = EXCLUDED.score_factors,
        calculated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const upsertRes = await query(upsertSql, [
    actualCaseId,
    finalScore,
    riskLevel,
    reuseScore,
    anomalyScore,
    networkScore,
    exposureScore,
    JSON.stringify(factors)
  ]);

  return upsertRes.rows[0];
}

module.exports = {
  calculateCaseRiskScore
};
