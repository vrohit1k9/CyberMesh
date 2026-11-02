const { query } = require('../config/db');
const { traverseNetwork } = require('../services/network.service');
const { logAuditEvent } = require('../services/audit.service');

/**
 * Traverses network for a specific case using PostgreSQL Recursive CTE
 */
async function getCaseNetwork(req, res) {
  try {
    const { id } = req.params;
    const depth = Math.min(5, Math.max(1, parseInt(req.query.depth || '3', 10)));

    // Find primary complaint for this case or complaint
    let complaintId = null;
    let actualCaseId = id;
    const caseRes = await query(
      'SELECT case_id, primary_complaint_id FROM fraud_cases WHERE case_id = $1 OR primary_complaint_id = $1',
      [id]
    );
    if (caseRes.rows.length > 0) {
      complaintId = caseRes.rows[0].primary_complaint_id;
      actualCaseId = caseRes.rows[0].case_id;
    } else {
      const cmpRes = await query('SELECT complaint_id FROM complaints WHERE complaint_id = $1', [id]);
      if (cmpRes.rows.length > 0) {
        complaintId = cmpRes.rows[0].complaint_id;
      }
    }

    if (!complaintId) {
      return res.status(404).json({
        success: false,
        error: { code: 'CASE_NOT_FOUND', message: `Case or complaint ${id} not found` }
      });
    }

    const graphData = await traverseNetwork(complaintId, depth);

    // Audit log traversal action
    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'ANALYZE_NETWORK',
      resource: 'CASE',
      resourceId: id,
      metadata: { depth, discoveredNodes: graphData.nodes.length, discoveredEdges: graphData.edges.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: graphData
    });
  } catch (error) {
    console.error('[Network Controller] Network traversal error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'TRAVERSAL_FAILED', message: error.message }
    });
  }
}

/**
 * Returns all detected fraud rings / connected components across the entire database
 */
async function getGlobalNetworks(req, res) {
  try {
    // Find all identifiers that appear in more than 1 complaint (the backbone of fraud rings)
    const ringsSql = `
      SELECT 
        i.identifier_id, 
        i.type as identifier_type, 
        i.value as identifier_value,
        COUNT(DISTINCT ci.complaint_id) as complaint_count,
        ARRAY_AGG(DISTINCT ci.complaint_id) as linked_complaints
      FROM complaint_identifiers ci
      JOIN identifiers i ON ci.identifier_id = i.identifier_id
      GROUP BY i.identifier_id, i.type, i.value
      HAVING COUNT(DISTINCT ci.complaint_id) > 1
      ORDER BY complaint_count DESC;
    `;

    const ringsRes = await query(ringsSql);

    // Group overlapping rings
    const detectedRings = [];
    const processedComplaintSet = new Set();

    for (let idx = 0; idx < ringsRes.rows.length; idx++) {
      const ring = ringsRes.rows[idx];
      const seedComplaint = ring.linked_complaints[0];
      
      // Avoid duplicated ring clusters
      if (!processedComplaintSet.has(seedComplaint)) {
        const fullGraph = await traverseNetwork(seedComplaint, 3);
        const compIds = fullGraph.nodes
          .filter(n => n.type === 'COMPLAINT')
          .map(n => n.data.complaintId);

        compIds.forEach(cid => processedComplaintSet.add(cid));

        let totalExposure = 0;
        fullGraph.nodes
          .filter(n => n.type === 'COMPLAINT')
          .forEach(n => totalExposure += (n.data.amount || 0));

        detectedRings.push({
          networkId: `RING-00${detectedRings.length + 1}`,
          seedComplaintId: seedComplaint,
          complaintCount: fullGraph.metrics.totalComplaints,
          identifierCount: fullGraph.metrics.totalIdentifiers,
          totalExposedAmount: totalExposure,
          anchorIdentifier: `${ring.identifier_type}: ${ring.identifier_value}`,
          nodes: fullGraph.nodes,
          edges: fullGraph.edges
        });
      }
    }

    return res.json({
      success: true,
      data: {
        totalRingsDetected: detectedRings.length,
        rings: detectedRings
      }
    });
  } catch (error) {
    console.error('[Network Controller] Global rings error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'GLOBAL_NETWORK_ERROR', message: error.message }
    });
  }
}

module.exports = {
  getCaseNetwork,
  getGlobalNetworks
};
