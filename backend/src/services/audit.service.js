const { query } = require('../config/db');

/**
 * Records an immutable audit event in audit_logs
 * @param {Object} param0
 * @param {number|null} param0.userId
 * @param {string} param0.action - E.g. 'LOGIN', 'CREATE_COMPLAINT'
 * @param {string} param0.resource - E.g. 'USER', 'COMPLAINT', 'CASE'
 * @param {string|null} param0.resourceId
 * @param {Object} [param0.metadata]
 * @param {string} [param0.ipAddress]
 * @param {string} [param0.userAgent]
 */
async function logAuditEvent({
  userId = null,
  action,
  resource,
  resourceId = null,
  metadata = {},
  ipAddress = '127.0.0.1',
  userAgent = 'CyberMesh Client'
}) {
  try {
    const text = `
      INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING log_id, created_at;
    `;
    const params = [
      userId,
      action,
      resource,
      resourceId ? String(resourceId) : null,
      JSON.stringify(metadata),
      ipAddress,
      userAgent
    ];
    const res = await query(text, params);
    return res.rows[0];
  } catch (err) {
    // Audit log failures should be reported to stderr but not crash request execution
    console.error(`[CyberMesh Audit] Failed to write audit entry (${action}):`, err.message);
    return null;
  }
}

module.exports = {
  logAuditEvent
};
