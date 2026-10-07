-- ============================================================================
-- CYBERMESH: STORED PROCEDURES, VIEWS & RECURSIVE CTE FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RECURSIVE CTE GRAPH TRAVERSAL FUNCTION
-- Returns all connected nodes and edges starting from a seed complaint up to max_depth.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION traverse_fraud_network(
    p_root_complaint_id VARCHAR(50),
    p_max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
    source_type VARCHAR,
    source_id VARCHAR,
    target_type VARCHAR,
    target_id VARCHAR,
    relation_label VARCHAR,
    depth INTEGER,
    traversal_path TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE network_graph AS (
        -- Base / Anchor Member:
        -- Direct identifiers linked to the root complaint (Depth 1)
        SELECT 
            'COMPLAINT'::VARCHAR AS source_type,
            c.complaint_id::VARCHAR AS source_id,
            'IDENTIFIER'::VARCHAR AS target_type,
            i.identifier_id::VARCHAR AS target_id,
            i.type::VARCHAR AS relation_label,
            1 AS depth,
            ARRAY['C:' || c.complaint_id::TEXT, 'I:' || i.identifier_id::TEXT] AS traversal_path
        FROM complaints c
        JOIN complaint_identifiers ci ON c.complaint_id = ci.complaint_id
        JOIN identifiers i ON ci.identifier_id = i.identifier_id
        WHERE c.complaint_id = p_root_complaint_id

        UNION ALL

        -- Recursive Member:
        SELECT 
            CASE 
                WHEN ng.target_type = 'IDENTIFIER' THEN 'IDENTIFIER'::VARCHAR
                ELSE 'COMPLAINT'::VARCHAR
            END AS source_type,
            ng.target_id::VARCHAR AS source_id,
            CASE 
                WHEN ng.target_type = 'IDENTIFIER' THEN 'COMPLAINT'::VARCHAR
                ELSE 'IDENTIFIER'::VARCHAR
            END AS target_type,
            CASE 
                WHEN ng.target_type = 'IDENTIFIER' THEN ci.complaint_id::VARCHAR
                ELSE i2.identifier_id::VARCHAR
            END AS target_id,
            CASE 
                WHEN ng.target_type = 'IDENTIFIER' THEN 'SHARED_IN_COMPLAINT'::VARCHAR
                ELSE i2.type::VARCHAR
            END AS relation_label,
            ng.depth + 1 AS depth,
            ng.traversal_path || CASE 
                WHEN ng.target_type = 'IDENTIFIER' THEN 'C:' || ci.complaint_id::TEXT
                ELSE 'I:' || i2.identifier_id::TEXT
            END AS traversal_path
        FROM network_graph ng
        -- Path A: When current node is an IDENTIFIER, branch to other Complaints that link to it
        LEFT JOIN complaint_identifiers ci 
            ON ng.target_type = 'IDENTIFIER' 
            AND ng.target_id::INTEGER = ci.identifier_id
        -- Path B: When current node is a COMPLAINT, branch to other Identifiers linked to that Complaint
        LEFT JOIN complaint_identifiers ci2 
            ON ng.target_type = 'COMPLAINT' 
            AND ng.target_id = ci2.complaint_id
        LEFT JOIN identifiers i2 
            ON ci2.identifier_id = i2.identifier_id
        WHERE ng.depth < p_max_depth
          AND (
              (ng.target_type = 'IDENTIFIER' AND ci.complaint_id IS NOT NULL AND NOT ('C:' || ci.complaint_id::TEXT = ANY(ng.traversal_path)))
              OR
              (ng.target_type = 'COMPLAINT' AND i2.identifier_id IS NOT NULL AND NOT ('I:' || i2.identifier_id::TEXT = ANY(ng.traversal_path)))
          )
    )
    SELECT DISTINCT 
        ng.source_type, 
        ng.source_id, 
        ng.target_type, 
        ng.target_id, 
        ng.relation_label, 
        ng.depth, 
        ng.traversal_path
    FROM network_graph ng;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. DASHBOARD KPI SUMMARY VIEW
-- Justification: Aggregates real-time figures in a single zero-overhead query
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM complaints) AS total_complaints,
    (SELECT COUNT(*) FROM fraud_cases WHERE status IN ('NEW', 'ACTIVE', 'IN_REVIEW')) AS active_cases,
    (SELECT COUNT(*) FROM risk_scores WHERE risk_level = 'HIGH') AS high_risk_cases,
    (SELECT COUNT(*) FROM risk_scores WHERE risk_level = 'CRITICAL') AS critical_cases,
    (SELECT COUNT(DISTINCT identifier_id) FROM complaint_identifiers GROUP BY identifier_id HAVING COUNT(complaint_id) > 1 LIMIT 100) AS reused_identifiers_count,
    (SELECT COUNT(*) FROM transactions WHERE is_flagged_anomaly = TRUE) AS flagged_transactions_count;
