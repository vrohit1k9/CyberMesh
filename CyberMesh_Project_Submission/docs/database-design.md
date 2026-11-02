# CYBERMESH: Database Design & Normalization Specification

## 1. System Data Model & Relational Overview

The CyberMesh database is specifically structured for cybercrime investigative intelligence, enabling rapid detection of shared identifiers across seemingly unrelated complaints.

### 1.1 Core Entities & Primary Keys
1. **`roles`**: (`role_id` PK) - RBAC roles (`ADMIN`, `INVESTIGATOR`, `ANALYST`).
2. **`users`**: (`user_id` PK) - Investigators and system operators with bcrypt hashes.
3. **`complaints`**: (`complaint_id` PK) - Cybercrime complaints reported by citizens.
4. **`identifiers`**: (`identifier_id` PK) - Canonical polymorphic identifier entity (`PHONE`, `UPI`, `BANK_ACCOUNT`, `DOMAIN`, etc.).
5. **`complaint_identifiers`**: (`id` PK, `(complaint_id, identifier_id)` UNIQUE) - M:N associative entity mapping complaints to identifiers with confidence score and role in fraud.
6. **`phone_numbers`**: (`identifier_id` PK, FK -> `identifiers`) - Telecom metadata (carrier, VoIP flag).
7. **`upi_ids`**: (`identifier_id` PK, FK -> `identifiers`) - Virtual Payment Address details.
8. **`bank_accounts`**: (`identifier_id` PK, FK -> `identifiers`) - Core banking details (Account number, IFSC code, bank branch).
9. **`domains`**: (`identifier_id` PK, FK -> `identifiers`) - Phishing infrastructure details (Domain name, registrar, IP, TLD).
10. **`transactions`**: (`transaction_id` PK) - Monetary movement tracking between identifiers.
11. **`fraud_cases`**: (`case_id` PK) - Case files tracking organized syndicates.
12. **`risk_scores`**: (`score_id` PK, `case_id` UNIQUE FK) - Explainable 4-factor risk breakdown (0-100).
13. **`case_relationships`**: (`relationship_id` PK) - Discovered graph edges between complaints.
14. **`audit_logs`**: (`log_id` PK) - Immutable compliance trail of all investigator operations.

---

## 2. Formal Normalization Proofs (1NF, 2NF, 3NF)

### 2.1 First Normal Form (1NF)
**Condition:** Each column must contain only atomic (indivisible) values, and each record must be unique.
- **Violation Avoided:** Storing multiple phone numbers or UPI handles as comma-separated text strings within the `complaints` table is strictly prohibited.
- **Resolution:** All identifiers are decomposed into the dedicated `identifiers` table and linked through the `complaint_identifiers` associative entity. Every attribute in every table contains atomic scalars.

### 2.2 Second Normal Form (2NF)
**Condition:** The relation is in 1NF, and every non-prime attribute is fully functionally dependent on the primary key (no partial dependencies on a composite candidate key).
- In the M:N relationship between `complaints` and `identifiers`, the functional dependencies are:
  - `(complaint_id, identifier_id) -> role_in_fraud, confidence_score, extracted_by`
- If we had included `bank_name` or `phone_carrier` in `complaint_identifiers`, that would be a partial dependency because `bank_name` depends only on `identifier_id`, not on `complaint_id`.
- **Resolution:** All identifier-specific attributes are factored out into subtype tables (`bank_accounts`, `phone_numbers`, etc.) keyed solely on `identifier_id`. Thus, 2NF is strictly satisfied.

### 2.3 Third Normal Form (3NF)
**Condition:** The relation is in 2NF, and no non-prime attribute is transitively dependent on any candidate key ($X \to Y$ and $Y \to Z$ where $Z$ is non-prime is eliminated).
- **Potential Transitive Dependency:** In a naive complaints table:
  `complaint_id -> bank_account_number -> bank_name, ifsc_code`
  Here, `bank_name` transitively depends on `complaint_id` through `bank_account_number`.
- **Resolution:** We decomposed the entities:
  - `complaints` contains only incident-specific data.
  - `complaint_identifiers` maps incident to identifier.
  - `bank_accounts` stores `(account_number, ifsc_code) -> bank_name, branch_name`.
  - Every non-prime attribute depends directly on the primary key, the whole primary key, and nothing but the primary key. Hence, **3NF is fully satisfied**.

---

## 3. Functional Dependencies & Candidate Keys

| Table | Candidate Keys | Functional Dependencies |
|---|---|---|
| `roles` | `role_id`, `role_name` | `role_id -> role_name, description` |
| `users` | `user_id`, `username`, `email` | `user_id -> username, password_hash, role_id, email, full_name, badge_number` |
| `complaints` | `complaint_id` | `complaint_id -> title, description, reported_amount, reported_date, category, status, priority, location, created_by` |
| `identifiers` | `identifier_id`, `(type, value)` | `identifier_id -> type, value, first_seen_at, last_seen_at, risk_weight` |
| `complaint_identifiers` | `id`, `(complaint_id, identifier_id)` | `id -> complaint_id, identifier_id, role_in_fraud, confidence_score, extracted_by` |
| `bank_accounts` | `identifier_id`, `(account_number, ifsc_code)` | `identifier_id -> account_number, ifsc_code, bank_name, branch_name` |
| `transactions` | `transaction_id` | `transaction_id -> complaint_id, sender_identifier_id, receiver_identifier_id, amount, timestamp, payment_channel, is_flagged_anomaly` |
| `fraud_cases` | `case_id` | `case_id -> case_title, primary_complaint_id, assigned_investigator_id, status, ai_summary` |
| `risk_scores` | `score_id`, `case_id` | `case_id -> final_score, risk_level, identifier_reuse_score, transaction_anomaly_score, network_density_score` |

---

## 4. Indexing Strategy & Performance Justification

1. **`idx_identifiers_type_val` on `identifiers(type, value)`**:
   - **Type:** Unique B-Tree Index.
   - **Justification:** Accelerates entity deduplication during automated AI extraction and manual ingestion. Prevents duplicate entity insertion.
2. **`idx_ci_complaint_id` and `idx_ci_identifier_id` on `complaint_identifiers`**:
   - **Type:** B-Tree Index.
   - **Justification:** Essential for graph traversal. Every step of the PostgreSQL recursive CTE traverses across this bridge table.
3. **`idx_complaints_cat_status` on `complaints(category, status)`**:
   - **Type:** Composite B-Tree Index.
   - **Justification:** Eliminates table scans for the dashboard summary query and investigator filtering.
4. **`idx_tx_receiver_timestamp` on `transactions(receiver_identifier_id, transaction_timestamp DESC)`**:
   - **Type:** Composite B-Tree Index.
   - **Justification:** Powers transaction velocity calculations and real-time money mule anomaly detection.
5. **`idx_risk_scores_final` on `risk_scores(final_score DESC, risk_level)`**:
   - **Type:** Composite Index.
   - **Justification:** Quickly prioritizes critical cases on the investigator dashboard.
