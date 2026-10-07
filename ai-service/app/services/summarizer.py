from typing import Dict, List, Any
from app.models.schemas import SummarizeRequest
from app.services.rag_engine import get_rag_engine

def generate_investigation_summary(req: SummarizeRequest) -> Dict[str, Any]:
    """
    Generates a fact-grounded, RAG-augmented investigation summary.
    Combines:
    1. Semantic similarity retrieval from the authoritative UPI fraud knowledge base
    2. Empirical structural graph evidence from the database
    3. Actionable statutory directions (NPCI, RBI, Section 91 CrPC)
    """
    rag_engine = get_rag_engine()
    
    return rag_engine.synthesize_investigation_brief(
        case_id=req.case_id,
        category=req.category,
        complaint_title=req.complaint_title,
        complaint_description=req.complaint_description,
        risk_score=req.risk_score,
        risk_level=req.risk_level,
        connected_complaints=req.connected_complaints,
        connected_identifiers=req.connected_identifiers,
        total_financial_loss=req.total_financial_loss
    )
