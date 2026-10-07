-- ============================================================================
-- CYBERMESH: FRAUD COMPLAINT & FRAUD-RING TRACKER
-- Database Schema Definition (Target: 3NF Relational Architecture)
-- Engine: PostgreSQL 14+ / ANSI SQL Compatible
-- ============================================================================

-- Drop tables if existing in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS case_relationships CASCADE;
DROP TABLE IF EXISTS risk_scores CASCADE;
DROP TABLE IF EXISTS fraud_cases CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS upi_ids CASCADE;
DROP TABLE IF EXISTS phone_numbers CASCADE;
DROP TABLE IF EXISTS complaint_identifiers CASCADE;
DROP TABLE IF EXISTS identifiers CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ----------------------------------------------------------------------------
-- 1. ROLES TABLE (Access Control Dimension)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE (System Actors: Admin, Investigator, Analyst)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    badge_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. COMPLAINTS TABLE (Reported Incident Incidents)
-- ----------------------------------------------------------------------------
CREATE TABLE complaints (
    complaint_id VARCHAR(50) PRIMARY KEY, -- E.g. 'CMP-2026-0001'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reported_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (reported_amount >= 0),
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(50) NOT NULL CHECK (
        category IN (
            'UPI_FRAUD', 
            'PHISHING', 
            'BANK_FRAUD', 
            'INVESTMENT_SCAM', 
            'JOB_SCAM', 
            'SHOPPING_FRAUD', 
            'IDENTITY_THEFT', 
            'ACCOUNT_TAKEOVER', 
            'OTHER'
        )
    ),
    status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'ASSIGNED', 'UNDER_INVESTIGATION', 'LINKED_TO_RING', 'RESOLVED', 'CLOSED')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    location VARCHAR(150),
    victim_name VARCHAR(150),
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. IDENTIFIERS TABLE (Canonical Identifier Super-Entity)
-- ----------------------------------------------------------------------------
CREATE TABLE identifiers (
    identifier_id SERIAL PRIMARY KEY,
    type VARCHAR(30) NOT NULL CHECK (
        type IN ('PHONE', 'UPI', 'BANK_ACCOUNT', 'DOMAIN', 'EMAIL', 'IP_ADDRESS')
    ),
    value VARCHAR(255) NOT NULL, -- Normalized canonical value
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    risk_weight NUMERIC(3, 2) DEFAULT 1.00 CHECK (risk_weight >= 0.0 AND risk_weight <= 2.0),
    CONSTRAINT uq_identifier_type_value UNIQUE (type, value)
);

-- ----------------------------------------------------------------------------
-- 5. COMPLAINT_IDENTIFIERS TABLE (M:N Bridge: Complaints <-> Identifiers)
-- ----------------------------------------------------------------------------
CREATE TABLE complaint_identifiers (
    id SERIAL PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    identifier_id INTEGER NOT NULL REFERENCES identifiers(identifier_id) ON DELETE CASCADE,
    role_in_fraud VARCHAR(50) DEFAULT 'BENEFICIARY' CHECK (
        role_in_fraud IN ('BENEFICIARY', 'COMMUNICATION_CHANNEL', 'PHISHING_PORTAL', 'IMPERSONATION', 'UNKNOWN')
    ),
    confidence_score NUMERIC(3, 2) DEFAULT 1.00 CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    extracted_by VARCHAR(50) DEFAULT 'MANUAL', -- 'AI_EXTRACTOR', 'MANUAL_ENTRY'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_complaint_identifier UNIQUE (complaint_id, identifier_id)
);

-- ----------------------------------------------------------------------------
-- 6. SPECIALIZED SUB-ENTITIES FOR IDENTIFIERS (3NF Attribute Separation)
-- ----------------------------------------------------------------------------

-- Phone Specific Attributes
CREATE TABLE phone_numbers (
    identifier_id INTEGER PRIMARY KEY REFERENCES identifiers(identifier_id) ON DELETE CASCADE,
    phone_number VARCHAR(30) NOT NULL UNIQUE,
    country_code VARCHAR(10) DEFAULT '+91',
    carrier_name VARCHAR(100),
    is_voip BOOLEAN DEFAULT FALSE,
    is_flagged_spammer BOOLEAN DEFAULT FALSE
);

-- UPI Specific Attributes
CREATE TABLE upi_ids (
    identifier_id INTEGER PRIMARY KEY REFERENCES identifiers(identifier_id) ON DELETE CASCADE,
    upi_address VARCHAR(255) NOT NULL UNIQUE,
    handle_bank VARCHAR(100),
    vpa_provider VARCHAR(100),
    is_merchant BOOLEAN DEFAULT FALSE
);

-- Bank Account Specific Attributes
CREATE TABLE bank_accounts (
    identifier_id INTEGER PRIMARY KEY REFERENCES identifiers(identifier_id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(150),
    branch_name VARCHAR(150),
    account_type VARCHAR(50) DEFAULT 'SAVINGS',
    CONSTRAINT uq_bank_acc_ifsc UNIQUE (account_number, ifsc_code)
);

-- Domain Specific Attributes
CREATE TABLE domains (
    identifier_id INTEGER PRIMARY KEY REFERENCES identifiers(identifier_id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    registrar VARCHAR(150),
    registration_date DATE,
    tld VARCHAR(30),
    ip_address VARCHAR(50),
    is_active_phish BOOLEAN DEFAULT TRUE
);

-- ----------------------------------------------------------------------------
-- 7. TRANSACTIONS TABLE (Financial Movement Between Identifiers)
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id VARCHAR(100) PRIMARY KEY, -- E.g. UTR or Ref Number
    complaint_id VARCHAR(50) REFERENCES complaints(complaint_id) ON DELETE SET NULL,
    sender_identifier_id INTEGER REFERENCES identifiers(identifier_id) ON DELETE SET NULL,
    receiver_identifier_id INTEGER NOT NULL REFERENCES identifiers(identifier_id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'INR',
    transaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_channel VARCHAR(30) NOT NULL CHECK (
        payment_channel IN ('UPI', 'IMPS', 'NEFT', 'RTGS', 'CARD', 'WALLET')
    ),
    is_flagged_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. FRAUD_CASES TABLE (Grouped Investigation Files)
-- ----------------------------------------------------------------------------
CREATE TABLE fraud_cases (
    case_id VARCHAR(50) PRIMARY KEY, -- E.g. 'CASE-2026-001'
    case_title VARCHAR(255) NOT NULL,
    primary_complaint_id VARCHAR(50) NOT NULL REFERENCES complaints(complaint_id) ON DELETE RESTRICT,
    assigned_investigator_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'ACTIVE', 'IN_REVIEW', 'ESCALATED', 'DISRUPTED', 'CLOSED')
    ),
    investigation_notes TEXT,
    ai_summary TEXT,
    ai_summary_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. RISK_SCORES TABLE (Explainable 4-Factor Risk Engine State)
-- ----------------------------------------------------------------------------
CREATE TABLE risk_scores (
    score_id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL UNIQUE REFERENCES fraud_cases(case_id) ON DELETE CASCADE,
    final_score INTEGER NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (
        risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    identifier_reuse_score INTEGER NOT NULL DEFAULT 0 CHECK (identifier_reuse_score BETWEEN 0 AND 30),
    transaction_anomaly_score INTEGER NOT NULL DEFAULT 0 CHECK (transaction_anomaly_score BETWEEN 0 AND 25),
    network_density_score INTEGER NOT NULL DEFAULT 0 CHECK (network_density_score BETWEEN 0 AND 25),
    complaint_frequency_score INTEGER NOT NULL DEFAULT 0 CHECK (complaint_frequency_score BETWEEN 0 AND 20),
    score_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. CASE_RELATIONSHIPS TABLE (Precomputed / Discovered Graph Edges)
-- ----------------------------------------------------------------------------
CREATE TABLE case_relationships (
    relationship_id SERIAL PRIMARY KEY,
    source_complaint_id VARCHAR(50) NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    target_complaint_id VARCHAR(50) NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    shared_identifier_id INTEGER NOT NULL REFERENCES identifiers(identifier_id) ON DELETE CASCADE,
    hop_distance INTEGER NOT NULL DEFAULT 1 CHECK (hop_distance > 0),
    confidence_score NUMERIC(3, 2) DEFAULT 1.00,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_case_rel UNIQUE (source_complaint_id, target_complaint_id, shared_identifier_id)
);

-- ----------------------------------------------------------------------------
-- 11. AUDIT_LOGS TABLE (Immutable Activity Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'CREATE_COMPLAINT', 'ANALYZE_NETWORK', etc.
    resource VARCHAR(100) NOT NULL, -- 'COMPLAINT', 'CASE', 'RISK_SCORE', etc.
    resource_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
