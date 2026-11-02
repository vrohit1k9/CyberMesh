const { query } = require('../config/db');

/**
 * Returns paginated immutable audit logs
 */
async function getAuditLogs(req, res) {
  try {
    const {
      action,
      resource,
      userId,
      page = 1,
      limit = 30
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (action) {
      conditions.push(`al.action = $${pIdx}`);
      params.push(action.toUpperCase());
      pIdx++;
    }

    if (resource) {
      conditions.push(`al.resource = $${pIdx}`);
      params.push(resource.toUpperCase());
      pIdx++;
    }

    if (userId) {
      conditions.push(`al.user_id = $${pIdx}`);
      params.push(parseInt(userId, 10));
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM audit_logs al ${whereClause};`;
    const countRes = await query(countSql, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT 
        al.log_id, al.user_id, al.action, al.resource, al.resource_id,
        al.metadata, al.ip_address, al.user_agent, al.created_at,
        u.username, u.full_name, u.badge_number, r.role_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN roles r ON u.role_id = r.role_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};
    `;

    params.push(limitNum, offset);
    const dataRes = await query(dataSql, params);

    return res.json({
      success: true,
      data: {
        logs: dataRes.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_AUDIT_LOGS_FAILED', message: error.message }
    });
  }
}

module.exports = {
  getAuditLogs
};
