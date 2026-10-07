from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import (
    ExtractRequest, ExtractResponse,
    ClassifyRequest, ClassifyResponse,
    AnomalyDetectRequest, AnomalyDetectResponse,
    SummarizeRequest, SummarizeResponse,
    RagAnalyzeRequest, RagAnalyzeResponse
)
from app.services.extractor import extract_entities_from_text
from app.services.classifier import get_classifier
from app.services.anomaly import detect_transaction_anomalies
from app.services.summarizer import generate_investigation_summary
from app.services.rag_engine import get_rag_engine

app = FastAPI(
    title="CyberMesh AI Analysis Engine",
    description="Microservice for Cyber Identifier Extraction, Complaint Classification, Anomaly Detection, and Case Summarization",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "UP",
        "service": "CyberMesh AI Microservice",
        "version": "1.0.0",
        "rag_engine": "ACTIVE",
        "domain": "UPI_FRAUD_SPECIALIZED"
    }

@app.post("/api/extract", response_model=ExtractResponse)
def extract_endpoint(req: ExtractRequest):
    try:
        entities = extract_entities_from_text(req.text)
        return ExtractResponse(
            success=True,
            entities=entities,
            entity_count=len(entities)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/classify", response_model=ClassifyResponse)
def classify_endpoint(req: ClassifyRequest):
    try:
        clf = get_classifier()
        full_text = f"{req.title} {req.description}".strip()
        category, confidence, probas, keywords = clf.classify(full_text)
        return ClassifyResponse(
            success=True,
            category=category,
            confidence=confidence,
            probabilities=probas,
            indicative_keywords=keywords
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect-anomalies", response_model=AnomalyDetectResponse)
def anomaly_endpoint(req: AnomalyDetectRequest):
    try:
        res = detect_transaction_anomalies(req.transactions)
        return AnomalyDetectResponse(
            success=True,
            flagged_count=res["flagged_count"],
            flagged_ids=res["flagged_ids"],
            analysis=res["analysis"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag-analyze", response_model=RagAnalyzeResponse)
def rag_analyze_endpoint(req: RagAnalyzeRequest):
    try:
        rag = get_rag_engine()
        retrieved = rag.retrieve(req.text, top_k=req.top_k)

        matched_mo = None
        sops = []
        checklist = []
        citations = []

        if retrieved:
            top_match = retrieved[0]
            matched_mo = {
                "name": top_match["title"],
                "category": top_match["category"],
                "confidence": top_match["similarity_score"],
                "summary": top_match["summary"]
            }
            sops = top_match["statutory_sops"]
            checklist = top_match["evidence_checklist"]
            citations = top_match["regulatory_citations"]

        return RagAnalyzeResponse(
            success=True,
            query=req.text,
            matched_modus_operandi=matched_mo,
            retrieved_knowledge=retrieved,
            recommended_sops=sops,
            evidence_checklist=checklist,
            regulatory_citations=citations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summarize-case", response_model=SummarizeResponse)
def summarize_endpoint(req: SummarizeRequest):
    try:
        res = generate_investigation_summary(req)
        return SummarizeResponse(
            success=True,
            case_id=res["case_id"],
            narrative_summary=res["narrative_summary"],
            suspicious_patterns=res["suspicious_patterns"],
            investigative_recommendations=res["investigative_recommendations"],
            upi_modus_operandi=res.get("upi_modus_operandi"),
            retrieved_knowledge=res.get("retrieved_knowledge"),
            statutory_sops=res.get("statutory_sops"),
            evidence_checklist=res.get("evidence_checklist"),
            regulatory_citations=res.get("regulatory_citations")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
