const { query } = require('../config/db');
const { calculateCaseRiskScore } = require('../services/risk.service');
const { logAuditEvent } = require('../services/audit.service');

/**
 * Returns explainable risk score for a case
 */
async function getCaseRisk(req, res) {
  try {
    const { id } = req.params;

    const riskRes = await query(`
      SELECT rs.* FROM risk_scores rs
      JOIN fraud_cases fc ON rs.case_id = fc.case_id
      WHERE rs.case_id = $1 OR fc.primary_complaint_id = $1;
    `, [id]);

    if (riskRes.rows.length === 0) {
      // If not yet calculated, calculate on the fly
      const calculated = await calculateCaseRiskScore(id);
      return res.json({
        success: true,
        data: { risk: calculated }
      });
    }

    return res.json({
      success: true,
      data: { risk: riskRes.rows[0] }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_RISK_FAILED', message: error.message }
    });
  }
}

/**
 * Recalculate risk score based on fresh network graph and transaction status
 */
async function recalculateCaseRisk(req, res) {
  try {
    const { id } = req.params;

    const updated = await calculateCaseRiskScore(id);

    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'RECALCULATE_RISK',
      resource: 'RISK_SCORE',
      resourceId: id,
      metadata: { finalScore: updated.final_score, level: updated.risk_level },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: {
        risk: updated
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'RECALCULATE_RISK_FAILED', message: error.message }
    });
  }
}

module.exports = {
  getCaseRisk,
  recalculateCaseRisk
};
