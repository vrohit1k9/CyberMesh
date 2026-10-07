from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class EntityItem(BaseModel):
    type: str = Field(..., description="Entity classification: PHONE, UPI, BANK_ACCOUNT, DOMAIN")
    value: str = Field(..., description="Extracted canonical value")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    role: str = Field(default="BENEFICIARY", description="Role: BENEFICIARY, COMMUNICATION_CHANNEL, PHISHING_PORTAL")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ExtractRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Complaint text or report details")

class ExtractResponse(BaseModel):
    success: bool = True
    entities: List[EntityItem]
    entity_count: int

class ClassifyRequest(BaseModel):
    title: Optional[str] = ""
    description: str = Field(..., min_length=5)

class ClassifyResponse(BaseModel):
    success: bool = True
    category: str
    confidence: float
    probabilities: Dict[str, float]
    indicative_keywords: List[str]

class TransactionItem(BaseModel):
    transaction_id: str
    amount: float
    timestamp: str
    receiver_id: Optional[str] = None
    sender_id: Optional[str] = None
    payment_channel: Optional[str] = "UPI"

class AnomalyDetectRequest(BaseModel):
    transactions: List[TransactionItem]

class AnomalyDetectResponse(BaseModel):
    success: bool = True
    flagged_count: int
    flagged_ids: List[str]
    analysis: List[Dict[str, Any]]

class SummarizeRequest(BaseModel):
    case_id: str
    category: str
    complaint_title: str
    complaint_description: str
    risk_score: int
    risk_level: str
    connected_complaints: List[str] = []
    connected_identifiers: List[Dict[str, Any]] = []
    total_financial_loss: float = 0.0

class SummarizeResponse(BaseModel):
    success: bool = True
    case_id: str
    narrative_summary: str
    suspicious_patterns: List[str]
    investigative_recommendations: List[str]
