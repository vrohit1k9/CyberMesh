# CYBERMESH: System Architecture Document

## 1. Executive Summary & Purpose
**CyberMesh** is an academic investigation intelligence platform designed to discover hidden syndication structures across cybercrime complaints. Real-world cybercrime perpetrators rarely interact directly with victims using identical identities across all campaigns; instead, they operate multi-tier infrastructure networks sharing mule bank accounts, spoofed VoIP phone lines, virtual payment addresses (UPI VPAs), and lookalike phishing domains.

CyberMesh bridges the gap between isolated complaint filings and network-level syndicate disruption through:
- **Relational Normalization (3NF)**: Canonical entity deduplication and structured graph modeling in PostgreSQL.
- **PostgreSQL Recursive Common Table Expressions (CTE)**: Multi-hop graph discovery without external graph database dependencies.
- **AI Microservice**: High-precision deterministic entity extraction, machine-learning complaint classification, statistical anomaly detection, and grounded narrative synthesis.
- **Dark Cyber Visualizer**: Interactive Cytoscape.js canvas enabling investigators to trace money flows and closed-loop syndicates.

---

## 2. Component Topology

```
+-------------------------------------------------------------------------+
|                        REACT FRONTEND (Vite SPA)                        |
| - Cytoscape.js Graph Engine with physics & depth hop selector           |
| - Real-time Recharts KPI dashboards & telemetry monitors                |
| - Investigative Intake Workspace with Live "Analyze with AI" Modal      |
+------------------------------------+------------------------------------+
                                     |
                                     | REST (JSON over HTTPS / Bearer JWT)
                                     v
+-------------------------------------------------------------------------+
|                      NODE.JS / EXPRESS API GATEWAY                      |
| - Authentication Controller (JWT + Bcrypt work factor 10)               |
| - Role-Based Access Control (RBAC: ADMIN, INVESTIGATOR, ANALYST)       |
| - Recursive CTE Graph Traversal & Risk Scoring Services                 |
| - Immutable Audit Logging Ledger                                        |
+------------------+----------------------------------+-------------------+
                   |                                  |
                   | SQL Queries / CTEs               | HTTP REST Proxy
                   v                                  v
+------------------------------------+   +--------------------------------+
|       POSTGRESQL 3NF DATABASE      |   |   PYTHON FASTAPI AI ENGINE     |
| - 12 Relations (3NF Normalized)    |   | - Regex & Rule Extractor       |
| - B-Tree & Functional Indexes      |   | - Scikit-learn TF-IDF Clf      |
| - Recursive Graph CTE Procedures   |   | - Anomaly Z-Score & Velocity   |
| - Audit Trail Ledger Storage       |   | - Fact-Grounded Summarizer     |
+------------------------------------+   +--------------------------------+
```

---

## 3. Four-Person Academic Team Task Division

| Team Member | Domain Responsibility | Key Deliverables |
|---|---|---|
| **Member 1** | Database & Backend Architect | 3NF Schema, Indexing Strategy, Recursive CTE Traversal Engine, Complaint & Case CRUD APIs |
| **Member 2** | AI & Fraud Analysis Specialist | FastAPI microservice, Regex & Rule Extractor, Scikit-learn Classifier, Risk Engine, Summarizer |
| **Member 3** | Frontend & Visualization Engineer | React + Vite architecture, Dark Cyber UI, Cytoscape.js interactive graph, Recharts telemetry |
| **Member 4** | Security, Integration & DevOps | JWT + RBAC authorization, Audit Logging, Automated Test Suites, Docker Compose orchestration |
