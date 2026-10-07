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

from app.services.rag_engine import get_rag_engine

def test_rag_engine():
    rag = get_rag_engine()
    
    # 1. Test QR Code Scam Query
    qr_query = "Victim scanned a QR code sent on WhatsApp to receive money on OLX and entered upi pin"
    qr_results = rag.retrieve(qr_query, top_k=2)
    print(f"[Test RAG] QR Query top match: {qr_results[0]['doc_id']} - {qr_results[0]['title']} ({qr_results[0]['relevance_percentage']})")
    assert len(qr_results) > 0, "Should retrieve matches for QR code scam"
    assert qr_results[0]["category"] == "UPI_QR_CODE_SCAM", "Should match UPI_QR_CODE_SCAM"
    assert len(qr_results[0]["statutory_sops"]) > 0, "Should provide statutory SOPs"

    # 2. Test Collect Request Scam Query
    collect_query = "Victim received a PhonePe collect request asking to approve refund for electricity bill"
    collect_results = rag.retrieve(collect_query, top_k=2)
    print(f"[Test RAG] Collect Query top match: {collect_results[0]['doc_id']} - {collect_results[0]['title']} ({collect_results[0]['relevance_percentage']})")
    assert len(collect_results) > 0, "Should retrieve matches for collect request scam"
    assert collect_results[0]["category"] == "UPI_COLLECT_REQUEST_SCAM", "Should match UPI_COLLECT_REQUEST_SCAM"

    print("PASS: RAG Engine tests passed!")

def test_summarizer():
    req = SummarizeRequest(
        case_id="CASE-2026-001",
        category="UPI_FRAUD",
        complaint_title="OLX QR Code Reverse Payment Trap",
        complaint_description="Buyer sent PhonePe QR code to scan for receiving used car payment, resulting in unauthorized debit.",
        risk_score=92,
        risk_level="CRITICAL",
        connected_complaints=["CMP-2026-0001", "CMP-2026-0002", "CMP-2026-0003"],
        connected_identifiers=[
            {"type": "BANK_ACCOUNT", "value": "987654321012@HDFC0001234"},
            {"type": "UPI", "value": "fastrefund@okaxis"},
            {"type": "PHONE", "value": "+919876543210"}
        ],
        total_financial_loss=290000.0
    )
    summary = generate_investigation_summary(req)
    print("[Test Summary] Generated summary:\n", summary["narrative_summary"])
    assert "CASE-2026-001" in summary["narrative_summary"]
    assert "upi_modus_operandi" in summary, "RAG should attach matched UPI Modus Operandi"
    assert summary["upi_modus_operandi"]["category"] == "UPI_QR_CODE_SCAM", "Should match QR code scam"
    assert len(summary["statutory_sops"]) > 0, "Should include statutory directions"
    assert len(summary["evidence_checklist"]) > 0, "Should include evidence checklist"
    print("PASS: AI Summarizer with RAG tests passed!")

if __name__ == '__main__':
    test_entity_extraction()
    test_classifier()
    test_anomaly_detection()
    test_rag_engine()
    test_summarizer()
    print("\nALL AI SERVICE TESTS PASSED SUCCESSFULLY!")
