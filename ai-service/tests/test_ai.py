import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.extractor import extract_entities_from_text
from app.services.classifier import get_classifier
from app.services.anomaly import detect_transaction_anomalies
from app.services.summarizer import generate_investigation_summary
from app.models.schemas import TransactionItem, SummarizeRequest

def test_entity_extraction():
    sample_text = (
        "Victim received call from 9876543210 regarding urgent KYC update. "
        "Instructed to transfer Rs 50000 to fastrefund@okaxis and account 987654321012 with IFSC HDFC0001234. "
        "Also visited suspicious website secure-kyc-update.xyz."
    )
    entities = extract_entities_from_text(sample_text)
    types = {e.type for e in entities}
    values = {e.value for e in entities}

    print("[Test Extract] Detected entity types:", types)
    assert "PHONE" in types, "Should detect PHONE"
    assert "UPI" in types, "Should detect UPI"
    assert "BANK_ACCOUNT" in types, "Should detect BANK_ACCOUNT"
    assert "DOMAIN" in types, "Should detect DOMAIN"
    assert "+919876543210" in values, "Should format canonical phone"
    assert "fastrefund@okaxis" in values, "Should extract UPI"
    assert "secure-kyc-update.xyz" in values, "Should extract domain"
    print("PASS: Entity extraction tests passed!")

def test_classifier():
    clf = get_classifier()
    cat, conf, probas, kws = clf.classify("Victim transferred money to fake UPI qr code for refund on gpay")
    print(f"[Test Classify] Predicted: {cat} (conf: {conf}), keywords: {kws}")
    assert cat in clf.classes_, "Predicted class should be valid"
    assert conf > 0.0, "Confidence should be positive"
    print("PASS: Classifier tests passed!")

def test_anomaly_detection():
    txns = [
        TransactionItem(transaction_id="TX1", amount=5000.0, timestamp="2026-02-01T10:00:00Z", receiver_id="R1"),
        TransactionItem(transaction_id="TX2", amount=4500.0, timestamp="2026-02-01T10:10:00Z", receiver_id="R1"),
        TransactionItem(transaction_id="TX3", amount=5200.0, timestamp="2026-02-01T10:20:00Z", receiver_id="R1"),
        TransactionItem(transaction_id="TX4", amount=250000.0, timestamp="2026-02-01T10:30:00Z", receiver_id="R1"), # Anomaly
    ]
    res = detect_transaction_anomalies(txns)
    print(f"[Test Anomaly] Flagged count: {res['flagged_count']}, IDs: {res['flagged_ids']}")
    assert "TX4" in res['flagged_ids'], "Should flag extreme outlier"
    print("PASS: Anomaly detection tests passed!")

def test_summarizer():
    req = SummarizeRequest(
        case_id="CASE-2026-001",
        category="INVESTMENT_SCAM",
        complaint_title="Telegram Task Scam",
        complaint_description="Victim lured into task investment.",
        risk_score=92,
        risk_level="CRITICAL",
        connected_complaints=["CMP-2026-0001", "CMP-2026-0002", "CMP-2026-0003"],
        connected_identifiers=[
            {"type": "BANK_ACCOUNT", "value": "987654321012@HDFC0001234"},
            {"type": "PHONE", "value": "+919876543210"}
        ],
        total_financial_loss=290000.0
    )
    summary = generate_investigation_summary(req)
    print("[Test Summary] Generated summary:\n", summary["narrative_summary"])
    assert "CASE-2026-001" in summary["narrative_summary"]
    assert len(summary["suspicious_patterns"]) > 0
    assert len(summary["investigative_recommendations"]) > 0
    print("PASS: AI Summarizer tests passed!")

if __name__ == '__main__':
    test_entity_extraction()
    test_classifier()
    test_anomaly_detection()
    test_summarizer()
    print("\nALL AI SERVICE TESTS PASSED SUCCESSFULLY!")
