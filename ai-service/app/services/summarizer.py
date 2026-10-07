from typing import Dict, List, Any
from app.models.schemas import SummarizeRequest

def generate_investigation_summary(req: SummarizeRequest) -> Dict[str, Any]:
    """
    Generates a fact-grounded, non-defamatory investigation summary.
    Strictly constrained to observed structural evidence in the database graph.
    """
    cid_count = len(req.connected_complaints)
    ident_count = len(req.connected_identifiers)
    
    # Categorize identifiers
    banks = [i['value'] for i in req.connected_identifiers if i.get('type') == 'BANK_ACCOUNT']
    phones = [i['value'] for i in req.connected_identifiers if i.get('type') == 'PHONE']
    upis = [i['value'] for i in req.connected_identifiers if i.get('type') == 'UPI']
    domains = [i['value'] for i in req.connected_identifiers if i.get('type') == 'DOMAIN']

    # Build concise narrative
    sentences = []
    sentences.append(
        f"Case {req.case_id} relates to reported incident '{req.complaint_title}', categorized under {req.category}."
    )

    if cid_count > 1:
        sentences.append(
            f"Graph analysis identifies potential multi-incident linkage connecting {cid_count} distinct complaints "
            f"through {ident_count} common cyber and financial identifiers."
        )
    else:
        sentences.append(
            f"Preliminary graph traversal indicates an isolated incident with {ident_count} recorded identifiers."
        )

    if banks:
        sentences.append(f"Beneficiary financial endpoints include {len(banks)} bank account(s) ({', '.join(banks[:2])}).")
    if upis:
        sentences.append(f"Recorded payment handles include UPI address(es) {', '.join(upis[:2])}.")
    if domains:
        sentences.append(f"Associated phishing or credential-harvesting infrastructure includes domain(s) {', '.join(domains[:2])}.")

    sentences.append(
        f"The algorithmic risk engine assigns an overall risk score of {req.risk_score}/100 with an assessed severity level of {req.risk_level}."
    )

    narrative = " ".join(sentences)

    # Suspicious patterns detected
    patterns = []
    if cid_count >= 2:
        patterns.append(f"Cross-complaint identifier reuse detected across {cid_count} reported cases.")
    if banks and len(req.connected_complaints) >= 2:
        patterns.append("Centralized beneficiary banking hub routing inflows from multiple independent victims.")
    if domains:
        patterns.append("Presence of external domains indicative of automated phishing or deceptive portal deployment.")
    if req.risk_score >= 80:
        patterns.append("High topological density and financial exposure indicative of organized syndicate operations.")

    # Actionable investigative next steps (strictly recommendations)
    recommendations = []
    if banks:
        recommendations.append("Issue Section 91 CrPC notice to beneficiary bank branches for account statement freeze and KYC verification.")
    if upis:
        recommendations.append("Liaise with NPCI and payment service provider to trace IP logs and SIM binding for associated UPI VPAs.")
    if phones:
        recommendations.append("Request Call Detail Records (CDR) and Subscriber Acquisition Form (CAF) from respective telecom service providers.")
    if domains:
        recommendations.append("Submit takedown request to domain registrar and request registrant WHOIS records from hosting provider.")
    recommendations.append("Cross-reference discovered identifiers with the National Cybercrime Reporting Portal (NCRP) database.")

    return {
        "case_id": req.case_id,
        "narrative_summary": narrative,
        "suspicious_patterns": patterns,
        "investigative_recommendations": recommendations
    }
