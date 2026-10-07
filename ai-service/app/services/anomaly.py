import numpy as np
from typing import List, Dict, Any
from app.models.schemas import TransactionItem

def detect_transaction_anomalies(transactions: List[TransactionItem]) -> Dict[str, Any]:
    """
    Performs transparent statistical anomaly detection using:
    1. Amount Z-score deviation (outlier high-value transfers)
    2. Velocity spike / concentration detection
    """
    if not transactions:
        return {"flagged_count": 0, "flagged_ids": [], "analysis": []}

    amounts = [t.amount for t in transactions]
    mean_amt = float(np.mean(amounts))
    std_amt = float(np.std(amounts)) if len(amounts) > 1 else 0.0

    flagged_ids = []
    analysis = []

    # Frequency analysis by receiver
    receiver_counts = {}
    for t in transactions:
        rec = t.receiver_id or "UNKNOWN"
        receiver_counts[rec] = receiver_counts.get(rec, 0) + 1

    for t in transactions:
        reasons = []
        is_anomalous = False

        # Rule 1: High Z-Score (amount significantly above mean)
        if std_amt > 0:
            z_score = (t.amount - mean_amt) / std_amt
            if z_score >= 2.2:
                is_anomalous = True
                reasons.append(f"Amount outlier: Z-score {z_score:.2f} (Amount ₹{t.amount:,.2f} vs Mean ₹{mean_amt:,.2f})")

        # Rule 2: Velocity / Mule Account Inflow Spike (> 8 transactions in batch)
        rec = t.receiver_id or "UNKNOWN"
        if receiver_counts.get(rec, 0) >= 8:
            is_anomalous = True
            reasons.append(f"Velocity surge: Receiver account received {receiver_counts[rec]} transfers in short window")

        # Rule 3: High single ticket threshold
        if t.amount >= 100000.0:
            is_anomalous = True
            reasons.append(f"High-value threshold: Transaction exceeds ₹1,00,000 regulatory flag threshold")

        if is_anomalous:
            flagged_ids.append(t.transaction_id)

        analysis.append({
            "transaction_id": t.transaction_id,
            "amount": t.amount,
            "is_anomalous": is_anomalous,
            "reasons": reasons
        })

    return {
        "flagged_count": len(flagged_ids),
        "flagged_ids": flagged_ids,
        "analysis": analysis
    }
