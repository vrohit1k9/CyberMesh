# CYBERMESH — FRAUD COMPLAINT & FRAUD-RING TRACKER
### Academic Cybersecurity & Database Management Systems (DBMS) Research Platform

---

## 1. Project Overview
**CyberMesh** is a specialized cybercrime investigation platform focused on **UPI (Unified Payments Interface) Cyber-Financial Fraud and Syndicate Ring Tracking**. Rather than treating complaint files as isolated records, CyberMesh applies **database graph traversal (PostgreSQL Recursive CTEs)**, **Retrieval-Augmented Generation (RAG) over authoritative NPCI/RBI fraud corpora**, **AI-powered deterministic entity extraction**, **transparent 4-factor risk scoring**, and **interactive network visualization** to automatically expose organized cyber fraud syndicates.

### Core Capabilities
- **Specialized UPI Fraud Focus:** Tailored for UPI Modus Operandi (QR Code Reverse Payment Scams, Inbound Collect Request Traps, Remote Desktop APK PIN Snooping, Telegram VIP Task Mules, Search Engine Poisoned Helplines, and SIM Swap Re-binding).
- **Retrieval-Augmented Generation (RAG):** AI engine indexes authoritative NPCI procedural guidelines, RBI customer liability circulars, and Section 91 CrPC freeze protocols; retrieves exact Modus Operandi matches and synthesizes cited statutory SOPs.
- **Relational 3NF Database:** 12 normalized relations with foreign keys, checks, and composite indexes.
- **Recursive CTE Graph Traversal:** Discovers connected complaints up to $N$ hops via shared Bank Accounts, UPI handles, Phone numbers, and Phishing Domains.
- **Explainable 4-Factor Risk Engine:** Transparent 0–100 risk score breakdown (Identifier reuse, Anomaly velocity, Network density, Financial exposure).
- **AI Microservice:** Fast, deterministic regex extraction, Scikit-learn TF-IDF complaint classifier, statistical Z-score transaction anomaly detector, and RAG-grounded natural language investigation briefs.
- **Dark Cyber UI:** React 18, Vite, Tailwind CSS, Cytoscape.js interactive network graph, and Recharts telemetry.
- **Security & Forensic Integrity:** Bcrypt password hashing, JWT RBAC (`ADMIN`, `INVESTIGATOR`, `ANALYST`), rate limiting, and immutable audit logs.

---

## 2. Guaranteed Demo Scenario (Syndicate Alpha)

CyberMesh includes a guaranteed closed-loop syndicate in the synthetic seed data:
```
[Complaint C001] (Victim 1 - ₹50,000 lost)
      |
      +---> [UPI ID: fastrefund@okaxis]
      |
      +---> [Bank Account: 987654321012@HDFC0001234] <---+
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
      +---> [Bank Account: 987654321012@HDFC0001234] (Loop closed!)
```

---

## 3. Quick Start & Execution

### Option A: Zero-Config Local Launch (Node.js & Python)
1. **Initialize Database:**
   ```bash
   cd backend
   npm install
   npm run db:init
   ```
2. **Start Backend API Gateway & Web Client:**
   ```bash
   npm start
   ```
   *The server runs on `http://localhost:5000` (serving both the REST API Gateway and the compiled Dark Cyber Web Client).*

3. **Start Python AI Microservice (Optional / Parallel):**
   ```bash
   cd ai-service
   py -m venv venv
   .\venv\Scripts\pip install -r requirements.txt
   .\venv\Scripts\uvicorn app.main:app --port 8000
   ```
   *(Note: The Node.js gateway automatically falls back to internal deterministic extraction if the Python service is offline).*

4. **Access the Web Dashboard:**
   Open browser at: **`http://localhost:5000`** (or `http://localhost:5173` if running Vite dev server).
   - **Demo Investigator:** `investigator_raj` / `CyberMesh2026!`
   - **Demo Analyst:** `analyst_priya` / `CyberMesh2026!`
   - **Demo Admin:** `admin` / `CyberMesh2026!`
   *(Quick 1-click test login buttons are provided on the login screen).*

### Option B: Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:80`
- API Gateway: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 4. Running Verification Test Suites

1. **Backend Integration & Recursive CTE Tests:**
   ```bash
   cd backend
   npm test
   ```
2. **AI Microservice Algorithms Test:**
   ```bash
   .\ai-service\venv\Scripts\python ai-service\tests\test_ai.py
   ```
3. **End-to-End Complete Investigation Workflow Test:**
   ```bash
   node --test tests/e2e_investigation_workflow.test.js
   ```

---

## 5. Team Ownership (4-Person Team Distribution)
- **Member 1 (Database + Backend):** PostgreSQL 3NF schema, indexes, procedures, recursive CTE engine, Express controllers.
- **Member 2 (AI + Fraud Analysis):** FastAPI microservice, entity extraction, category classifier, risk engine, anomaly detector, AI summarizer.
- **Member 3 (Frontend + Visualization):** React 18, dark cyber UI, Cytoscape.js interactive graph visualizer, Recharts telemetry, complaint intake forms.
- **Member 4 (Security, Testing & DevOps):** JWT & RBAC authorization, audit logging ledger, E2E test suites, Docker Compose orchestrator, documentation.
