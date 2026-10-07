const { query, withTransaction } = require('../config/db');
const { upsertIdentifier, linkIdentifierToComplaint, getComplaintIdentifiers } = require('../services/identifier.service');
const { calculateCaseRiskScore } = require('../services/risk.service');
const { logAuditEvent } = require('../services/audit.service');

/**
 * Generate formatted sequential complaint ID
 */
async function generateNextComplaintId() {
  const res = await query(`
    SELECT complaint_id 
    FROM complaints 
    WHERE complaint_id LIKE 'CMP-2026-%' 
    ORDER BY complaint_id DESC 
    LIMIT 1;
  `);

  if (res.rows.length === 0) {
    return 'CMP-2026-0001';
  }

  const lastId = res.rows[0].complaint_id;
  const numPart = parseInt(lastId.split('-')[2], 10) || 0;
  const nextNum = (numPart + 1).toString().padStart(4, '0');
  return `CMP-2026-${nextNum}`;
}

/**
 * Ingests a new complaint along with confirmed extracted identifiers
 */
async function createComplaint(req, res) {
  try {
    const {
      title,
      description,
      reported_amount,
      reported_date,
      category,
      priority = 'MEDIUM',
      location = 'National Cyber Registry',
      victim_name = 'Confidential Citizen',
      identifiers = []
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title, description, and category are required fields'
        }
      });
    }

    const complaintId = await generateNextComplaintId();
    const userId = req.user ? req.user.userId : null;
    const amount = parseFloat(reported_amount) || 0.00;
    const repDate = reported_date || new Date().toISOString().split('T')[0];

    // 1. Insert Complaint record
    const insertComplaintSql = `
      INSERT INTO complaints (
        complaint_id, title, description, reported_amount, 
        reported_date, category, status, priority, location, 
        victim_name, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'NEW', $7, $8, $9, $10)
      RETURNING *;
    `;
    const cmpRes = await query(insertComplaintSql, [
      complaintId, title.trim(), description.trim(), amount,
      repDate, category.toUpperCase(), priority.toUpperCase(),
      location.trim(), victim_name.trim(), userId
    ]);
    const createdComplaint = cmpRes.rows[0];

    // 2. Ingest and link provided identifiers
    const linkedIdentifiers = [];
    if (Array.isArray(identifiers)) {
      for (const item of identifiers) {
        if (item.type && item.value) {
          try {
            const ident = await upsertIdentifier(item.type, item.value, item.details || {});
            const link = await linkIdentifierToComplaint(complaintId, ident.identifier_id, {
              roleInFraud: item.roleInFraud || 'BENEFICIARY',
              confidenceScore: item.confidenceScore || 1.00,
              extractedBy: item.extractedBy || (req.body.isAiExtracted ? 'AI_EXTRACTOR' : 'MANUAL')
            });
            linkedIdentifiers.push({ ...ident, link });
          } catch (identErr) {
            console.warn(`[Complaint Controller] Skipping invalid identifier:`, identErr.message);
          }
        }
      }
    }

    // 3. Automatically provision fraud_case for tracking
    const caseId = `CASE-${complaintId.replace('CMP-', '')}`;
    await query(`
      INSERT INTO fraud_cases (case_id, case_title, primary_complaint_id, assigned_investigator_id, status)
      VALUES ($1, $2, $3, $4, 'NEW')
      ON CONFLICT (case_id) DO NOTHING;
    `, [caseId, `Investigation File: ${title.trim()}`, complaintId, userId]);

    // 4. Calculate initial risk score
    let risk = null;
    try {
      risk = await calculateCaseRiskScore(caseId);
    } catch (riskErr) {
      console.warn('[Complaint Controller] Initial risk scoring deferred:', riskErr.message);
    }

    // 5. Log audit event
    await logAuditEvent({
      userId,
      action: 'CREATE_COMPLAINT',
      resource: 'COMPLAINT',
      resourceId: complaintId,
      metadata: { category, amount, identifierCount: linkedIdentifiers.length, caseId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(201).json({
      success: true,
      data: {
        complaint: createdComplaint,
        identifiers: linkedIdentifiers,
        caseId,
        risk
      }
    });
  } catch (error) {
    console.error('[Complaint Controller] Create error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CREATE_COMPLAINT_FAILED', message: error.message }
    });
  }
}

/**
 * Retrieves paginated complaints with filter and search capabilities
 */
async function getComplaints(req, res) {
  try {
    const {
      search,
      category,
      status,
      priority,
      page = 1,
      limit = 20,
      sortBy = 'reported_date',
      sortOrder = 'DESC'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(c.complaint_id ILIKE $${paramIdx} OR c.title ILIKE $${paramIdx} OR c.description ILIKE $${paramIdx} OR c.victim_name ILIKE $${paramIdx})`);
      params.push(`%${search.trim()}%`);
      paramIdx++;
    }

    if (category) {
      conditions.push(`c.category = $${paramIdx}`);
      params.push(category.toUpperCase());
      paramIdx++;
    }

    if (status) {
      conditions.push(`c.status = $${paramIdx}`);
      params.push(status.toUpperCase());
      paramIdx++;
    }

    if (priority) {
      conditions.push(`c.priority = $${paramIdx}`);
      params.push(priority.toUpperCase());
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column to prevent SQL injection
    const allowedSortCols = {
      'reported_date': 'c.reported_date',
      'created_at': 'c.created_at',
      'reported_amount': 'c.reported_amount',
      'priority': 'c.priority',
      'status': 'c.status',
      'complaint_id': 'c.complaint_id'
    };
    const orderCol = allowedSortCols[sortBy] || 'c.reported_date';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Total count query
    const countSql = `SELECT COUNT(*) as count FROM complaints c ${whereClause};`;
    const countRes = await query(countSql, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Data query with identifier counts and case linking
    const dataSql = `
      SELECT 
        c.complaint_id, c.title, c.description, c.reported_amount, 
        c.reported_date, c.category, c.status, c.priority, c.location, 
        c.victim_name, c.created_at,
        u.full_name as investigator_name,
        fc.case_id,
        rs.final_score as risk_score,
        rs.risk_level,
        (SELECT COUNT(*) FROM complaint_identifiers ci WHERE ci.complaint_id = c.complaint_id) as identifier_count
      FROM complaints c
      LEFT JOIN users u ON c.created_by = u.user_id
      LEFT JOIN fraud_cases fc ON c.complaint_id = fc.primary_complaint_id
      LEFT JOIN risk_scores rs ON fc.case_id = rs.case_id
      ${whereClause}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
    `;

    params.push(limitNum, offset);
    const dataRes = await query(dataSql, params);

    return res.json({
      success: true,
      data: {
        complaints: dataRes.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('[Complaint Controller] Query failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_COMPLAINTS_FAILED', message: error.message }
    });
  }
}

/**
 * Retrieves full details for a single complaint
 */
async function getComplaintById(req, res) {
  try {
    const { id } = req.params;

    const cRes = await query(`
      SELECT 
        c.*, 
        u.full_name as investigator_name, 
        u.badge_number,
        fc.case_id,
        fc.status as case_status,
        fc.investigation_notes,
        fc.ai_summary,
        rs.final_score as risk_score,
        rs.risk_level,
        rs.score_factors
      FROM complaints c
      LEFT JOIN users u ON c.created_by = u.user_id
      LEFT JOIN fraud_cases fc ON c.complaint_id = fc.primary_complaint_id
      LEFT JOIN risk_scores rs ON fc.case_id = rs.case_id
      WHERE c.complaint_id = $1
    `, [id]);

    if (cRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPLAINT_NOT_FOUND', message: `Complaint ${id} does not exist` }
      });
    }

    const complaint = cRes.rows[0];
    const identifiers = await getComplaintIdentifiers(id);

    return res.json({
      success: true,
      data: {
        complaint,
        identifiers
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_COMPLAINT_FAILED', message: error.message }
    });
  }
}

/**
 * Updates complaint details or status
 */
async function updateComplaint(req, res) {
  try {
    const { id } = req.params;
    const { status, priority, title, description, location } = req.body;

    const checkRes = await query('SELECT * FROM complaints WHERE complaint_id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPLAINT_NOT_FOUND', message: `Complaint ${id} does not exist` }
      });
    }

    const current = checkRes.rows[0];

    const updatedStatus = status ? status.toUpperCase() : current.status;
    const updatedPriority = priority ? priority.toUpperCase() : current.priority;
    const updatedTitle = title ? title.trim() : current.title;
    const updatedDesc = description ? description.trim() : current.description;
    const updatedLoc = location ? location.trim() : current.location;

    const updateSql = `
      UPDATE complaints
      SET status = $1, priority = $2, title = $3, description = $4, location = $5, updated_at = CURRENT_TIMESTAMP
      WHERE complaint_id = $6
      RETURNING *;
    `;
    const updateRes = await query(updateSql, [
      updatedStatus, updatedPriority, updatedTitle, updatedDesc, updatedLoc, id
    ]);

    // Record audit event
    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'UPDATE_COMPLAINT',
      resource: 'COMPLAINT',
      resourceId: id,
      metadata: { previousStatus: current.status, newStatus: updatedStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: {
        complaint: updateRes.rows[0]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'UPDATE_COMPLAINT_FAILED', message: error.message }
    });
  }
}

/**
 * Deletes complaint (Admin or Investigator)
 */
async function deleteComplaint(req, res) {
  try {
    const { id } = req.params;

    const delRes = await query('DELETE FROM complaints WHERE complaint_id = $1 RETURNING complaint_id;', [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPLAINT_NOT_FOUND', message: `Complaint ${id} does not exist` }
      });
    }

    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'DELETE_COMPLAINT',
      resource: 'COMPLAINT',
      resourceId: id,
      metadata: { deletedAt: new Date().toISOString() },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: { message: `Complaint ${id} successfully removed` }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'DELETE_COMPLAINT_FAILED', message: error.message }
    });
  }
}

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint
};
