# CYBERMESH: REST API Documentation

Base URL: `/api`

All authenticated endpoints require an `Authorization: Bearer <JWT>` header.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates user credentials and issues an 8-hour JWT token.
- **Request Body:**
  ```json
  { "username": "investigator_raj", "password": "CyberMesh2026!" }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "userId": 2,
        "username": "investigator_raj",
        "email": "rajesh.kumar@cybermesh.gov.in",
        "fullName": "Rajesh Kumar",
        "badgeNumber": "CYBER-INV-104",
        "role": "INVESTIGATOR"
      }
    }
  }
  ```

### `GET /api/auth/me`
Returns current authenticated user profile.

### `POST /api/auth/logout`
Logs user logout and records an audit log event.

---

## 2. Complaint Management Endpoints

### `GET /api/complaints`
Returns paginated complaints with search and category filters.
- **Query Params:** `search`, `category`, `status`, `priority`, `page`, `limit`, `sortBy`, `sortOrder`.

### `POST /api/complaints`
Ingests a new complaint along with verified extracted identifiers.
- **Request Body:**
  ```json
  {
    "title": "Telegram Task Scam via UPI",
    "description": "Caller directed victim to pay via UPI fastrefund@okaxis...",
    "reported_amount": 50000,
    "category": "INVESTMENT_SCAM",
    "priority": "HIGH",
    "identifiers": [
      { "type": "UPI", "value": "fastrefund@okaxis", "roleInFraud": "BENEFICIARY" }
    ]
  }
  ```

### `GET /api/complaints/:id`
Returns full complaint record and linked identifiers.

---

## 3. Cases & Network Traversal Endpoints

### `GET /api/cases`
Lists all fraud cases sorted by priority risk score.

### `GET /api/cases/:id`
Retrieves comprehensive case dossier, risk factors, and investigation notes.

### `PATCH /api/cases/:id/status`
Updates case status (`ACTIVE`, `IN_REVIEW`, `ESCALATED`, `DISRUPTED`, `CLOSED`) and diary notes.

### `GET /api/cases/:id/network?depth=3`
Executes the PostgreSQL Recursive Common Table Expression (CTE) query to discover connected complaints and identifiers up to `depth` hops.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "nodes": [
        { "id": "c_CMP-2026-0001", "type": "COMPLAINT", "label": "CMP-2026-0001", "data": { "amount": 50000 } },
        { "id": "i_1", "type": "BANK_ACCOUNT", "label": "987654321012@HDFC0001234", "data": { ... } }
      ],
      "edges": [
        { "id": "edge_c_CMP-2026-0001_i_1", "source": "c_CMP-2026-0001", "target": "i_1", "label": "BENEFICIARY" }
      ],
      "metrics": {
        "totalComplaints": 4,
        "totalIdentifiers": 4,
        "totalExposedAmount": 290000,
        "isSyndicateRing": true
      }
    }
  }
  ```

### `GET /api/cases/network/global`
Discovers all multi-complaint fraud syndicates globally across the database.

---

## 4. Risk Scoring Endpoints

### `GET /api/cases/:id/risk`
Returns the explainable 4-factor risk breakdown (0 to 100).

### `POST /api/cases/:id/recalculate-risk`
Forces recalculation of the risk score based on fresh graph topology.

---

## 5. AI Microservice Gateway Endpoints

### `POST /api/ai/extract`
Extracts `PHONE`, `UPI`, `BANK_ACCOUNT`, and `DOMAIN` entities from raw complaint text.

### `POST /api/cases/:id/ai-summary`
Generates a fact-grounded natural language investigation narrative with actionable CrPC statutory recommendations.

---

## 6. Audit & Dashboard Endpoints

### `GET /api/dashboard/stats`
Returns aggregated real-time database KPIs, category breakdowns, risk distributions, and transaction anomaly metrics.

### `GET /api/audit-logs`
Returns the immutable chronological action log.
