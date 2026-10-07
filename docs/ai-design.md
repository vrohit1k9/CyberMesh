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
