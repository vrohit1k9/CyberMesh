# CyberMesh AI Microservice

## Responsibilities (Team Member 2)
- Python FastAPI microservice.
- Deterministic regex & rule entity extractor for Phone, UPI, Bank Account, IFSC, and Domains.
- Scikit-learn TF-IDF + Multinomial Naive Bayes complaint category classifier.
- Statistical transaction anomaly detector (Z-Score + sliding window velocity).
- Grounded, non-defamatory AI investigation brief summarizer.

## How to Run
```bash
py -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\uvicorn app.main:app --port 8000 --reload
```

## How to Test
```bash
.\venv\Scripts\python tests/test_ai.py
```
