const { query } = require('../config/db');
const { logAuditEvent } = require('../services/audit.service');

/**
 * List all fraud cases with risk levels and assigned investigators
 */
async function getCases(req, res) {
  try {
    const { status, riskLevel, search } = req.query;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      conditions.push(`fc.status = $${pIdx}`);
      params.push(status.toUpperCase());
      pIdx++;
    }

    if (riskLevel) {
      conditions.push(`rs.risk_level = $${pIdx}`);
      params.push(riskLevel.toUpperCase());
      pIdx++;
    }

    if (search) {
      conditions.push(`(fc.case_id ILIKE $${pIdx} OR fc.case_title ILIKE $${pIdx} OR c.title ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        fc.case_id, fc.case_title, fc.primary_complaint_id, fc.status, 
        fc.investigation_notes, fc.ai_summary, fc.created_at, fc.updated_at,
        u.user_id as investigator_id, u.full_name as investigator_name, u.badge_number,
        c.category, c.reported_amount, c.reported_date,
        rs.final_score as risk_score, rs.risk_level, rs.score_factors
      FROM fraud_cases fc
      JOIN complaints c ON fc.primary_complaint_id = c.complaint_id
      LEFT JOIN users u ON fc.assigned_investigator_id = u.user_id
      LEFT JOIN risk_scores rs ON fc.case_id = rs.case_id
      ${whereClause}
      ORDER BY COALESCE(rs.final_score, 0) DESC, fc.created_at DESC;
    `;

    const resData = await query(sql, params);

    return res.json({
      success: true,
      data: {
        cases: resData.rows
      }
    });
  } catch (error) {
    console.error('[Case Controller] Error fetching cases:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_CASES_FAILED', message: error.message }
    });
  }
}

/**
 * Get detailed case record
 */
async function getCaseById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        fc.case_id, fc.case_title, fc.primary_complaint_id, fc.status, 
        fc.investigation_notes, fc.ai_summary, fc.ai_summary_generated_at,
        fc.created_at, fc.updated_at,
        u.user_id as investigator_id, u.full_name as investigator_name, u.badge_number,
        c.category, c.reported_amount, c.reported_date, c.title as primary_complaint_title,
        c.description as primary_complaint_desc,
        rs.final_score as risk_score, rs.risk_level, 
        rs.identifier_reuse_score, rs.transaction_anomaly_score, 
        rs.network_density_score, rs.complaint_frequency_score, 
        rs.score_factors
      FROM fraud_cases fc
      JOIN complaints c ON fc.primary_complaint_id = c.complaint_id
      LEFT JOIN users u ON fc.assigned_investigator_id = u.user_id
      LEFT JOIN risk_scores rs ON fc.case_id = rs.case_id
      WHERE fc.case_id = $1;
    `;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'CASE_NOT_FOUND', message: `Case ${id} not found` }
      });
    }

    return res.json({
      success: true,
      data: {
        case: result.rows[0]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_CASE_FAILED', message: error.message }
    });
  }
}

/**
 * Update case status or investigator notes
 */
async function updateCaseStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, investigation_notes, assigned_investigator_id } = req.body;

    const currentRes = await query('SELECT * FROM fraud_cases WHERE case_id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'CASE_NOT_FOUND', message: `Case ${id} not found` }
      });
    }

    const current = currentRes.rows[0];
    const newStatus = status ? status.toUpperCase() : current.status;
    const newNotes = investigation_notes !== undefined ? investigation_notes : current.investigation_notes;
    const newInvId = assigned_investigator_id !== undefined ? assigned_investigator_id : current.assigned_investigator_id;

    const updateSql = `
      UPDATE fraud_cases
      SET status = $1, investigation_notes = $2, assigned_investigator_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE case_id = $4
      RETURNING *;
    `;
    const updated = await query(updateSql, [newStatus, newNotes, newInvId, id]);

    // Audit log
    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'UPDATE_CASE_STATUS',
      resource: 'CASE',
      resourceId: id,
      metadata: { previousStatus: current.status, newStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: {
        case: updated.rows[0]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'UPDATE_CASE_FAILED', message: error.message }
    });
  }
}

module.exports = {
  getCases,
  getCaseById,
  updateCaseStatus
};
