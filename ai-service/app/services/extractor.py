import re
from typing import List, Dict, Any
from app.models.schemas import EntityItem

# Deterministic patterns
PHONE_REGEX = re.compile(r'(?:(?:\+91|91|0)[\s\-]?)?([6-9]\d{9})\b')
UPI_REGEX = re.compile(r'\b([a-zA-Z0-9.\-_]{2,64}@(?:okaxis|okhdfcbank|oksbi|okicici|paytm|ybl|axl|sbi|apl|upi|ibl|icici|barodampay|federal|kotak|postbank|[a-zA-Z]{2,30}))\b', re.IGNORECASE)
IFSC_REGEX = re.compile(r'\b([A-Z]{4}0[A-Z0-9]{6})\b')
BANK_ACC_REGEX = re.compile(r'(?:a\/c|ac|acc|account|acct|beneficiary)?[\s:#\-_]*\b(\d{9,18})\b', re.IGNORECASE)
EMAIL_REGEX = re.compile(r'\b([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b', re.IGNORECASE)
DOMAIN_REGEX = re.compile(r'(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.(?:com|org|net|xyz|top|in|co\.in|online|site|shop|vip|live|club|app|info|biz|tk|ml|link|cc|co))\b', re.IGNORECASE)

KNOWN_IFSC_BANKS = {
    'HDFC': 'HDFC Bank',
    'SBIN': 'State Bank of India',
    'ICIC': 'ICICI Bank',
    'UTIB': 'Axis Bank',
    'PUNB': 'Punjab National Bank',
    'BARB': 'Bank of Baroda',
    'KKBK': 'Kotak Mahindra Bank'
}

def extract_entities_from_text(text: str) -> List[EntityItem]:
    """
    Deterministically extracts and normalizes cyber and financial identifiers.
    Applies role inference based on proximity context.
    """
    if not text:
        return []

    results: List[EntityItem] = []
    seen_entities = set()

    # 1. Phone Numbers
    for match in PHONE_REGEX.finditer(text):
        ten_digits = match.group(1)
        canonical_phone = f"+91{ten_digits}"
        if canonical_phone not in seen_entities:
            seen_entities.add(canonical_phone)
            # Context window to infer role
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            context = text[start:end].lower()
            role = "COMMUNICATION_CHANNEL"
            if any(k in context for k in ["pay", "sent", "transferred", "wallet"]):
                role = "BENEFICIARY"

            results.append(EntityItem(
                type="PHONE",
                value=canonical_phone,
                confidence=1.0,
                role=role,
                meta={"raw_match": match.group(0).strip(), "country_code": "+91"}
            ))

    # 2. UPI IDs
    for match in UPI_REGEX.finditer(text):
        raw_upi = match.group(1).lower()
        # Avoid treating emails as UPI if clearly an email domain like gmail.com / yahoo.com
        if any(raw_upi.endswith(d) for d in ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"]):
            continue

        if raw_upi not in seen_entities:
            seen_entities.add(raw_upi)
            handle = raw_upi.split('@')[1] if '@' in raw_upi else ""
            results.append(EntityItem(
                type="UPI",
                value=raw_upi,
                confidence=0.98,
                role="BENEFICIARY",
                meta={"handle": handle}
            ))

    # 3. Email Identifiers
    for match in EMAIL_REGEX.finditer(text):
        raw_email = match.group(1).lower()
        if raw_email not in seen_entities:
            seen_entities.add(raw_email)
            results.append(EntityItem(
                type="EMAIL",
                value=raw_email,
                confidence=0.98,
                role="COMMUNICATION_CHANNEL",
                meta={"domain": raw_email.split('@')[1]}
            ))

    # 3. Bank Account & IFSC
    found_ifsc = None
    ifsc_match = IFSC_REGEX.search(text)
    if ifsc_match:
        found_ifsc = ifsc_match.group(1).upper()

    for match in BANK_ACC_REGEX.finditer(text):
        acc_digits = match.group(1)
        # Avoid confusing 10-digit phone number with bank account if already tagged as phone
        if len(acc_digits) == 10 and f"+91{acc_digits}" in seen_entities:
            continue

        bank_name = None
        canonical_val = acc_digits
        if found_ifsc:
            canonical_val = f"{acc_digits}@{found_ifsc}"
            prefix = found_ifsc[:4]
            bank_name = KNOWN_IFSC_BANKS.get(prefix, f"{prefix} Bank")

        if canonical_val not in seen_entities and acc_digits not in seen_entities:
            seen_entities.add(canonical_val)
            seen_entities.add(acc_digits)
            results.append(EntityItem(
                type="BANK_ACCOUNT",
                value=canonical_val,
                confidence=0.95 if found_ifsc else 0.88,
                role="BENEFICIARY",
                meta={
                    "account_number": acc_digits,
                    "ifsc": found_ifsc or "UNKNOWN",
                    "bank_name": bank_name or "Scheduled Commercial Bank"
                }
            ))

    # 4. Domains / Phishing Portals
    for match in DOMAIN_REGEX.finditer(text):
        raw_domain = match.group(1).lower()
        if raw_domain not in seen_entities:
            seen_entities.add(raw_domain)
            tld = raw_domain.split('.')[-1]
            results.append(EntityItem(
                type="DOMAIN",
                value=raw_domain,
                confidence=0.96,
                role="PHISHING_PORTAL",
                meta={"tld": tld}
            ))

    return results
