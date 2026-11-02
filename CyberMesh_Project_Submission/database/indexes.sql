-- ============================================================================
-- CYBERMESH: STRATEGIC DATABASE INDEXES
-- Purpose: Optimize graph joins, recursive CTE queries, and telemetry lookups.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. IDENTIFIERS LOOKUPS & DEDUPLICATION
-- Justification: Every complaint ingestion verifies if an extracted identifier
-- already exists. B-Tree index on (type, value) enables O(log N) lookup.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_identifiers_type_val 
ON identifiers (type, value);

CREATE INDEX idx_identifiers_first_last_seen 
ON identifiers (first_seen_at, last_seen_at);

-- ----------------------------------------------------------------------------
-- 2. COMPLAINT_IDENTIFIERS JUNCTION INDEXES (GRAPH TRAVERSAL ENGINE)
-- Justification: The recursive CTE traversal queries join complaint_identifiers
-- alternating between complaint_id and identifier_id. Foreign key indexes are
-- essential to avoid full table scans across millions of edges.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_ci_complaint_id 
ON complaint_identifiers (complaint_id);

CREATE INDEX idx_ci_identifier_id 
ON complaint_identifiers (identifier_id);

-- Composite covering index for rapid edge confirmation
CREATE INDEX idx_ci_comp_ident_role 
ON complaint_identifiers (complaint_id, identifier_id, role_in_fraud);

-- ----------------------------------------------------------------------------
-- 3. SUB-ENTITY DOMAIN & ACCOUNT LOOKUPS
-- Justification: Speeds up reverse search by raw phone number, UPI address,
-- bank account number, or phishing domain.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_phone_number 
ON phone_numbers (phone_number);

CREATE INDEX idx_upi_address 
ON upi_ids (upi_address);

CREATE INDEX idx_bank_acc_num 
ON bank_accounts (account_number, ifsc_code);

CREATE INDEX idx_domain_name 
ON domains (domain_name);

-- ----------------------------------------------------------------------------
-- 4. COMPLAINTS FILTERING & DASHBOARD QUERIES
-- Justification: Dashboard filters complaints by category, status, and date.
-- Composite index accelerates the "Complaints by Category & Status" widget.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_complaints_cat_status 
ON complaints (category, status);

CREATE INDEX idx_complaints_reported_date 
ON complaints (reported_date DESC);

CREATE INDEX idx_complaints_created_at 
ON complaints (created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. TRANSACTIONS & ANOMALY LOOKUPS
-- Justification: Anomaly detector looks at recent transactions for a receiver
-- within rolling time-windows. This composite index makes receiver velocity
-- calculations instantaneous.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_tx_receiver_timestamp 
ON transactions (receiver_identifier_id, transaction_timestamp DESC);

CREATE INDEX idx_tx_complaint_id 
ON transactions (complaint_id);

CREATE INDEX idx_tx_flagged_anomaly 
ON transactions (is_flagged_anomaly) 
WHERE is_flagged_anomaly = TRUE;

-- ----------------------------------------------------------------------------
-- 6. RISK SCORES & FRAUD CASES
-- Justification: Enables rapid sorting of high-risk and critical cases for the
-- investigator priority queue.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_risk_scores_final 
ON risk_scores (final_score DESC, risk_level);

CREATE INDEX idx_fraud_cases_status 
ON fraud_cases (status, assigned_investigator_id);

-- ----------------------------------------------------------------------------
-- 7. AUDIT LOGS SEARCH
-- Justification: Compliance investigations search by user_id and timestamp descending.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_audit_logs_user_date 
ON audit_logs (user_id, created_at DESC);

CREATE INDEX idx_audit_logs_action_resource 
ON audit_logs (action, resource);
