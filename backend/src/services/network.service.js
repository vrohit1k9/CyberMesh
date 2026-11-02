const { query } = require('../config/db');

/**
 * Traverses fraud network starting from a root complaint using PostgreSQL Recursive CTE
 * @param {string} rootComplaintId 
 * @param {number} maxDepth - default 3
 * @returns {Promise<{ nodes: Array, edges: Array, metrics: Object }>}
 */
async function traverseNetwork(rootComplaintId, maxDepth = 3) {
  // PostgreSQL Recursive CTE traversal query
  // Traverses bipartite edges: (Complaint <-> Identifier)
  const recursiveSql = `
    WITH RECURSIVE graph_cte AS (
      -- Base case: identifiers directly associated with the root complaint
      SELECT 
        'COMPLAINT'::text AS source_type,
        c.complaint_id::text AS source_id,
        'IDENTIFIER'::text AS target_type,
        i.identifier_id::text AS target_id,
        i.type::text AS identifier_type,
        i.value::text AS identifier_value,
        ci.role_in_fraud::text AS edge_label,
        1 AS depth,
        ARRAY['C:' || c.complaint_id, 'I:' || i.identifier_id::text] AS path
      FROM complaints c
      JOIN complaint_identifiers ci ON c.complaint_id = ci.complaint_id
      JOIN identifiers i ON ci.identifier_id = i.identifier_id
      WHERE c.complaint_id = $1

      UNION ALL

      -- Recursive step: Alternate between Identifier -> Complaint and Complaint -> Identifier
      SELECT 
        CASE 
          WHEN g.target_type = 'IDENTIFIER' THEN 'IDENTIFIER'::text
          ELSE 'COMPLAINT'::text
        END AS source_type,
        g.target_id::text AS source_id,
        CASE 
          WHEN g.target_type = 'IDENTIFIER' THEN 'COMPLAINT'::text
          ELSE 'IDENTIFIER'::text
        END AS target_type,
        CASE 
          WHEN g.target_type = 'IDENTIFIER' THEN ci.complaint_id::text
          ELSE i.identifier_id::text
        END AS target_id,
        CASE 
          WHEN g.target_type = 'IDENTIFIER' THEN 'COMPLAINT'::text
          ELSE i.type::text
        END AS identifier_type,
        CASE 
          WHEN g.target_type = 'IDENTIFIER' THEN c.title::text
          ELSE i.value::text
        END AS identifier_value,
        CASE 
          WHEN g.target_type = 'IDENTIFIER' THEN ci.role_in_fraud::text
          ELSE ci2.role_in_fraud::text
        END AS edge_label,
        g.depth + 1 AS depth,
        g.path || CASE 
          WHEN g.target_type = 'IDENTIFIER' THEN 'C:' || ci.complaint_id
          ELSE 'I:' || i.identifier_id::text
        END AS path
      FROM graph_cte g
      -- Branch 1: Current target is IDENTIFIER -> Find other Complaints that reference it
      LEFT JOIN complaint_identifiers ci 
        ON g.target_type = 'IDENTIFIER' AND g.target_id = ci.identifier_id::text
      LEFT JOIN complaints c 
        ON ci.complaint_id = c.complaint_id
      -- Branch 2: Current target is COMPLAINT -> Find other Identifiers linked to this Complaint
      LEFT JOIN complaint_identifiers ci2 
        ON g.target_type = 'COMPLAINT' AND g.target_id = ci2.complaint_id
      LEFT JOIN identifiers i 
        ON ci2.identifier_id = i.identifier_id
      WHERE g.depth < $2
        AND (
          (g.target_type = 'IDENTIFIER' AND ci.complaint_id IS NOT NULL AND NOT ('C:' || ci.complaint_id = ANY(g.path)))
          OR
          (g.target_type = 'COMPLAINT' AND i.identifier_id IS NOT NULL AND NOT ('I:' || i.identifier_id::text = ANY(g.path)))
        )
    )
    SELECT DISTINCT 
      source_type, 
      source_id, 
      target_type, 
      target_id, 
      identifier_type, 
      identifier_value, 
      edge_label, 
      depth 
    FROM graph_cte;
  `;

  const traversalResult = await query(recursiveSql, [rootComplaintId, maxDepth]);
  const rows = traversalResult.rows;

  // Set of unique complaint and identifier IDs discovered
  const complaintIds = new Set([rootComplaintId]);
  const identifierIds = new Set();
  const rawEdges = [];

  for (const row of rows) {
    if (row.source_type === 'COMPLAINT') complaintIds.add(row.source_id);
    if (row.target_type === 'COMPLAINT') complaintIds.add(row.target_id);
    if (row.source_type === 'IDENTIFIER') identifierIds.add(parseInt(row.source_id, 10));
    if (row.target_type === 'IDENTIFIER') identifierIds.add(parseInt(row.target_id, 10));

    rawEdges.push({
      source: row.source_type === 'COMPLAINT' ? `c_${row.source_id}` : `i_${row.source_id}`,
      target: row.target_type === 'COMPLAINT' ? `c_${row.target_id}` : `i_${row.target_id}`,
      label: row.edge_label || 'LINKED_TO',
      depth: row.depth
    });
  }

  // Fetch full details for all discovered Complaints
  let complaintsMap = new Map();
  if (complaintIds.size > 0) {
    const cList = Array.from(complaintIds);
    const placeholders = cList.map((_, idx) => `$${idx + 1}`).join(',');
    const cRes = await query(`
      SELECT complaint_id, title, reported_amount, category, status, priority, reported_date
      FROM complaints
      WHERE complaint_id IN (${placeholders})
    `, cList);
    for (const c of cRes.rows) {
      complaintsMap.set(c.complaint_id, c);
    }
  }

  // Fetch full details for all discovered Identifiers
  let identifiersMap = new Map();
  if (identifierIds.size > 0) {
    const iList = Array.from(identifierIds);
    const placeholders = iList.map((_, idx) => `$${idx + 1}`).join(',');
    const iRes = await query(`
      SELECT i.identifier_id, i.type, i.value, i.first_seen_at, i.last_seen_at,
             p.carrier_name, u.handle_bank, b.bank_name, b.account_number, b.ifsc_code, d.registrar
      FROM identifiers i
      LEFT JOIN phone_numbers p ON i.identifier_id = p.identifier_id
      LEFT JOIN upi_ids u ON i.identifier_id = u.identifier_id
      LEFT JOIN bank_accounts b ON i.identifier_id = b.identifier_id
      LEFT JOIN domains d ON i.identifier_id = d.identifier_id
      WHERE i.identifier_id IN (${placeholders})
    `, iList);
    for (const i of iRes.rows) {
      identifiersMap.set(i.identifier_id, i);
    }
  }

  // Fetch any transactions connecting these identifiers
  let transactionEdges = [];
  if (identifierIds.size > 0) {
    const iList = Array.from(identifierIds);
    const placeholders = iList.map((_, idx) => `$${idx + 1}`).join(',');
    const txRes = await query(`
      SELECT transaction_id, sender_identifier_id, receiver_identifier_id, amount, payment_channel, is_flagged_anomaly, transaction_timestamp
      FROM transactions
      WHERE receiver_identifier_id IN (${placeholders}) OR sender_identifier_id IN (${placeholders})
      LIMIT 100
    `, iList);

    for (const tx of txRes.rows) {
      if (tx.sender_identifier_id && tx.receiver_identifier_id) {
        transactionEdges.push({
          id: `tx_${tx.transaction_id}`,
          source: `i_${tx.sender_identifier_id}`,
          target: `i_${tx.receiver_identifier_id}`,
          label: `₹${parseFloat(tx.amount).toLocaleString('en-IN')} (${tx.payment_channel})`,
          isAnomaly: tx.is_flagged_anomaly,
          type: 'TRANSACTION_FLOW'
        });
      }
    }
  }

  // Build normalized Cytoscape / React Flow compatible node list
  const nodes = [];
  let totalExposed = 0;

  complaintsMap.forEach((c) => {
    totalExposed += parseFloat(c.reported_amount || 0);
    nodes.push({
      id: `c_${c.complaint_id}`,
      type: 'COMPLAINT',
      label: c.complaint_id,
      isRoot: c.complaint_id === rootComplaintId,
      data: {
        complaintId: c.complaint_id,
        title: c.title,
        amount: parseFloat(c.reported_amount),
        category: c.category,
        status: c.status,
        priority: c.priority,
        reportedDate: c.reported_date
      }
    });
  });

  identifiersMap.forEach((ident) => {
    nodes.push({
      id: `i_${ident.identifier_id}`,
      type: ident.type, // 'PHONE', 'UPI', 'BANK_ACCOUNT', 'DOMAIN'
      label: ident.value,
      data: {
        identifierId: ident.identifier_id,
        type: ident.type,
        value: ident.value,
        meta: {
          bankName: ident.bank_name,
          accountNumber: ident.account_number,
          ifsc: ident.ifsc_code,
          carrier: ident.carrier_name,
          handleBank: ident.handle_bank,
          registrar: ident.registrar
        }
      }
    });
  });

  // Deduplicate and assemble edges
  const edgeSet = new Set();
  const edges = [];

  for (const re of rawEdges) {
    const key = `${re.source}->${re.target}`;
    const reverseKey = `${re.target}->${re.source}`;
    if (!edgeSet.has(key) && !edgeSet.has(reverseKey)) {
      edgeSet.add(key);
      edges.push({
        id: `edge_${re.source}_${re.target}`,
        source: re.source,
        target: re.target,
        label: re.label,
        type: 'ASSOCIATION'
      });
    }
  }

  for (const te of transactionEdges) {
    if (!edgeSet.has(te.id)) {
      edgeSet.add(te.id);
      edges.push(te);
    }
  }

  return {
    nodes,
    edges,
    metrics: {
      rootComplaintId,
      maxDepth,
      totalComplaints: complaintsMap.size,
      totalIdentifiers: identifiersMap.size,
      totalTransactions: transactionEdges.length,
      totalExposedAmount: totalExposed,
      isSyndicateRing: complaintsMap.size >= 2
    }
  };
}

module.exports = {
  traverseNetwork
};
