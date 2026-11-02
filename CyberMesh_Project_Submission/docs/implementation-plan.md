# CYBERMESH: Fraud Complaint & Fraud-Ring Tracker
## System Implementation Plan & Technical Architecture Document

---

## 1. Project Overview & System Architecture

### 1.1 Academic Project Context
**CyberMesh** is an academic cybersecurity and database management systems (DBMS) investigation platform prototype. Its primary purpose is to help cybercrime investigators identify hidden structural links between ostensibly distinct citizen complaints using shared synthetic financial and cyber identifiers:
- Phone numbers (MSISDN)
- Virtual Payment Addresses / UPI IDs
- Bank account numbers & IFSC codes
- Malicious/phishing domains and URLs
- Transaction references & timestamps

Rather than acting as a simple CRUD complaints repository, CyberMesh applies **database graph traversal (PostgreSQL Recursive Common Table Expressions)**, **rule-and-NLP hybrid entity extraction**, **transparent risk scoring heuristics**, **statistical anomaly detection**, and **interactive network visualization** to automatically detect and map multi-tier fraud syndicates.

### 1.2 Multi-Tier System Topology

```
                  +----------------------------------------------+
                  |            CYBERMESH WEB CLIENT              |
                  |     React 18 + Vite + Tailwind CSS           |
                  |     Cytoscape.js / React Flow Graph Engine   |
                  |     Recharts Telemetry & Dark Cyber UI       |
                  +----------------------+-----------------------+
                                         |
                                         | HTTPS / REST (JWT Bearer)
                                         v
                  +----------------------------------------------+
                  |         NODE.JS / EXPRESS API GATEWAY        |
                  |  - Route Controllers & Input Validation      |
                  |  - JWT Authentication & RBAC Middleware      |
                  |  - Audit Logging Engine                      |
                  |  - Parameterized Database Query Pool         |
                  +---------------+--------------+---------------+
                                  |              |
           SQL Queries &          |              | Internal REST
           Recursive CTEs         |              | JSON Payload
                                  v              v
      +-----------------------------+    +-----------------------------+
      |     POSTGRESQL DATABASE     |    |   PYTHON FASTAPI AI SERVICE |
      |  - 3NF Normalized Schema    |    |  - Deterministic Extractor  |
      |  - B-Tree & Hash Indexes    |    |  - Scikit-learn Classifier  |
      |  - Recursive CTE Traversal  |    |  - Anomaly Detector (Stat)  |
      |  - Audit Log Ledger         |    |  - Fact-Grounded Summarizer |
      +-----------------------------+    +-----------------------------+
```

### 1.3 Key Architectural Decisions
1. **API Gateway Pattern:** The frontend interacts solely with the Express.js API gateway. It never directly accesses the PostgreSQL database or the internal AI service.
2. **Dual PostgreSQL Engine Support:**
   - **Primary / Production / Docker:** PostgreSQL 16 server via standard connection string (`DATABASE_URL`).
   - **Portability / Zero-Dependency Mode:** In addition to standard `pg` pool connecting to PostgreSQL, an embedded WebAssembly PostgreSQL driver (`@electric-sql/pglite`) is supported natively in Node.js for instant evaluation on workstations where PostgreSQL service isn't pre-installed. Both engines run the identical SQL schema, constraints, indexes, and recursive CTEs.
3. **Decoupled AI Microservice:** The Python FastAPI service isolates scientific and machine learning dependencies (scikit-learn, regex, pydantic) from the Node.js API runtime.
4. **Deterministic Precedence in AI:** Regex and algorithmic entity extraction take absolute precedence over generative probabilistic models for strict financial and cyber identifiers (UPI, phone numbers, IFSC, bank accounts, domains).

---

## 2. Database Schema & Normalization Design (3NF)

### 2.1 Entity-Relationship Structure
The database enforces Third Normal Form (3NF) across all relations to eliminate insertion, update, and deletion anomalies.

```
+---------------+       +------------------+       +-------------------+
|     roles     |       |      users       |       |    audit_logs     |
+---------------+       +------------------+       +-------------------+
| role_id (PK)  |<----1-| user_id (PK)     |<----1-| log_id (PK)       |
| role_name     |       | username (UQ)    |       | user_id (FK)      |
| description   |       | password_hash    |       | action            |
+---------------+       | role_id (FK)     |       | resource          |
                        | email (UQ)       |       | resource_id       |
                        | full_name        |       | metadata (JSONB)  |
                        +--------+---------+       | created_at        |
                                 |                 +-------------------+
                                 | 1
                                 |
                                 v M
                        +------------------+
                        |   complaints     |
                        +------------------+
                        | complaint_id(PK) |<-----+
                        | title            |      |
                        | description      |      |
                        | reported_amount  |      |
                        | reported_date    |      |
                        | category         |      |
                        | status           |      |
                        | priority         |      |
                        | location         |      |
                        | created_by (FK)  |      |
                        | created_at       |      |
                        | updated_at       |      |
                        +--------+---------+      |
                                 |                |
                                 | 1              | 1
                                 v M              |
+-------------------------------------------------+--+
|             complaint_identifiers                  |
+----------------------------------------------------+
| id (PK)                                            |
| complaint_id (FK -> complaints)                    |
| identifier_id (FK -> identifiers)                  |
| role_in_fraud (e.g. 'BENEFICIARY', 'SPOOFED_CALL') |
| confidence_score (NUMERIC 0-1)                     |
| created_at                                         |
+------------------------+---------------------------+
                         | M
                         v 1
+----------------------------------------------------+
|                    identifiers                     |
+----------------------------------------------------+
| identifier_id (PK)                                 |
| type ('PHONE', 'UPI', 'BANK_ACCOUNT', 'DOMAIN')    |
| value (Canonical / Normalized String, UQ with type)|
| first_seen_at                                      |
| last_seen_at                                       |
| risk_weight                                        |
+----------------------------------------------------+
        |                  |                 |                  |
        | 1:1              | 1:1             | 1:1              | 1:1
        v                  v                 v                  v
+---------------+  +---------------+  +---------------+  +---------------+
| phone_numbers |  |    upi_ids    |  | bank_accounts |  |    domains    |
+---------------+  +---------------+  +---------------+  +---------------+
| ident_id (PK) |  | ident_id (PK) |  | ident_id (PK) |  | ident_id (PK) |
| phone_number  |  | upi_address   |  | account_number|  | domain_name   |
| country_code  |  | handle_bank   |  | ifsc_code     |  | registrar     |
| carrier_name  |  | is_verified   |  | bank_name     |  | tld           |
+---------------+  +---------------+  +---------------+  +---------------+

+----------------------------------------------------+
|                   transactions                     |
+----------------------------------------------------+
| transaction_id (PK)                                |
| complaint_id (FK -> complaints)                    |
| sender_identifier_id (FK -> identifiers)           |
| receiver_identifier_id (FK -> identifiers)         |
| amount (NUMERIC(15,2))                             |
| currency ('INR', default)                          |
| transaction_timestamp                              |
| payment_channel ('UPI', 'IMPS', 'NEFT', 'CARD')    |
| is_flagged_anomaly (BOOLEAN)                       |
| anomaly_reason (TEXT)                              |
+----------------------------------------------------+

+----------------------------------------------------+
|                   fraud_cases                      |
+----------------------------------------------------+
| case_id (PK)                                       |
| primary_complaint_id (FK -> complaints)            |
| case_number (UQ, e.g. 'CASE-2026-001')             |
| assigned_investigator_id (FK -> users)             |
| status ('NEW', 'UNDER_INVESTIGATION', 'RESOLVED')  |
| summary (TEXT)                                     |
| created_at, updated_at                             |
+------------------------+---------------------------+
                         | 1
                         v 1
+----------------------------------------------------+
|                   risk_scores                      |
+----------------------------------------------------+
| score_id (PK)                                      |
| case_id (FK -> fraud_cases)                        |
| final_score (INTEGER 0-100)                        |
| risk_level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')   |
| identifier_reuse_score (INTEGER)                   |
| transaction_anomaly_score (INTEGER)                |
| network_density_score (INTEGER)                    |
| complaint_frequency_score (INTEGER)                |
| score_factors (JSONB)                              |
| calculated_at                                      |
+----------------------------------------------------+

+----------------------------------------------------+
|                case_relationships                  |
+----------------------------------------------------+
| relationship_id (PK)                               |
| source_complaint_id (FK -> complaints)             |
| target_complaint_id (FK -> complaints)             |
| shared_identifier_id (FK -> identifiers)           |
| hop_distance (INTEGER)                             |
| confidence_score (NUMERIC 3,2)                     |
| discovered_at                                      |
+----------------------------------------------------+
```

### 2.2 Normalization Proofs (1NF, 2NF, 3NF)
1. **First Normal Form (1NF):**
   - Every column contains atomic values only (e.g., no comma-separated lists of phones or UPI handles in complaints).
   - Each record contains a primary key uniquely identifying the tuple.
2. **Second Normal Form (2NF):**
   - The database is in 1NF.
   - All non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies on composite keys).
   - In junction tables like `complaint_identifiers`, attributes like `role_in_fraud` and `confidence_score` depend on the composite pair `(complaint_id, identifier_id)`, which is mapped with a surrogate PK `id` and unique composite constraint.
3. **Third Normal Form (3NF):**
   - The database is in 2NF.
   - No non-key attribute is transitively dependent on the primary key (no $X \to Y \to Z$).
   - Specific attributes of entities (e.g., `bank_name` associated with `account_number`, or `carrier_name` with `phone_number`) are separated into specialized type tables (`phone_numbers`, `upi_ids`, `bank_accounts`, `domains`) linked to the base `identifiers` super-entity table.

### 2.3 Strategic Indexing Plan
- `idx_identifiers_type_val` on `identifiers(type, value)` — High-speed sub-millisecond lookup during entity extraction ingestion.
- `idx_complaint_idents_cid` on `complaint_identifiers(complaint_id)` and `idx_complaint_idents_iid` on `complaint_identifiers(identifier_id)` — Crucial for graph edge traversal and recursive CTE joins.
- `idx_complaints_category_status` on `complaints(category, status)` — Optimizes multi-facet dashboard filtering.
- `idx_transactions_timestamp` on `transactions(transaction_timestamp)` and `idx_transactions_receiver` on `transactions(receiver_identifier_id)` — Accelerates time-window velocity and anomaly detection.
- `idx_audit_logs_user_ts` on `audit_logs(user_id, created_at DESC)` — Rapid pagination for audit trail inspections.

---

## 3. PostgreSQL Recursive CTE Network Traversal Engine

### 3.1 Recursive Graph Logic
A cybercrime fraud network consists of a bipartite/multi-partite graph:
- **Nodes:** Complaints ($C$), Identifiers ($I$), and Transactions ($T$).
- **Edges:**
  - $C \leftrightarrow I$ via `complaint_identifiers`
  - $I \leftrightarrow T$ via `transactions`
  - $C_1 \leftrightarrow I \leftrightarrow C_2$ representing direct shared identifiers (Hop 1)
  - $C_1 \leftrightarrow I_1 \leftrightarrow C_2 \leftrightarrow I_2 \leftrightarrow C_3$ (Hop 2+)

### 3.2 SQL Recursive CTE Query Specification
```sql
WITH RECURSIVE fraud_network AS (
    -- Anchor member: Start from the target complaint
    SELECT 
        'COMPLAINT' AS source_type,
        c.complaint_id AS source_id,
        'IDENTIFIER' AS target_type,
        i.identifier_id AS target_id,
        i.type AS identifier_type,
        i.value AS identifier_value,
        1 AS depth,
        ARRAY[c.complaint_id::text] AS path
    FROM complaints c
    JOIN complaint_identifiers ci ON c.complaint_id = ci.complaint_id
    JOIN identifiers i ON ci.identifier_id = i.identifier_id
    WHERE c.complaint_id = $1

    UNION ALL

    -- Recursive member: Alternate between (Complaint -> Identifier) and (Identifier -> Complaint)
    SELECT 
        CASE 
            WHEN fn.target_type = 'IDENTIFIER' THEN 'IDENTIFIER'
            ELSE 'COMPLAINT'
        END AS source_type,
        fn.target_id AS source_id,
        CASE 
            WHEN fn.target_type = 'IDENTIFIER' THEN 'COMPLAINT'
            ELSE 'IDENTIFIER'
        END AS target_type,
        CASE 
            WHEN fn.target_type = 'IDENTIFIER' THEN ci.complaint_id::text
            ELSE i.identifier_id::text
        END AS target_id,
        CASE 
            WHEN fn.target_type = 'IDENTIFIER' THEN 'COMPLAINT'
            ELSE i.type
        END AS identifier_type,
        CASE 
            WHEN fn.target_type = 'IDENTIFIER' THEN c2.title
            ELSE i.value
        END AS identifier_value,
        fn.depth + 1 AS depth,
        fn.path || CASE 
            WHEN fn.target_type = 'IDENTIFIER' THEN ci.complaint_id::text
            ELSE i.identifier_id::text
        END
    FROM fraud_network fn
    -- Branch 1: If current target is an IDENTIFIER, traverse to other Complaints sharing this identifier
    LEFT JOIN complaint_identifiers ci 
        ON fn.target_type = 'IDENTIFIER' AND fn.target_id = ci.identifier_id
    LEFT JOIN complaints c2 
        ON ci.complaint_id = c2.complaint_id
    -- Branch 2: If current target is a COMPLAINT, traverse to other Identifiers linked to this Complaint
    LEFT JOIN complaint_identifiers ci2 
        ON fn.target_type = 'COMPLAINT' AND fn.target_id = ci2.complaint_id
    LEFT JOIN identifiers i 
        ON ci2.identifier_id = i.identifier_id
    WHERE fn.depth < $2 -- Maximum depth cutoff (e.g., 3 or 4 hops)
      AND NOT (
          CASE 
              WHEN fn.target_type = 'IDENTIFIER' THEN ci.complaint_id::text
              ELSE i.identifier_id::text
          END = ANY(fn.path)
      ) -- Loop prevention
)
SELECT * FROM fraud_network;
```

---

## 4. AI & Fraud Analysis Architecture

### 4.1 Hybrid Entity Extraction Service
The entity extraction pipeline employs a two-tier extraction architecture:
1. **Deterministic Rule Engine (Highest Confidence = 1.0):**
   - **Phone Numbers:** Regex parsing Indian standard mobile numbers (`+91`, `0`, or 10-digit prefixes starting with `6`, `7`, `8`, `9`).
   - **UPI IDs:** Regex capturing patterns `[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}` (e.g., `@okhdfcbank`, `@paytm`, `@ybl`, `@axl`).
   - **Bank Accounts & IFSC:** Bank account numbers (9–18 digit sequences with contextual prefix) and 11-character IFSC codes (`^[A-Z]{4}0[A-Z0-9]{6}$`).
   - **Domains / URLs:** Standard RFC compliant domain extraction with TLD validation (`.com`, `.in`, `.org`, `.xyz`, `.top`, `.tk`, etc.).
2. **Context-Aware NLP Extraction (Confidence 0.85-0.95):**
   - Keyword contextual tagging (e.g., identifying sender vs. beneficiary/fraudster roles).

### 4.2 Complaint Classification Engine
- **Categories:** `UPI_FRAUD`, `PHISHING`, `BANK_FRAUD`, `INVESTMENT_SCAM`, `JOB_SCAM`, `SHOPPING_FRAUD`, `IDENTITY_THEFT`, `ACCOUNT_TAKEOVER`, `OTHER`.
- **Model:** Scikit-learn TF-IDF Vectorizer + Multinomial Naive Bayes / Logistic Regression baseline trained on synthetic fraud complaint corpora.
- **Explainability:** Returns predicted category along with class confidence scores and top predictive n-grams.

### 4.3 Transparent Risk Scoring Model (0–100 Scale)
The risk score calculation evaluates 4 distinct explainable vectors:
1. **Identifier Reuse Factor ($R_i$, max 30 pts):**
   $$\text{Score}_R = \min(30, (\text{linked\_complaints} - 1) \times 10)$$
2. **Transaction Velocity & Anomaly Factor ($T_a$, max 25 pts):**
   $$\text{Score}_T = \min(25, \text{flagged\_anomalies} \times 12.5)$$
3. **Network Topological Density ($N_d$, max 25 pts):**
   $$\text{Score}_N = \min(25, (\text{distinct\_entities\_in\_ring} - 2) \times 5)$$
4. **Recurrence & Financial Exposure ($F_e$, max 20 pts):**
   $$\text{Score}_F = \min(20, \lfloor\text{total\_ring\_loss} / 50000\rfloor \times 5)$$

- **Total Score:** $\text{FinalRisk} = \text{Score}_R + \text{Score}_T + \text{Score}_N + \text{Score}_F \in [0, 100]$
- **Risk Bands:**
  - `0 - 30`: **LOW** (Single isolated complaint, no shared accounts)
  - `31 - 60`: **MEDIUM** (Single shared identifier or moderate amount)
  - `61 - 80`: **HIGH** (Multiple complaints sharing bank account or phone)
  - `81 - 100`: **CRITICAL** (Organized syndicate: shared beneficiary + multiple victims + anomalous velocity)

### 4.4 Transaction Anomaly Detection
- Statistical Z-score and sliding-window velocity detector:
  - Daily frequency baseline: 2–5 txns/day.
  - Anomaly trigger: $> 15$ txns/day or transaction amount $> 3\sigma$ above receiver baseline.

### 4.5 Grounded AI Investigation Summary
- Generates structured, non-defamatory, fact-grounded natural language briefs:
  - Strictly references existing records: "Complaint C001 shares beneficiary Bank Account B001 with 3 other complaints (C002, C004, C005)."
  - Uses neutral law-enforcement investigation terminology: "Identified syndication pattern", "potential beneficiary node", "recommends freeze review of account X".

---

## 5. Frontend & Visualization Architecture

### 5.1 Tech Stack
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS with custom Dark Cyber theme (`#0a0f1d`, `#111827`, `#00f2fe`, `#4facfe`, `#ef4444`, `#10b981`)
- **Graph Engine:** Cytoscape.js with `cola` / `cose-bilkent` physics layout, or React Flow for interactive drag-and-drop node graph exploration.
- **Charts:** Recharts for category distributions, velocity line charts, and risk dials.
- **Icons:** Lucide React.

### 5.2 Application Route Hierarchy
1. `/login` — Secure investigator portal authentication.
2. `/dashboard` — Master telemetry, KPI cards, category breakdown, high-risk case feed.
3. `/complaints` — Filterable complaint registry with status, priority, and date search.
4. `/complaints/new` — Interactive complaint intake with real-time "Analyze with AI" entity preview.
5. `/cases` — Active fraud investigation case board.
6. `/cases/:id` — Case workspace with entity cards, risk breakdown, transaction table, and AI summary generator.
7. `/cases/:id/network` — Fullscreen interactive fraud ring network visualizer.
8. `/networks` — Syndicate detector overview (global clusters).
9. `/transactions` — Transaction anomaly radar.
10. `/audit-logs` — Immutable investigator access ledger.

---

## 6. Security Architecture & RBAC

### 6.1 Authentication & Authorization
- **Password Security:** Password hashing using `bcryptjs` with work factor 10.
- **Session Tokens:** Stateless signed JSON Web Tokens (`HS256`) with expiration (8 hours) and user claims (`userId`, `username`, `role`).
- **Role-Based Access Control (RBAC):**
  - `ADMIN`: User management, global audit review, system parameters.
  - `INVESTIGATOR`: Complaint intake, case creation, entity confirmation, AI summary generation, status update.
  - `ANALYST`: Graph inspection, anomaly detection, read-only analytics, report export.

### 6.2 Defensive Security Measures
- **SQL Injection Prevention:** 100% Parameterized queries using prepared statements (`$1, $2, ...`). Zero raw string interpolation.
- **Rate Limiting:** Express rate limiting on `/api/auth/*` endpoints (e.g., max 10 attempts per 15 minutes).
- **Security Headers:** Helmet.js for CSP, HSTS, X-Content-Type-Options.
- **Audit Trails:** Automatic trigger / middleware logging for all state-mutating actions (`LOGIN`, `CREATE_COMPLAINT`, `CONFIRM_ENTITIES`, `RECALCULATE_RISK`, `UPDATE_CASE_STATUS`).

---

## 7. REST API Contract Specification

| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT token |
| `POST` | `/api/auth/register` | Admin | Registers new investigator account |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated profile |
| `GET` | `/api/dashboard/stats` | Authenticated | Summary KPIs, category aggregates, risk counts |
| `GET` | `/api/complaints` | Authenticated | Paginated, searchable complaints list |
| `POST` | `/api/complaints` | Investigator+ | Ingests new complaint and links extracted identifiers |
| `GET` | `/api/complaints/:id` | Authenticated | Detailed complaint profile with linked entities |
| `GET` | `/api/cases` | Authenticated | Active fraud cases list |
| `GET` | `/api/cases/:id` | Authenticated | Comprehensive case details with risk scores |
| `PATCH`| `/api/cases/:id/status`| Investigator+ | Updates case investigation status |
| `GET` | `/api/cases/:id/network`| Authenticated | Executes Recursive CTE and formats Cytoscape graph |
| `GET` | `/api/cases/:id/risk` | Authenticated | Returns detailed 4-factor risk breakdown |
| `POST` | `/api/cases/:id/recalculate-risk` | Investigator+ | Forces re-evaluation of network risk score |
| `POST` | `/api/cases/:id/ai-summary` | Investigator+ | Invokes AI service to generate narrative brief |
| `POST` | `/api/ai/extract` | Authenticated | Proxies text to AI service for entity extraction |
| `POST` | `/api/ai/classify` | Authenticated | Proxies text to AI service for category classification |
| `GET` | `/api/transactions` | Authenticated | Filterable transactions with anomaly indicators |
| `GET` | `/api/audit-logs` | Admin / Investigator | Chronological system action audit ledger |

---

## 8. Four-Person Academic Team Task Division

```
========================================================================================
PERSON 1: DATABASE + BACKEND LEAD
----------------------------------------------------------------------------------------
- Design 3NF PostgreSQL schema (schema.sql, indexes.sql, procedures.sql).
- Write seed synthetic data scripts (sample_data.sql) featuring the guaranteed demo rings.
- Implement PostgreSQL Recursive CTE graph traversal engine.
- Build Node.js / Express controllers for Complaints, Cases, Network, and Transactions.
- Configure Database Connection Pool and SQL parameterization.

========================================================================================
PERSON 2: AI + FRAUD ANALYSIS SPECIALIST
----------------------------------------------------------------------------------------
- Build Python FastAPI service (app/main.py, app/routes, app/services).
- Implement regex and NLP entity extractor for Phone, UPI, Bank Account, Domain.
- Train / construct scikit-learn complaint category classifier.
- Develop 4-factor explainable Risk Scoring Engine.
- Build Transaction Anomaly Detection service (velocity & Z-score).
- Implement fact-grounded natural language Investigation Summary generator.

========================================================================================
PERSON 3: FRONTEND + VISUALIZATION ENGINEER
----------------------------------------------------------------------------------------
- Scaffold React + Vite + Tailwind CSS dark cyber UI framework.
- Build Dashboard with real-time KPI tiles and Recharts graphs.
- Build Complaint Intake Form with live "Analyze with AI" entity review dialog.
- Implement interactive Graph Visualizer (Cytoscape.js / React Flow) with zoom, pan,
  depth selector, and node detail sidebar.
- Implement Risk Score Gauge & explanation breakdown component.

========================================================================================
PERSON 4: SECURITY + INTEGRATION + TESTING + DEVOPS
----------------------------------------------------------------------------------------
- Implement JWT authentication and RBAC middleware.
- Build Audit Logging middleware and audit trail viewer.
- Write Unit, Integration, and End-to-End verification test suites.
- Configure Docker Compose orchestrator for PostgreSQL, Node.js API, Python AI, React.
- Author comprehensive system documentation and academic defense guide.
========================================================================================
```

---

## 9. Phased Incremental Execution Plan

- **Phase 1: Project Architecture, Scaffolding & Git Setup**
  - Verify workspace, initialize Git, configure folder directory structure.
- **Phase 2: Database Schema, Normalization & Synthetic Seed Data**
  - Author `schema.sql`, `indexes.sql`, and `sample_data.sql` with guaranteed demo fraud rings.
- **Phase 3: Backend Setup & Database Connection Layer**
  - Express.js gateway, configuration, parameterized DB pool with dual PostgreSQL support.
- **Phase 4: Authentication & Authorization (RBAC)**
  - JWT auth, bcrypt password hashing, auth middleware, and user seeding.
- **Phase 5: Complaint CRUD & Management APIs**
  - Implement full complaint intake, retrieval, filtering, and audit integration.
- **Phase 6: Python FastAPI AI Service & Entity Extraction**
  - FastAPI setup, deterministic regex + NLP extraction, entity normalization.
- **Phase 7: Identifier Relationship Engine**
  - Linking complaints and canonical identifiers in 3NF junction tables.
- **Phase 8: PostgreSQL Recursive CTE Network Traversal Engine**
  - Multi-hop recursive graph query returning formatted nodes and edges.
- **Phase 9: Transparent 4-Factor Risk Scoring Engine**
  - Calculating 0–100 risk score and structured justification factors.
- **Phase 10: Fraud-Ring Detection & Network Discovery**
  - Global syndicate discovery, identifying multi-complaint clusters.
- **Phase 11: Transaction Anomaly Detection**
  - Velocity and Z-score thresholding flagged on financial transactions.
- **Phase 12: React Frontend Foundation & Dark Cyber Theme**
  - Vite + Tailwind setup, cyber palette, routing, authenticated layout, telemetry dashboard.
- **Phase 13: Complaint & Case Investigation Interfaces**
  - Intake form with "Analyze with AI" workflow, interactive entity confirmation.
- **Phase 14: Interactive Graph Visualization**
  - Cytoscape.js / React Flow integration with depth control, physics, and node inspection.
- **Phase 15: AI Investigation Summary Generation & UI**
  - Investigation brief generation modal with actionable recommendations.
- **Phase 16: Audit Trail & Security Ledger**
  - Immutable audit logs viewer with filtering by investigator and action.
- **Phase 17: Security Hardening**
  - Helmet, rate limiting, input sanitization, error shielding.
- **Phase 18: Testing & Verification**
  - Unit tests, integration tests, E2E demo workflow verification.
- **Phase 19: Docker Compose & Deployment Scripts**
  - Multi-service Docker Compose and automated local bootstrap scripts.
- **Phase 20: Comprehensive Documentation & Academic Defense Materials**
  - Architecture docs, ER diagrams, normalization proofs, API docs, team presentations.

---

## 10. Guaranteed Academic Demo Scenario

To guarantee bulletproof academic presentation and testing, the seed data includes **Syndicate Alpha (The Task/Investment Scam Ring)**:

```
[Complaint C001] (Victim 1 - ₹50,000 lost)
      |
      +---> [UPI ID: fastrefund@okaxis]
      |
      +---> [Bank Account: 987654321012, HDFC0001234] <---+
                                                          |
[Complaint C002] (Victim 2 - ₹1,20,000 lost)              |
      |                                                   |
      +---> [Phone: +919876543210] <----------------+     |
      |                                              |     |
      +----------------------------------------------+-----+
                                                     |
[Complaint C003] (Victim 3 - ₹35,000 lost)           |
      |                                              |
      +---> [Phone: +919876543210] ------------------+
      |
      +---> [Domain: secure-kyc-update.xyz] <--------+
                                                     |
[Complaint C004] (Victim 4 - ₹85,000 lost)           |
      |                                              |
      +---> [Domain: secure-kyc-update.xyz] ---------+
      |
      +---> [Bank Account: 987654321012, HDFC0001234] (Loop closed!)
```

**Traversal Trace:**
$$C001 \longleftrightarrow \text{Bank001} \longleftrightarrow C002 \longleftrightarrow \text{Phone001} \longleftrightarrow C003 \longleftrightarrow \text{Domain001} \longleftrightarrow C004 \longleftrightarrow \text{Bank001}$$

- **Network Metrics:** 4 Complaints, 4 Shared Identifiers, ₹2,90,000 Total Losses.
- **Risk Score:** **92 / 100 — CRITICAL**.
- **Explanation:** Closed graph cycle, cross-identifier reuse across 4 victims, suspicious domain association.
