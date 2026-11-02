# CYBERMESH: Verification & Testing Strategy

## 1. Test Suite Organization

CyberMesh includes test suites covering every tier:
1. **AI Microservice Unit Tests:** `ai-service/tests/test_ai.py`
   - Validates regex extraction of Phone, UPI, Bank Account, IFSC, and Domain.
   - Validates Naive Bayes classification and confidence scores.
   - Validates statistical Z-score transaction anomaly detection.
   - Validates fact-grounded natural language summary synthesis.
2. **Backend API Integration Tests:** `backend/tests/api.test.js`
   - Validates JWT authentication and role authorization.
   - Validates complaint pagination, filtering, and creation.
   - Validates PostgreSQL Recursive CTE graph traversal on Syndicate Alpha.
   - Validates explainable 4-factor risk scoring.
   - Validates immutable audit logging.
3. **End-to-End Investigation Workflow:** `tests/e2e_investigation_workflow.test.js`
   - Simulates the full Section 42 investigation scenario from login to complaint ingestion, AI entity extraction, graph discovery, risk scoring, AI summary, and audit verification.

---

## 2. How to Run All Tests

### Run Backend API Integration Tests:
```bash
npm --prefix backend test
```

### Run AI Microservice Tests:
```bash
.\ai-service\venv\Scripts\python ai-service\tests\test_ai.py
```

### Run End-to-End Investigation Workflow Test:
```bash
node --test tests/e2e_investigation_workflow.test.js
```
