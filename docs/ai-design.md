# CYBERMESH: AI & Machine Learning Design Specification

## 1. Design Philosophy: Determinism Over Hallucination
In criminal and financial intelligence, hallucinated evidence or misidentified identifiers can derail an investigation. Therefore, CyberMesh establishes **deterministic precedence**:
1. **Rule & Regex Layer (Confidence 0.95 - 1.0):** Strictly validates phone numbers, UPI VPAs, bank accounts, IFSC formats, and RFC-compliant domains.
2. **Supervised ML Layer:** Classifies complaint text into known incident archetypes using Scikit-learn TF-IDF + Multinomial Naive Bayes.
3. **Statistical Anomaly Detection:** Identifies abnormal financial volume using Z-score outlier analysis ($Z \ge 2.2$) and sliding-window velocity thresholding.
4. **Constrained Natural Language Summarizer:** Compiles findings into concise briefs based strictly on topological records present in the database graph.

---

## 2. Supervised Complaint Classifier
- **Model Architecture:**
  - Feature Extractor: `TfidfVectorizer(ngram_range=(1, 2), stop_words='english')`
  - Classifier: `MultinomialNB(alpha=0.1)`
- **Target Classes:**
  - `UPI_FRAUD`
  - `PHISHING`
  - `BANK_FRAUD`
  - `INVESTMENT_SCAM`
  - `JOB_SCAM`
  - `SHOPPING_FRAUD`
  - `IDENTITY_THEFT`
  - `ACCOUNT_TAKEOVER`
  - `OTHER`
- **Explainability:** Returns predicted category, class confidence, and top predictive n-gram feature tokens.

---

## 3. Explainable 4-Factor Risk Engine
The risk engine synthesizes four orthogonal vectors into a transparent 0–100 score:
$$\text{Score} = \text{Factor}_{\text{Reuse}} + \text{Factor}_{\text{Anomaly}} + \text{Factor}_{\text{Density}} + \text{Factor}_{\text{Exposure}}$$

| Vector | Max Weight | Logic / Calculation |
|---|---|---|
| **Identifier Reuse** | 30 pts | $\min(30, (\text{linked\_complaints} - 1) \times 10)$ |
| **Transaction Anomaly** | 25 pts | $\min(25, \text{flagged\_anomalies} \times 6.5)$ |
| **Network Density** | 25 pts | Structural complexity: number of entity classes $\times$ distinct nodes |
| **Financial Exposure** | 20 pts | Financial loss tiers: $> ₹2L \to 20\text{ pts}$, $> ₹1L \to 15\text{ pts}$ |

---

## 4. Grounded AI Summarization
- Produces objective, non-defamatory narrative summaries.
- Recommends actionable statutory steps:
  - Section 91 CrPC notice for bank account statement freeze.
  - Telecom Call Detail Record (CDR) requests.
  - Registrar domain suspension requests.

---

## 5. Retrieval-Augmented Generation (RAG) Architecture: UPI Fraud Specialization

CyberMesh incorporates a specialized **Retrieval-Augmented Generation (RAG)** engine focused specifically on **UPI (Unified Payments Interface) Cyber-Financial Fraud**:

```
+-------------------------------------------------------------+
|        AUTHORITATIVE UPI FRAUD KNOWLEDGE CORPUS             |
| - NPCI QR Code Reverse Payment Deception Protocol (DOC-001) |
| - NPCI Collect Request PIN Trap Analysis (DOC-002)          |
| - Remote Desktop APK Siphoning Protocols (DOC-003)          |
| - Telegram VIP Task / Payout Mule Layering (DOC-004)        |
| - Search Engine SEO Poisoning Helpline Traps (DOC-005)      |
| - High-Velocity Money Mule Layering & Rapid P2P (DOC-006)   |
| - SIM Swap & Unsolicited Device Binding Hijacking (DOC-007) |
+------------------------------+------------------------------+
                               |
                               v TF-IDF Sparse Embedding Index
+-------------------------------------------------------------+
|                    SEMANTIC RETRIEVER                       |
| Cosine Similarity matching over Complaint Query Vectors     |
+------------------------------+------------------------------+
                               |
              Top-k Matched MO + Statutory SOPs
                               v
+-------------------------------------------------------------+
|              RETRIEVAL-AUGMENTED SYNTHESIZER                |
|  - Empirical Graph Facts (PostgreSQL Recursive CTE)         |
|  - Matched UPI Modus Operandi & Relevance Percentage        |
|  - Statutory Directives (NPCI CFCFRMS, Sec 91 CrPC, RBI)    |
|  - Mandatory Evidence Preservation Checklist for Officers   |
+-------------------------------------------------------------+
```

### Knowledge Base Documents:
1. **DOC-UPI-001:** NPCI Protocol: QR Code 'Scan to Receive Money' Reverse Payment Deception (`UPI_QR_CODE_SCAM`)
2. **DOC-UPI-002:** NPCI Collect Request (Approval Request) Social Engineering & PIN Trap (`UPI_COLLECT_REQUEST_SCAM`)
3. **DOC-UPI-003:** Remote Desktop APK Siphoning & UPI PIN Snooping (`UPI_REMOTE_ACCESS_FRAUD`)
4. **DOC-UPI-004:** Telegram VIP Task & Investment Payout Scam with Mule UPI Routing (`UPI_TASK_INVESTMENT_SCAM`)
5. **DOC-UPI-005:** Search Engine Poisoning & Fake Helpline UPI Token Debit Trap (`UPI_CUSTOMER_CARE_IMPERSONATION`)
6. **DOC-UPI-006:** High-Velocity Money Mule Layering & Rapid UPI P2P Dispersal (`UPI_MONEY_MULE_LAYERING`)
7. **DOC-UPI-007:** SIM Swap & Unsolicited Device Binding UPI Account Hijacking (`UPI_SIM_SWAP_TAKEOVER`)

### Statutory Integration:
Every generated investigation summary pairs empirical graph evidence with exact statutory SOPs:
- **1930 / I4C CFCFRMS**: Immediate debit freeze broadcast.
- **Section 91 CrPC**: Requisition to Payment Service Provider (PSP) bank & Third Party Application Provider (TPAP - PhonePe, Google Pay, Paytm) for device IMEI, IMSI, and IPDR.
- **RBI Circular DPSS.CO.PD.No.1417/02.14.006/2018-19**: Customer zero/limited liability dispute filing.
- **Section 66D IT Act 2000 & Section 318(4) BNS**: Substantive criminal penal codes.
