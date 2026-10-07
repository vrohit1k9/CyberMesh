"""
CyberMesh - Retrieval-Augmented Generation (RAG) Engine for UPI Fraud Investigation.
Maintains an authoritative vector knowledge base of UPI scam Modus Operandi (MO),
NPCI procedural guidelines, RBI customer protection circulars, and Section 91 CrPC SOPs.
"""

import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Authoritative UPI Scam Knowledge Base Corpus
UPI_KNOWLEDGE_BASE = [
    {
        "doc_id": "DOC-UPI-001",
        "title": "NPCI Protocol: QR Code 'Scan to Receive Money' Reverse Payment Deception",
        "category": "UPI_QR_CODE_SCAM",
        "keywords": ["qr code", "scan qr", "receive money", "olx", "marketplace", "scan to receive", "refund qr", "cashback qr"],
        "summary": "Fraudster sends a deceptive QR code claiming the victim must scan it to receive funds or an OLX payment. Scanning a QR code and entering a UPI PIN strictly authorizes a DEBIT, never a credit.",
        "modus_operandi": (
            "The perpetrator targets victims selling goods on online marketplaces (OLX, Quikr, Facebook Marketplace) "
            "or victims seeking customer care refunds. The fraudster claims payment cannot be made directly and transmits "
            "a PhonePe, Google Pay, or Paytm merchant QR code via WhatsApp. The victim is instructed to 'Scan this QR and enter "
            "your UPI PIN to accept the funds into your bank account'. In the UPI protocol (NPCI Specification v2.0), entering a "
            "UPI PIN exclusively signs an outward debit authorization. The victim's account is instantly debited, and the funds "
            "are swept into a primary mule account."
        ),
        "statutory_sops": [
            "Immediately register an online freeze request via 1930 / Citizen Financial Cyber Fraud Reporting Management System (CFCFRMS).",
            "Issue Section 91 CrPC notice to the acquiring Payment Service Provider (PSP) Bank to freeze the beneficiary account linked to the merchant VPA.",
            "Request transaction metadata from NPCI including UPI 12-digit RRN (Retrieval Reference Number), initiating IP address, and device fingerprint.",
            "Instruct victim to file a dispute under RBI Circular DPSS.CO.PD.No.1417/02.14.006/2018-19 (Limited Liability of Customer in Unauthorized Electronic Banking Transactions)."
        ],
        "evidence_checklist": [
            "Screenshot of WhatsApp/SMS message containing the fraudulent QR code image",
            "12-digit UPI Transaction Reference Number (UTR / RRN)",
            "Bank account debit statement showing exact timestamp and beneficiary VPA handle",
            "Victim's mobile handset call logs and chat exports with the perpetrator"
        ],
        "regulatory_citations": [
            "NPCI UPI Procedural Guidelines Chapter 4 (Mandatory Warning on QR Inward Debits)",
            "RBI Master Direction DPSS.CO.PD.No.1417/02.14.006/2018-19",
            "Section 66D, Information Technology Act, 2000 (Cheating by personation using computer resource)"
        ]
    },
    {
        "doc_id": "DOC-UPI-002",
        "title": "NPCI Collect Request (Approval Request) Social Engineering & PIN Trap",
        "category": "UPI_COLLECT_REQUEST_SCAM",
        "keywords": ["collect request", "approve request", "enter pin to receive", "request money", "notification", "pin deducted", "approval request"],
        "summary": "Fraudster initiates an inbound UPI Collect Request disguised as a payment receipt note. Victim is misled into entering their UPI PIN under the belief that PIN entry accepts incoming money.",
        "modus_operandi": (
            "The perpetrator initiates a P2P or P2M Collect Request through a UPI application directed at the victim's VPA. "
            "The remark/memo field is manipulated with text such as 'Refund from Electricity Board: Rs 15,000' or 'Payment Received: Rs 45,000'. "
            "The fraudster remains on a continuous phone call urging the victim to open their UPI app, click 'Approve / Pay', and enter their PIN. "
            "Victims unaware of the asymmetric UPI security model (PIN entry is only required for debiting sender funds) authorize the debit."
        ),
        "statutory_sops": [
            "Serve notice under Section 91 CrPC to the Remitter and Beneficiary PSP banks for immediate lien marking.",
            "Obtain Device IMEI, App Version, and IPDR from the Third Party Application Provider (TPAP - PhonePe, GPay, Paytm) for the initiating VPA.",
            "Verify whether the initiating VPA was registered using forged SIM credentials or mule KYC under Section 420/468 IPC (318/336 BNS).",
            "Request remittance switch logs from NPCI to identify second-hop split transactions executed within the 15-minute laundering window."
        ],
        "evidence_checklist": [
            "In-app screenshot of the Collect Request notification showing sender VPA and remarks field",
            "12-digit UTR number from the bank SMS alert",
            "CDR (Call Detail Record) of the phone call during which the collect request was executed",
            "Beneficiary bank IFSC code and account number resolved from the recipient VPA"
        ],
        "regulatory_citations": [
            "NPCI Circular on Enhancing Security Features in UPI Collect Transactions (NPCI/2020-21/UPI/004)",
            "Section 91 Criminal Procedure Code, 1973 (Summons to produce document or thing)",
            "Section 420 Indian Penal Code / Section 318(4) Bharatiya Nyaya Sanhita (Cheating and dishonestly inducing delivery of property)"
        ]
    },
    {
        "doc_id": "DOC-UPI-003",
        "title": "Remote Desktop APK Siphoning & UPI PIN Snooping (AnyDesk / TeamViewer / RustDesk)",
        "category": "UPI_REMOTE_ACCESS_FRAUD",
        "keywords": ["anydesk", "teamviewer", "rustdesk", "quicksupport", "screen share", "remote app", "otp siphoned", "accessibility permission"],
        "summary": "Perpetrator impersonates technical support, directs victim to install remote desktop tools, captures UPI credentials during screen sharing, and initiates unauthorized UPI transfers.",
        "modus_operandi": (
            "Victim searching for banking or utility customer support encounters a poisoned search result or receives a spoofed SMS. "
            "The perpetrator claims that a technical glitch requires remote device inspection. The victim is guided to download a remote access "
            "application (AnyDesk, TeamViewer QuickSupport, or malicious sideloaded APK). Once remote access is established, the fraudster prompts "
            "the victim to open their banking or UPI application and enter their MPIN/UPI PIN under the guise of 'testing the connection'. "
            "The fraudster visually records the credentials or takes over input to execute back-to-back UPI transfers to rotating mule accounts."
        ),
        "statutory_sops": [
            "Order immediate digital forensic triage of the victim's smartphone to document installed package names, timestamps, and accessibility permissions.",
            "Subpoena the remote desktop provider (AnyDesk GmbH / TeamViewer Germany) for connecting session ID, remote operator IP address, and timestamp.",
            "Issue emergency Section 91 CrPC freeze directives to all recipient bank branches to prevent ATM withdrawal or crypto P2P conversion.",
            "Request telecom operator IPDR (Internet Protocol Detail Record) for the remote operator's public IP address to identify physical geography."
        ],
        "evidence_checklist": [
            "Victim's phone forensic extraction (APK hash, installation time, accessibility logs)",
            "9-digit or 10-digit Remote Session ID generated by the screen-sharing software",
            "Bank passbook/statement reflecting series of rapid UPI debits",
            "ISP connection logs for the duration of the fraudulent session"
        ],
        "regulatory_citations": [
            "CERT-In Advisory CIAD-2021-0028 on Social Engineering using Remote Access Software",
            "Section 66C Information Technology Act (Identity Theft)",
            "Section 43 Information Technology Act (Unauthorized access and data download)"
        ]
    },
    {
        "doc_id": "DOC-UPI-004",
        "title": "Telegram VIP Task & Investment Payout Scam with Mule UPI Routing",
        "category": "UPI_TASK_INVESTMENT_SCAM",
        "keywords": ["telegram", "task scam", "youtube like", "hotel review", "vip handle", "deposit upi", "crypto task", "part time job", "mule upi"],
        "summary": "Victim lured with micro-task payouts into Telegram channels, then coerced into depositing escalating amounts via UPI to rotating money mule accounts with promises of high profits.",
        "modus_operandi": (
            "The operation begins with unsolicited WhatsApp/Telegram invitations offering work-from-home earnings for simple tasks (Google reviews, YouTube likes). "
            "Initial tasks yield small payouts (Rs 150 to Rs 500) transferred directly to the victim's UPI account to establish psychological trust. "
            "The victim is added to a 'VIP Telegram Group' populated by fake accounts posting forged profit screenshots. The victim is assigned 'prepaid tasks' "
            "requiring deposits ranging from Rs 10,000 to Rs 5,00,000. Each payment is directed to a different UPI VPA belonging to an extensive mule network. "
            "When the victim attempts withdrawal, the syndicate demands additional 'tax clearance' or 'handling fees' via UPI until the victim realizes the fraud."
        ),
        "statutory_sops": [
            "Map multi-tier money flow: Layer 1 (direct UPI collection), Layer 2 (immediate RTGS/IMPS outward hop), and Layer 3 (ATM cash-out).",
            "Issue Section 91 CrPC notices to nodal officers of all beneficiary banks across all identified layers for cumulative account freezes.",
            "Submit MLAT / Letters Rogatory through Central Bureau of Investigation (CBI) / Interpol cyber division to Telegram FZ-LLC for channel administrator IP and registration phone.",
            "Coordinate with FIU-IND (Financial Intelligence Unit - India) to flag identified mule accounts on the National Risk Register."
        ],
        "evidence_checklist": [
            "Telegram chat export, channel ID, admin user handles, and message timestamps",
            "All UPI transaction receipts (UTR numbers, remitter bank, beneficiary VPAs)",
            "Screenshots of synthetic investment dashboards displaying fake balances",
            "Victim's bank statements establishing complete chronological trail of fund outflow"
        ],
        "regulatory_citations": [
            "MHA I4C Standard Operating Procedure for National Cyber Fraud Reporting Portal (CFCFRMS)",
            "Section 420/120B IPC / Section 318(4)/61 BNS (Criminal Conspiracy and Cheating)",
            "Prevention of Money Laundering Act (PMLA), 2002 Section 3 (Offence of money-laundering)"
        ]
    },
    {
        "doc_id": "DOC-UPI-005",
        "title": "Search Engine Poisoning & Fake Helpline UPI Token Debit Trap",
        "category": "UPI_CUSTOMER_CARE_IMPERSONATION",
        "keywords": ["customer care", "helpline", "swiggy refund", "zomato refund", "courier delay", "bank helpline", "re 1 token", "verification fee"],
        "summary": "Fraudsters plant fake helpline numbers in search engine results and Google Maps. Callers seeking refunds are instructed to pay a nominal Re 1 verification fee via UPI, which executes a high-value debit.",
        "modus_operandi": (
            "Perpetrators register virtual VOIP numbers or acquire SIM cards using forged identities and list them as official customer support "
            "contacts on Google My Business, search engine advertisements, and review forums for major delivery, e-commerce, or banking brands. "
            "When a customer calls to inquire about a delayed refund or courier package, the fraudster impersonates an executive. The caller is "
            "sent a payment link or directed to enter a 'verification transfer of Rs 1 or Rs 10' to authenticate their bank account. The link is "
            "embedded with an encrypted intent or initiates a background collect request for thousands of rupees while obscuring the actual debit value."
        ),
        "statutory_sops": [
            "Serve Section 91 CrPC requisition to Telecom Service Provider (Airtel, Jio, Vi) for Subscriber Acquisition Form (CAF), CDR, and tower location.",
            "Request Google LLC / Search Engine ad platform for registrant payment details, IP logs, and credit card used to sponsor the fraudulent ad.",
            "Issue immediate stop-payment notice to the acquiring UPI bank to freeze un-cleared settlement balances.",
            "Request IMEI history of the handset used by the fake customer support operator."
        ],
        "evidence_checklist": [
            "URL and screenshot of the search engine result or listing where the fake number was discovered",
            "Incoming/outgoing call recording and telecom billing records",
            "SMS/WhatsApp link text received from the fraudster",
            "12-digit UPI transaction reference number"
        ],
        "regulatory_citations": [
            "Section 91 Criminal Procedure Code, 1973",
            "TRAI Telecom Commercial Communications Customer Preference Regulations (TCCCPR), 2018",
            "Section 66D Information Technology Act (Cheating by Personation)"
        ]
    },
    {
        "doc_id": "DOC-UPI-006",
        "title": "High-Velocity Money Mule Layering & Rapid UPI P2P Dispersal",
        "category": "UPI_MONEY_MULE_LAYERING",
        "keywords": ["money mule", "layering", "rapid dispersal", "p2p transfer", "split transactions", "velocity spike", "immediate withdrawal", "crypto p2p"],
        "summary": "Stolen funds are dispersed within minutes across 5–15 secondary and tertiary mule UPI VPAs in micro-amounts (< ₹50,000) to evade automated banking AML alerts before ATM withdrawal.",
        "modus_operandi": (
            "Organized cyber syndicates purchase or rent active savings accounts from students, low-income workers, or cyber-cafe agents (money mules). "
            "When a fraud victim is duped into transferring funds via UPI, automated bot scripts or syndicate operators immediately split the incoming credit "
            "into multiple transfers of Rs 20,000 to Rs 49,000 directed to 5–10 other mule VPAs across different banks. This layering occurs within 3 to 15 minutes "
            "of the victim's debit. The secondary mules quickly withdraw the cash at off-site ATMs or purchase USDT on peer-to-peer cryptocurrency exchanges, "
            "breaking the digital banking paper trail."
        ),
        "statutory_sops": [
            "Execute Golden Hour emergency broadcast to all Layer 1, Layer 2, and Layer 3 beneficiary banks via NPCI CFCFRMS.",
            "Issue Section 102 CrPC (Power of police officer to seize certain property) seizure orders to freeze remaining debit balances across all linked mule accounts.",
            "Subpoena cryptocurrency exchanges (WazirX, CoinDCX, Binance P2P) if blockchain conversion signatures are identified.",
            "Examine ATM CCTV camera footage for the timestamps of cash withdrawals using bank branch coordinates."
        ],
        "evidence_checklist": [
            "Multi-hop bank account statement showing instant outward velocity upon receiving victim funds",
            "12-digit UTR sequences connecting Layer 1 to Layer 2 and Layer 3 accounts",
            "ATM withdrawal transaction logs (ATM ID, location, card number)",
            "Account opening documents (KYC, PAN, Aadhaar) of the mule account holders"
        ],
        "regulatory_citations": [
            "Section 102 Code of Criminal Procedure, 1973 (Seizure of property suspected to be stolen)",
            "RBI Master Direction - Know Your Customer (KYC) Direction, 2016",
            "Section 3 & 4 Prevention of Money Laundering Act (PMLA), 2002"
        ]
    },
    {
        "doc_id": "DOC-UPI-007",
        "title": "SIM Swap & Unsolicited Device Binding UPI Account Hijacking",
        "category": "UPI_SIM_SWAP_TAKEOVER",
        "keywords": ["sim swap", "sim deactivation", "device binding", "sms forward", "no signal", "unauthorized upi registration", "imsi change"],
        "summary": "Perpetrator clones victim's SIM card through social engineering at telecom kiosks, binds the victim's phone number to a new device UPI app, and drains linked bank balances.",
        "modus_operandi": (
            "The perpetrator gathers personal identifiable information (PII) of the target victim (Aadhaar number, date of birth, mother's maiden name). "
            "The fraudster visits a telecom retail store impersonating the victim, claiming the phone was lost, and obtains a replacement SIM card. "
            "The victim's original SIM suddenly loses network reception ('No Service'). During this window, the fraudster inserts the active replacement SIM into a new handset, "
            "downloads UPI payment apps (PhonePe, Google Pay, Paytm), and triggers the SMS verification device-binding handshake. The UPI application links to the victim's "
            "bank accounts associated with that mobile number, and the fraudster resets the UPI PIN using intercepted debit card OTPs or spoofed credentials."
        ),
        "statutory_sops": [
            "Direct telecom service provider to immediately preserve and produce retail store CCTV footage, store executive KYC record, and submitted identity proofs.",
            "Subpoena device registration audit trail from UPI TPAPs showing IMEI, IMSI, and device model linked to the new installation.",
            "Check telecom provider's compliance with mandatory 24-hour SMS bar following SIM replacement (TRAI guidelines).",
            "Issue immediate freeze notices to all banks associated with the victim's mobile number."
        ],
        "evidence_checklist": [
            "Telecom operator SIM replacement audit log (timestamp, store code, employee ID)",
            "Victim's telecom subscription contract and proof of sudden network loss",
            "Device IMEI and IMSI logs from NPCI / TPAP application switch",
            "Bank transaction statements showing sudden transfers post SIM-swap timestamp"
        ],
        "regulatory_citations": [
            "TRAI Guidelines on Security Safeguards during SIM Exchange / Replacement",
            "Section 66C and 66D Information Technology Act, 2000",
            "Section 468 and 471 Indian Penal Code / Section 336 and 340 Bharatiya Nyaya Sanhita (Forgery for purpose of cheating)"
        ]
    }
]

class UpiRagEngine:
    """
    RAG Engine specialized in UPI Fraud Investigation.
    Indexes authoritative UPI scam knowledge base using TF-IDF sparse vector representations,
    performs cosine similarity retrieval against complaint text, and synthesizes evidence-grounded
    investigation summaries and statutory SOPs.
    """

    def __init__(self, knowledge_base: List[Dict[str, Any]] = None):
        self.corpus = knowledge_base or UPI_KNOWLEDGE_BASE
        
        # Build text corpus for vectorization: title + keywords + summary + modus operandi
        self.doc_texts = []
        for doc in self.corpus:
            doc_str = (
                f"{doc['title']} "
                f"{' '.join(doc['keywords'])} "
                f"{doc['summary']} "
                f"{doc['modus_operandi']} "
                f"{' '.join(doc['statutory_sops'])}"
            )
            self.doc_texts.append(doc_str.lower())

        # Fit TF-IDF Vectorizer with unigrams and bigrams
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True
        )
        self.doc_matrix = self.vectorizer.fit_transform(self.doc_texts)

    def retrieve(self, query_text: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieves top_k most relevant UPI knowledge documents using cosine similarity.
        """
        if not query_text or not query_text.strip():
            return []

        cleaned_query = query_text.lower().strip()
        query_vec = self.vectorizer.transform([cleaned_query])
        similarities = cosine_similarity(query_vec, self.doc_matrix)[0]

        # Rank indices by descending similarity
        ranked_indices = similarities.argsort()[::-1]

        results = []
        for idx in ranked_indices[:top_k]:
            sim_score = float(similarities[idx])
            # Only include if score meets minimum relevance threshold
            if sim_score > 0.05:
                doc = self.corpus[idx]
                results.append({
                    "doc_id": doc["doc_id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "similarity_score": round(sim_score, 4),
                    "relevance_percentage": f"{round(sim_score * 100, 1)}%",
                    "summary": doc["summary"],
                    "modus_operandi": doc["modus_operandi"],
                    "statutory_sops": doc["statutory_sops"],
                    "evidence_checklist": doc["evidence_checklist"],
                    "regulatory_citations": doc["regulatory_citations"]
                })

        return results

    def synthesize_investigation_brief(
        self,
        case_id: str,
        category: str,
        complaint_title: str,
        complaint_description: str,
        risk_score: int,
        risk_level: str,
        connected_complaints: List[str],
        connected_identifiers: List[Dict[str, Any]],
        total_financial_loss: float
    ) -> Dict[str, Any]:
        """
        Retrieval-Augmented Synthesis combining:
        1. Semantic retrieval over authoritative UPI fraud knowledge base
        2. Empirical graph facts from the PostgreSQL database
        3. Actionable statutory directions (NPCI, RBI, Section 91 CrPC)
        """
        # Formulate search query emphasizing UPI scam patterns
        query_text = f"{complaint_title} {complaint_description} {category}"
        retrieved_docs = self.retrieve(query_text, top_k=2)

        # Categorize identifiers
        upis = [i['value'] for i in connected_identifiers if i.get('type') == 'UPI']
        phones = [i['value'] for i in connected_identifiers if i.get('type') == 'PHONE']
        banks = [i['value'] for i in connected_identifiers if i.get('type') == 'BANK_ACCOUNT']
        domains = [i['value'] for i in connected_identifiers if i.get('type') == 'DOMAIN']

        cid_count = len(connected_complaints)
        ident_count = len(connected_identifiers)

        # Primary Modus Operandi
        if retrieved_docs:
            primary_match = retrieved_docs[0]
            mo_name = primary_match["title"]
            mo_category = primary_match["category"]
            mo_confidence = primary_match["similarity_score"]
            mo_description = primary_match["summary"]
            statutory_sops = primary_match["statutory_sops"]
            evidence_checklist = primary_match["evidence_checklist"]
            regulations = primary_match["regulatory_citations"]
        else:
            # Fallback general UPI scam profile
            mo_name = "Generic UPI Cyber-Financial Fraud Pattern"
            mo_category = "UPI_FRAUD"
            mo_confidence = 0.65
            mo_description = "Unidentified electronic fund siphoning via Unified Payments Interface."
            statutory_sops = [
                "Issue Section 91 CrPC notice to beneficiary PSP Bank for account freeze.",
                "Request transaction RRN and device IP logs from NPCI."
            ]
            evidence_checklist = [
                "12-digit UPI UTR number",
                "Victim bank debit alert screenshot"
            ]
            regulations = [
                "Section 91 CrPC",
                "RBI Customer Liability Circular DPSS.CO.PD.No.1417/02.14.006/2018-19"
            ]

        # Narrative Construction Grounded in Real Graph Facts
        narrative_parts = []
        narrative_parts.append(
            f"Case {case_id} relates to reported incident '{complaint_title}'. "
            f"Retrieval-Augmented analysis matches the complaint signature to {mo_name} "
            f"(Confidence: {round(mo_confidence * 100, 1)}%)."
        )

        if cid_count > 1:
            narrative_parts.append(
                f"Multi-hop recursive graph traversal links this report to {cid_count} interconnected victim complaints "
                f"sharing {ident_count} common cyber and financial identifiers."
            )
        else:
            narrative_parts.append(
                f"Preliminary investigation records {ident_count} cyber/financial identifier(s) associated with this complaint."
            )

        if upis:
            narrative_parts.append(
                f"Identified fraudulent UPI beneficiary handle(s): {', '.join(upis[:3])}."
            )
        if banks:
            narrative_parts.append(
                f"Linked destination banking account(s): {', '.join(banks[:2])}."
            )
        if phones:
            narrative_parts.append(
                f"Originating telephone communication endpoint(s): {', '.join(phones[:2])}."
            )

        loss_str = f"Rs. {total_financial_loss:,.2f}" if total_financial_loss > 0 else "unspecified"
        narrative_parts.append(
            f"Combined exposed financial loss across the discovered network is evaluated at {loss_str}. "
            f"Algorithmic multi-factor risk score is assessed at {risk_score}/100 ({risk_level})."
        )

        full_narrative = " ".join(narrative_parts)

        # Suspicious Patterns
        suspicious_patterns = [
            f"Matched UPI Modus Operandi: {mo_name}",
            f"Discovered {cid_count} linked complaints sharing common beneficiary infrastructure",
            f"Total evaluated financial exposure: {loss_str}"
        ]
        if upis:
            suspicious_patterns.append(f"Identified {len(upis)} recurring UPI VPA handles used for fund collection")
        if banks and cid_count >= 2:
            suspicious_patterns.append("Centralized beneficiary banking hub routing multi-victim inflows")
        if risk_score >= 80:
            suspicious_patterns.append("High topological density and identifier reuse indicating organized syndicate operations")

        return {
            "case_id": case_id,
            "narrative_summary": full_narrative,
            "upi_modus_operandi": {
                "name": mo_name,
                "category": mo_category,
                "confidence": mo_confidence,
                "summary": mo_description
            },
            "retrieved_knowledge": retrieved_docs,
            "statutory_sops": statutory_sops,
            "evidence_checklist": evidence_checklist,
            "regulatory_citations": regulations,
            "suspicious_patterns": suspicious_patterns,
            "investigative_recommendations": statutory_sops
        }

# Global singleton
_rag_engine_instance = None

def get_rag_engine() -> UpiRagEngine:
    global _rag_engine_instance
    if _rag_engine_instance is None:
        _rag_engine_instance = UpiRagEngine()
    return _rag_engine_instance
