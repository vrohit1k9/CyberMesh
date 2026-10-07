// Generator for CyberMesh sample_data.sql
const fs = require('fs');
const path = require('path');

// Fixed Bcrypt hash for passwords (cost 10)
// $2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ek5YXY9DAbW.jZ35G corresponds to "CyberMesh2026!"
const BCRYPT_HASH = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ek5YXY9DAbW.jZ35G';

let sql = `-- ============================================================================
-- CYBERMESH: SYNTHETIC SEED DATA
-- Fully anonymized, realistic mock dataset for academic cybercrime research.
-- Default user password for all seed accounts: CyberMesh2026!
-- ============================================================================

-- 1. SEED ROLES
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ADMIN', 'Super administrator with system-wide privileges and audit access'),
(2, 'INVESTIGATOR', 'Law enforcement / Cyber cell investigator handling cases'),
(3, 'ANALYST', 'Threat intelligence and fraud network analyst');

-- 2. SEED USERS (Password: CyberMesh2026!)
INSERT INTO users (user_id, username, password_hash, role_id, email, full_name, badge_number) VALUES
(1, 'admin', '${BCRYPT_HASH}', 1, 'admin@cybermesh.gov.in', 'Vikramaditya Sharma', 'CYBER-DIR-01'),
(2, 'investigator_raj', '${BCRYPT_HASH}', 2, 'rajesh.kumar@cybermesh.gov.in', 'Rajesh Kumar', 'CYBER-INV-104'),
(3, 'investigator_anita', '${BCRYPT_HASH}', 2, 'anita.deshmukh@cybermesh.gov.in', 'Anita Deshmukh', 'CYBER-INV-109'),
(4, 'analyst_priya', '${BCRYPT_HASH}', 3, 'priya.nair@cybermesh.gov.in', 'Priya Nair', 'CYBER-ANL-205');

-- Set serial sequences
SELECT setval('roles_role_id_seq', 3);
SELECT setval('users_user_id_seq', 4);

`;

// Let's create identifiers
const identifiers = [];
const phoneRows = [];
const upiRows = [];
const bankRows = [];
const domainRows = [];

let identId = 1;

// Guaranteed Demo Network Identifiers (Syndicate Alpha: Task/Investment scam)
// Ident 1: Bank001
identifiers.push(`(${identId}, 'BANK_ACCOUNT', '987654321012@HDFC0001234', '2026-01-10 10:00:00+05:30', '2026-03-01 15:30:00+05:30', 1.80)`);
bankRows.push(`(${identId}, '987654321012', 'HDFC0001234', 'HDFC Bank', 'Koramangala, Bengaluru', 'SAVINGS')`);
identId++; // 2

// Ident 2: UPI001
identifiers.push(`(${identId}, 'UPI', 'fastrefund@okaxis', '2026-01-11 11:30:00+05:30', '2026-02-28 14:20:00+05:30', 1.60)`);
upiRows.push(`(${identId}, 'fastrefund@okaxis', 'Axis Bank', 'Google Pay', false)`);
identId++; // 3

// Ident 3: Phone002
identifiers.push(`(${identId}, 'PHONE', '+919876543210', '2026-01-12 09:15:00+05:30', '2026-03-02 18:45:00+05:30', 1.75)`);
phoneRows.push(`(${identId}, '+919876543210', '+91', 'Airtel Telecommunications', false, true)`);
identId++; // 4

// Ident 4: Domain001
identifiers.push(`(${identId}, 'DOMAIN', 'secure-kyc-update.xyz', '2026-01-05 00:00:00+05:30', '2026-03-03 12:00:00+05:30', 1.90)`);
domainRows.push(`(${identId}, 'secure-kyc-update.xyz', 'NameCheap Inc.', '2025-12-28', 'xyz', '185.220.101.5', true)`);
identId++; // 5

// Syndicate Beta Identifiers (Part-time job scam)
// Ident 5: Bank010
identifiers.push(`(${identId}, 'BANK_ACCOUNT', '112233445566@SBIN0005678', '2026-01-15 10:00:00+05:30', '2026-02-25 15:30:00+05:30', 1.60)`);
bankRows.push(`(${identId}, '112233445566', 'SBIN0005678', 'State Bank of India', 'Nariman Point, Mumbai', 'CURRENT')`);
identId++; // 6

// Ident 6: UPI010
identifiers.push(`(${identId}, 'UPI', 'workfromhome@paytm', '2026-01-16 11:30:00+05:30', '2026-02-24 14:20:00+05:30', 1.50)`);
upiRows.push(`(${identId}, 'workfromhome@paytm', 'Paytm Payments Bank', 'Paytm', false)`);
identId++; // 7

// Ident 7: Phone011
identifiers.push(`(${identId}, 'PHONE', '+919811223344', '2026-01-18 09:15:00+05:30', '2026-02-26 18:45:00+05:30', 1.65)`);
phoneRows.push(`(${identId}, '+919811223344', '+91', 'Reliance Jio', false, true)`);
identId++; // 8

// Ident 8: Domain002
identifiers.push(`(${identId}, 'DOMAIN', 'easy-earn-careers.top', '2026-01-10 00:00:00+05:30', '2026-02-27 12:00:00+05:30', 1.70)`);
domainRows.push(`(${identId}, 'easy-earn-careers.top', 'Hostinger', '2026-01-02', 'top', '194.87.139.12', true)`);
identId++; // 9

// Syndicate Gamma Identifiers (Crypto / Fake Forex)
// Ident 9: Bank020
identifiers.push(`(${identId}, 'BANK_ACCOUNT', '554433221100@ICIC0009876', '2026-01-20 10:00:00+05:30', '2026-02-20 15:30:00+05:30', 1.70)`);
bankRows.push(`(${identId}, '554433221100', 'ICIC0009876', 'ICICI Bank', 'Connaught Place, New Delhi', 'SAVINGS')`);
identId++; // 10

// Ident 10: UPI020
identifiers.push(`(${identId}, 'UPI', 'apexvip@ybl', '2026-01-21 11:30:00+05:30', '2026-02-19 14:20:00+05:30', 1.55)`);
upiRows.push(`(${identId}, 'apexvip@ybl', 'YES Bank', 'PhonePe', false)`);
identId++; // 11

// Ident 11: Phone020
identifiers.push(`(${identId}, 'PHONE', '+919700112233', '2026-01-22 09:15:00+05:30', '2026-02-21 18:45:00+05:30', 1.60)`);
phoneRows.push(`(${identId}, '+919700112233', '+91', 'Vodafone Idea', false, true)`);
identId++; // 12

// Ident 12: Domain003
identifiers.push(`(${identId}, 'DOMAIN', 'apex-forex-trade.net', '2026-01-14 00:00:00+05:30', '2026-02-22 12:00:00+05:30', 1.85)`);
domainRows.push(`(${identId}, 'apex-forex-trade.net', 'Tucows Domains', '2025-12-15', 'net', '45.154.255.88', true)`);
identId++; // 13

// Now generate independent/isolated identifiers:
// 30 more phones, 25 more upi, 25 more banks, 20 more domains
const banksList = [
  ['HDFC Bank', 'HDFC000'],
  ['State Bank of India', 'SBIN000'],
  ['ICICI Bank', 'ICIC000'],
  ['Punjab National Bank', 'PUNB000'],
  ['Bank of Baroda', 'BARB000'],
  ['Kotak Mahindra Bank', 'KKBK000'],
  ['Axis Bank', 'UTIB000']
];

const domainsList = [
  'support-desk-help', 'billdesk-payment-gateway', 'telecom-reward-point', 'electricity-bill-clear',
  'indane-gas-subsidy', 'fastag-recharge-bonus', 'credit-card-limit-boost', 'pf-epfo-portal-claim',
  'customs-package-clearance', 'lottery-tax-verification', 'crypto-bonus-airdrop', 'courier-tracking-express',
  'aadhar-biometric-unlock', 'pan-link-penalty-waive', 'income-tax-refund-gov', 'metro-card-smart-topup',
  'prime-membership-cashback', 'travel-refund-assist', 'telecom-sim-verification', 'deal-discount-mall'
];

for (let i = 1; i <= 35; i++) {
  const pNum = `+9198${(10000000 + i * 2371).toString().slice(0, 8)}`;
  identifiers.push(`(${identId}, 'PHONE', '${pNum}', '2026-01-01', '2026-03-01', 1.00)`);
  phoneRows.push(`(${identId}, '${pNum}', '+91', 'Airtel Telecommunications', false, false)`);
  identId++;
}

for (let i = 1; i <= 30; i++) {
  const upiHandle = `user${1000 + i}@upi${i % 3 === 0 ? 'axis' : i % 2 === 0 ? 'sbi' : 'hdfc'}`;
  identifiers.push(`(${identId}, 'UPI', '${upiHandle}', '2026-01-01', '2026-03-01', 1.00)`);
  upiRows.push(`(${identId}, '${upiHandle}', 'Indian Bank', 'GooglePay', false)`);
  identId++;
}

for (let i = 1; i <= 30; i++) {
  const accNum = `${200000000000 + i * 19283}`;
  const bankInfo = banksList[i % banksList.length];
  const ifsc = `${bankInfo[1]}${1000 + i}`;
  const val = `${accNum}@${ifsc}`;
  identifiers.push(`(${identId}, 'BANK_ACCOUNT', '${val}', '2026-01-01', '2026-03-01', 1.00)`);
  bankRows.push(`(${identId}, '${accNum}', '${ifsc}', '${bankInfo[0]}', 'Sector ${i}, Metro City', 'SAVINGS')`);
  identId++;
}

for (let i = 0; i < domainsList.length; i++) {
  const dName = `${domainsList[i]}.com`;
  identifiers.push(`(${identId}, 'DOMAIN', '${dName}', '2026-01-01', '2026-03-01', 1.20)`);
  domainRows.push(`(${identId}, '${dName}', 'GoDaddy Inc.', '2025-11-10', 'com', '104.21.56.${10 + i}', true)`);
  identId++;
}

sql += `-- 3. SEED IDENTIFIERS (${identifiers.length} records)
INSERT INTO identifiers (identifier_id, type, value, first_seen_at, last_seen_at, risk_weight) VALUES
${identifiers.join(',\n')};

SELECT setval('identifiers_identifier_id_seq', ${identId - 1});

-- 4. SEED SUB-ENTITIES
INSERT INTO phone_numbers (identifier_id, phone_number, country_code, carrier_name, is_voip, is_flagged_spammer) VALUES
${phoneRows.join(',\n')};

INSERT INTO upi_ids (identifier_id, upi_address, handle_bank, vpa_provider, is_merchant) VALUES
${upiRows.join(',\n')};

INSERT INTO bank_accounts (identifier_id, account_number, ifsc_code, bank_name, branch_name, account_type) VALUES
${bankRows.join(',\n')};

INSERT INTO domains (identifier_id, domain_name, registrar, registration_date, tld, ip_address, is_active_phish) VALUES
${domainRows.join(',\n')};

`;

// 5. SEED COMPLAINTS (Total 55 complaints: 4 in Syndicate Alpha, 3 in Syndicate Beta, 3 in Syndicate Gamma, 45 isolated)
const complaints = [
  // Syndicate Alpha (Guaranteed Demo Scam Ring)
  `('CMP-2026-0001', 'Fraudulent Telegram Task Scam via UPI', 'Victim lured into high-yield task scam on Telegram. Instructed to pay commission to fastrefund@okaxis and account 987654321012.', 50000.00, '2026-02-01', 'INVESTMENT_SCAM', 'LINKED_TO_RING', 'CRITICAL', 'Bengaluru, Karnataka', 'Ramesh Sen', 2, '2026-02-01 10:00:00+05:30', '2026-02-01 10:00:00+05:30')`,
  `('CMP-2026-0002', 'Fake KYC SMS Leading to Bank Transfer', 'Victim received SMS from +919876543210 regarding electricity disconnection. Transferred funds to beneficiary account 987654321012.', 120000.00, '2026-02-03', 'PHISHING', 'LINKED_TO_RING', 'CRITICAL', 'Bengaluru, Karnataka', 'Sunita Rao', 2, '2026-02-03 11:30:00+05:30', '2026-02-03 11:30:00+05:30')`,
  `('CMP-2026-0003', 'Phishing Portal Call Center Fraud', 'Received caller from +919876543210 claiming bank executive. Directed to credential harvester secure-kyc-update.xyz.', 35000.00, '2026-02-05', 'ACCOUNT_TAKEOVER', 'LINKED_TO_RING', 'HIGH', 'Mysuru, Karnataka', 'Arun Patel', 3, '2026-02-05 14:15:00+05:30', '2026-02-05 14:15:00+05:30')`,
  `('CMP-2026-0004', 'NetBanking Impersonation & Siphoning', 'Victim entered credentials on secure-kyc-update.xyz. Money routed immediately into beneficiary account 987654321012.', 85000.00, '2026-02-07', 'BANK_FRAUD', 'LINKED_TO_RING', 'CRITICAL', 'Mangaluru, Karnataka', 'Kavita Menon', 2, '2026-02-07 16:40:00+05:30', '2026-02-07 16:40:00+05:30')`,

  // Syndicate Beta (Phishing / Part-time Job scam)
  `('CMP-2026-0010', 'E-Commerce Review Part-time Job Scam', 'Victim promised daily income for rating products. Sent registration fee via workfromhome@paytm to account 112233445566.', 45000.00, '2026-02-02', 'JOB_SCAM', 'LINKED_TO_RING', 'HIGH', 'Mumbai, Maharashtra', 'Deepak Verma', 2, '2026-02-02 10:15:00+05:30', '2026-02-02 10:15:00+05:30')`,
  `('CMP-2026-0011', 'WhatsApp Recruitment Scam caller', 'Contacted by recruiter at +919811223344. Paid training fee into account 112233445566.', 62000.00, '2026-02-04', 'JOB_SCAM', 'LINKED_TO_RING', 'HIGH', 'Pune, Maharashtra', 'Sneha Kulkarni', 3, '2026-02-04 12:45:00+05:30', '2026-02-04 12:45:00+05:30')`,
  `('CMP-2026-0012', 'Fake Work Portal Impersonation', 'Recruiter from +919811223344 asked victim to register on easy-earn-careers.top paying portal fee.', 28000.00, '2026-02-06', 'PHISHING', 'LINKED_TO_RING', 'MEDIUM', 'Nagpur, Maharashtra', 'Manish Gupta', 3, '2026-02-06 15:00:00+05:30', '2026-02-06 15:00:00+05:30')`,

  // Syndicate Gamma (Crypto / Fake Forex Portal)
  `('CMP-2026-0020', 'Fake Forex Trading Platform Fraud', 'Invested money on platform apex-forex-trade.net. Deposited money through apexvip@ybl.', 150000.00, '2026-02-08', 'INVESTMENT_SCAM', 'LINKED_TO_RING', 'CRITICAL', 'New Delhi, Delhi', 'Rohit Aggarwal', 2, '2026-02-08 09:30:00+05:30', '2026-02-08 09:30:00+05:30')`,
  `('CMP-2026-0021', 'Deposit diversion for VIP Forex Signal', 'Victim sent crypto investment via UPI apexvip@ybl backed by bank account 554433221100.', 210000.00, '2026-02-09', 'INVESTMENT_SCAM', 'LINKED_TO_RING', 'CRITICAL', 'Noida, Uttar Pradesh', 'Ananya Bansal', 2, '2026-02-09 11:20:00+05:30', '2026-02-09 11:20:00+05:30')`,
  `('CMP-2026-0022', 'Investment Agent Impersonation', 'Financial advisor calling from +919700112233 instructed victim to remit to account 554433221100.', 95000.00, '2026-02-10', 'INVESTMENT_SCAM', 'LINKED_TO_RING', 'HIGH', 'Gurugram, Haryana', 'Siddharth Roy', 3, '2026-02-10 14:10:00+05:30', '2026-02-10 14:10:00+05:30')`
];

const categories = ['UPI_FRAUD', 'PHISHING', 'BANK_FRAUD', 'INVESTMENT_SCAM', 'JOB_SCAM', 'SHOPPING_FRAUD', 'IDENTITY_THEFT', 'ACCOUNT_TAKEOVER'];
const cities = ['Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Kochi', 'Patna'];

// Generate 45 isolated complaints
for (let i = 1; i <= 45; i++) {
  const cmpNum = `CMP-2026-00${30 + i}`;
  const cat = categories[i % categories.length];
  const city = cities[i % cities.length];
  const amt = (15000 + (i * 3270) % 85000).toFixed(2);
  const prio = i % 4 === 0 ? 'HIGH' : i % 3 === 0 ? 'LOW' : 'MEDIUM';
  complaints.push(`('${cmpNum}', 'Cyber Incident Report ${30 + i} - ${cat}', 'Synthetic incident reported in ${city} regarding unauthorized debit and deceptive caller.', ${amt}, '2026-02-${(1 + (i % 25)).toString().padStart(2, '0')}', '${cat}', 'NEW', '${prio}', '${city}', 'Citizen Victim ${i}', ${(i % 2) + 2}, '2026-02-11 10:00:00+05:30', '2026-02-11 10:00:00+05:30')`);
}

sql += `-- 5. SEED COMPLAINTS (${complaints.length} records)
INSERT INTO complaints (complaint_id, title, description, reported_amount, reported_date, category, status, priority, location, victim_name, created_by, created_at, updated_at) VALUES
${complaints.join(',\n')};

`;

// 6. SEED COMPLAINT_IDENTIFIERS (Junction table)
const cmpIdents = [
  // Syndicate Alpha (Guaranteed loop demo)
  // CMP-2026-0001 -> Bank001 (id 1), UPI001 (id 2)
  `('CMP-2026-0001', 1, 'BENEFICIARY', 1.00, 'MANUAL_ENTRY')`,
  `('CMP-2026-0001', 2, 'BENEFICIARY', 1.00, 'AI_EXTRACTOR')`,

  // CMP-2026-0002 -> Bank001 (id 1), Phone002 (id 3)
  `('CMP-2026-0002', 1, 'BENEFICIARY', 1.00, 'MANUAL_ENTRY')`,
  `('CMP-2026-0002', 3, 'COMMUNICATION_CHANNEL', 0.95, 'AI_EXTRACTOR')`,

  // CMP-2026-0003 -> Phone002 (id 3), Domain001 (id 4)
  `('CMP-2026-0003', 3, 'COMMUNICATION_CHANNEL', 1.00, 'AI_EXTRACTOR')`,
  `('CMP-2026-0003', 4, 'PHISHING_PORTAL', 0.98, 'AI_EXTRACTOR')`,

  // CMP-2026-0004 -> Domain001 (id 4), Bank001 (id 1) (Cycle completed!)
  `('CMP-2026-0004', 4, 'PHISHING_PORTAL', 1.00, 'AI_EXTRACTOR')`,
  `('CMP-2026-0004', 1, 'BENEFICIARY', 1.00, 'MANUAL_ENTRY')`,

  // Syndicate Beta
  // CMP-2026-0010 -> Bank010 (id 5), UPI010 (id 6)
  `('CMP-2026-0010', 5, 'BENEFICIARY', 1.00, 'MANUAL_ENTRY')`,
  `('CMP-2026-0010', 6, 'BENEFICIARY', 0.95, 'AI_EXTRACTOR')`,

  // CMP-2026-0011 -> Bank010 (id 5), Phone011 (id 7)
  `('CMP-2026-0011', 5, 'BENEFICIARY', 1.00, 'MANUAL_ENTRY')`,
  `('CMP-2026-0011', 7, 'COMMUNICATION_CHANNEL', 0.90, 'AI_EXTRACTOR')`,

  // CMP-2026-0012 -> Phone011 (id 7), Domain002 (id 8)
  `('CMP-2026-0012', 7, 'COMMUNICATION_CHANNEL', 1.00, 'AI_EXTRACTOR')`,
  `('CMP-2026-0012', 8, 'PHISHING_PORTAL', 0.95, 'AI_EXTRACTOR')`,

  // Syndicate Gamma
  // CMP-2026-0020 -> Domain003 (id 12), UPI020 (id 10)
  `('CMP-2026-0020', 12, 'PHISHING_PORTAL', 1.00, 'AI_EXTRACTOR')`,
  `('CMP-2026-0020', 10, 'BENEFICIARY', 0.95, 'MANUAL_ENTRY')`,

  // CMP-2026-0021 -> UPI020 (id 10), Bank020 (id 9)
  `('CMP-2026-0021', 10, 'BENEFICIARY', 1.00, 'AI_EXTRACTOR')`,
  `('CMP-2026-0021', 9, 'BENEFICIARY', 1.00, 'MANUAL_ENTRY')`,

  // CMP-2026-0022 -> Bank020 (id 9), Phone020 (id 11)
  `('CMP-2026-0022', 9, 'BENEFICIARY', 1.00, 'MANUAL_ENTRY')`,
  `('CMP-2026-0022', 11, 'COMMUNICATION_CHANNEL', 0.92, 'AI_EXTRACTOR')`
];

// Link the isolated complaints to their respective isolated identifiers
for (let i = 1; i <= 45; i++) {
  const cmpNum = `CMP-2026-00${30 + i}`;
  const phoneIdentId = 12 + ((i % 35) + 1); // offset into phone identifiers
  const upiIdentId = 47 + ((i % 30) + 1);   // offset into UPI
  cmpIdents.push(`('${cmpNum}', ${phoneIdentId}, 'COMMUNICATION_CHANNEL', 0.95, 'AI_EXTRACTOR')`);
  if (i % 2 === 0) {
    cmpIdents.push(`('${cmpNum}', ${upiIdentId}, 'BENEFICIARY', 0.90, 'AI_EXTRACTOR')`);
  }
}

sql += `-- 6. SEED COMPLAINT_IDENTIFIERS (${cmpIdents.length} links)
INSERT INTO complaint_identifiers (complaint_id, identifier_id, role_in_fraud, confidence_score, extracted_by) VALUES
${cmpIdents.join(',\n')};

`;

// 7. SEED TRANSACTIONS (120+ transactions)
const transactions = [];
// Syndicate Alpha transactions
for (let t = 1; t <= 25; t++) {
  const txId = `TXN-ALPHA-${1000 + t}`;
  const amt = (10000 + (t * 4300) % 70000).toFixed(2);
  const isAnomaly = t % 4 === 0;
  const reason = isAnomaly ? "'High velocity transfer into mule account within 10 minutes'" : "NULL";
  transactions.push(`('${txId}', 'CMP-2026-0001', 2, 1, ${amt}, 'INR', '2026-02-01 10:15:00+05:30', 'UPI', ${isAnomaly}, ${reason})`);
}
for (let t = 1; t <= 20; t++) {
  const txId = `TXN-ALPHA-B-${2000 + t}`;
  const amt = (15000 + (t * 5100) % 80000).toFixed(2);
  const isAnomaly = t % 5 === 0;
  const reason = isAnomaly ? "'Rapid fund dissipation across multiple recipient branches'" : "NULL";
  transactions.push(`('${txId}', 'CMP-2026-0002', NULL, 1, ${amt}, 'INR', '2026-02-03 12:00:00+05:30', 'IMPS', ${isAnomaly}, ${reason})`);
}

// Syndicate Beta transactions
for (let t = 1; t <= 20; t++) {
  const txId = `TXN-BETA-${3000 + t}`;
  const amt = (8000 + (t * 2200) % 50000).toFixed(2);
  transactions.push(`('${txId}', 'CMP-2026-0010', 6, 5, ${amt}, 'INR', '2026-02-02 11:00:00+05:30', 'UPI', false, NULL)`);
}

// Syndicate Gamma transactions
for (let t = 1; t <= 20; t++) {
  const txId = `TXN-GAMMA-${4000 + t}`;
  const amt = (30000 + (t * 7500) % 150000).toFixed(2);
  const isAnomaly = t % 3 === 0;
  const reason = isAnomaly ? "'Volume anomaly: 400% above 24hr baseline'" : "NULL";
  transactions.push(`('${txId}', 'CMP-2026-0020', 10, 9, ${amt}, 'INR', '2026-02-08 10:00:00+05:30', 'NEFT', ${isAnomaly}, ${reason})`);
}

// Background / generic transactions (40 transactions)
for (let t = 1; t <= 40; t++) {
  const txId = `TXN-ISOLATED-${5000 + t}`;
  const amt = (2500 + (t * 1150) % 25000).toFixed(2);
  const receiverId = 77 + ((t % 25) + 1); // points to bank accounts
  transactions.push(`('${txId}', 'CMP-2026-00${30 + (t % 40) + 1}', NULL, ${receiverId}, ${amt}, 'INR', '2026-02-12 14:00:00+05:30', 'UPI', false, NULL)`);
}

sql += `-- 7. SEED TRANSACTIONS (${transactions.length} records)
INSERT INTO transactions (transaction_id, complaint_id, sender_identifier_id, receiver_identifier_id, amount, currency, transaction_timestamp, payment_channel, is_flagged_anomaly, anomaly_reason) VALUES
${transactions.join(',\n')};

`;

// 8. SEED FRAUD_CASES & RISK_SCORES
const cases = [
  `('CASE-2026-001', 'Operation Hydra: Task Scam Syndicate Alpha', 'CMP-2026-0001', 2, 'ACTIVE', 'High-confidence cross-complaint fraud ring utilizing shared HDFC beneficiary account and Airtel voip gateway.', 'Investigation indicates centralized laundering loop linking Complaints CMP-2026-0001, 0002, 0003, and 0004.', '2026-02-02 12:00:00+05:30')`,
  `('CASE-2026-002', 'Operation JobTrap: Work-from-Home Syndicate Beta', 'CMP-2026-0010', 3, 'ACTIVE', 'Multi-victim e-commerce review scam utilizing Paytm payments gateway and deceptive recruitment numbers.', 'Connected through SBI beneficiary account 112233445566 and recruiter caller +919811223344.', '2026-02-03 14:00:00+05:30')`,
  `('CASE-2026-003', 'Operation Apex: Crypto & Forex Impersonation Ring', 'CMP-2026-0020', 2, 'IN_REVIEW', 'Sophisticated forex investment portal siphoning funds via high-limit ICICI current accounts.', 'Tied to phishing portal apex-forex-trade.net and UPI handle apexvip@ybl.', '2026-02-09 16:00:00+05:30')`,
  `('CASE-2026-004', 'Isolated Case: Identity Theft Report', 'CMP-2026-0035', 3, 'NEW', 'Preliminary investigation of unauthorized account debit.', NULL, NULL)`
];

const riskScores = [
  // CASE-2026-001: Alpha -> 92 (CRITICAL)
  `('CASE-2026-001', 92, 'CRITICAL', 28, 22, 24, 18, '[{"factor": "IDENTIFIER_REUSE", "weight": 28, "detail": "Beneficiary account 987654321012 appears in 3 other active complaints"}, {"factor": "TRANSACTION_ANOMALY", "weight": 22, "detail": "6 high-velocity transactions flagged as money-mule layering"}, {"factor": "NETWORK_DENSITY", "weight": 24, "detail": "Complete closed loop network across 4 complaints and 4 identifiers"}, {"factor": "FINANCIAL_EXPOSURE", "weight": 18, "detail": "Aggregate victim loss exceeds Rs. 290,000"}]'::jsonb)`,
  
  // CASE-2026-002: Beta -> 78 (HIGH)
  `('CASE-2026-002', 78, 'HIGH', 24, 15, 21, 18, '[{"factor": "IDENTIFIER_REUSE", "weight": 24, "detail": "Shared SBI account and WhatsApp phone number"}, {"factor": "TRANSACTION_ANOMALY", "weight": 15, "detail": "Moderate velocity spikes"}, {"factor": "NETWORK_DENSITY", "weight": 21, "detail": "Linear chain spanning 3 complaints"}, {"factor": "FINANCIAL_EXPOSURE", "weight": 18, "detail": "Aggregate loss Rs. 135,000"}]'::jsonb)`,

  // CASE-2026-003: Gamma -> 84 (CRITICAL)
  `('CASE-2026-003', 84, 'CRITICAL', 25, 20, 21, 18, '[{"factor": "IDENTIFIER_REUSE", "weight": 25, "detail": "Shared ICICI current account and apexvip UPI handle"}, {"factor": "TRANSACTION_ANOMALY", "weight": 20, "detail": "Large-ticket transfers flagged for volume anomaly"}, {"factor": "NETWORK_DENSITY", "weight": 21, "detail": "3 linked complaints with high-loss threshold"}, {"factor": "FINANCIAL_EXPOSURE", "weight": 18, "detail": "Aggregate loss Rs. 455,000"}]'::jsonb)`,

  // CASE-2026-004: Isolated -> 15 (LOW)
  `('CASE-2026-004', 15, 'LOW', 0, 5, 5, 5, '[{"factor": "IDENTIFIER_REUSE", "weight": 0, "detail": "No other complaints share this identifier"}, {"factor": "TRANSACTION_ANOMALY", "weight": 5, "detail": "Normal transaction velocity"}, {"factor": "NETWORK_DENSITY", "weight": 5, "detail": "Isolated node"}, {"factor": "FINANCIAL_EXPOSURE", "weight": 5, "detail": "Loss under Rs. 20,000"}]'::jsonb)`
];

sql += `-- 8. SEED FRAUD_CASES
INSERT INTO fraud_cases (case_id, case_title, primary_complaint_id, assigned_investigator_id, status, investigation_notes, ai_summary, ai_summary_generated_at) VALUES
${cases.join(',\n')};

-- 9. SEED RISK_SCORES
INSERT INTO risk_scores (case_id, final_score, risk_level, identifier_reuse_score, transaction_anomaly_score, network_density_score, complaint_frequency_score, score_factors) VALUES
${riskScores.join(',\n')};

-- 10. SEED INITIAL AUDIT LOGS
INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata, ip_address) VALUES
(1, 'SYSTEM_INITIALIZATION', 'SYSTEM', 'ROOT', '{"version": "1.0.0", "status": "BOOTSTRAP_COMPLETE"}'::jsonb, '127.0.0.1'),
(2, 'LOGIN', 'USER', '2', '{"method": "CREDENTIALS", "userAgent": "CyberMesh Investigator Workstation"}'::jsonb, '192.168.1.104'),
(2, 'CREATE_CASE', 'FRAUD_CASE', 'CASE-2026-001', '{"primaryComplaint": "CMP-2026-0001", "assignedTo": 2}'::jsonb, '192.168.1.104'),
(2, 'CALCULATE_RISK', 'RISK_SCORE', 'CASE-2026-001', '{"score": 92, "level": "CRITICAL"}'::jsonb, '192.168.1.104'),
(3, 'LOGIN', 'USER', '3', '{"method": "CREDENTIALS", "userAgent": "CyberMesh Analyst Terminal"}'::jsonb, '192.168.1.109');
`;

fs.writeFileSync(path.join(__dirname, 'sample_data.sql'), sql, 'utf8');
console.log('Successfully generated database/sample_data.sql with:');
console.log(`- ${identifiers.length} Identifiers`);
console.log(`- ${complaints.length} Complaints`);
console.log(`- ${cmpIdents.length} Complaint Identifiers`);
console.log(`- ${transactions.length} Transactions`);
console.log(`- 4 Fraud Cases & Risk Scores`);
