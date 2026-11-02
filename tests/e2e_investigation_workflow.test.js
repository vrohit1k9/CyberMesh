process.env.TEST_MODE = '1';
process.env.PORT = '5008';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startServer } = require('../backend/src/server');

let serverInstance;
let baseUrl = 'http://localhost:5008';
let token;

before(async () => {
  serverInstance = await startServer();
});

after(() => {
  if (serverInstance) {
    serverInstance.close();
  }
});

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
}

test('COMPLETE END-TO-END INVESTIGATION WORKFLOW (Section 42)', async (t) => {
  // Step 1: Investigator logs in
  await t.test('Step 1: Investigator authentication', async () => {
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { username: 'investigator_raj', password: 'CyberMesh2026!' }
    });
    assert.strictEqual(status, 200);
    assert.ok(data.data.token);
    token = data.data.token;
  });

  // Step 2: Dashboard reflects real database figures
  await t.test('Step 2: Dashboard telemetry check', async () => {
    const { status, data } = await apiRequest('/api/dashboard/stats');
    assert.strictEqual(status, 200);
    assert.ok(data.data.kpis.totalComplaints >= 50);
    assert.ok(data.data.kpis.criticalRiskCases >= 1);
  });

  // Step 3: AI entity extraction from complaint narrative
  let extractedEntities = [];
  await t.test('Step 3: AI Entity Extraction from raw complaint', async () => {
    const rawText = (
      "Citizen received malicious call from +919876543210 regarding electricity disconnection. " +
      "Instructed to transfer Rs. 75,000 to fastrefund@okaxis and account 987654321012@HDFC0001234. " +
      "Victim also visited portal secure-kyc-update.xyz."
    );
    const { status, data } = await apiRequest('/api/ai/extract', {
      method: 'POST',
      body: { text: rawText }
    });
    assert.strictEqual(status, 200);
    assert.ok(data.data.entities.length >= 3);
    extractedEntities = data.data.entities;
  });

  // Step 4: Investigator creates complaint with confirmed identifiers
  let createdComplaintId = '';
  let createdCaseId = '';
  await t.test('Step 4: Create Complaint & Provision Case', async () => {
    const { status, data } = await apiRequest('/api/complaints', {
      method: 'POST',
      body: {
        title: 'Electricity KYC Phishing & Mule Transfer',
        description: 'Citizen received spoofed call directing to update KYC via phishing domain and transferred funds.',
        reported_amount: 75000.00,
        category: 'PHISHING',
        priority: 'CRITICAL',
        location: 'Bengaluru, Karnataka',
        victim_name: 'Anand Murthy',
        isAiExtracted: true,
        identifiers: extractedEntities
      }
    });
    assert.strictEqual(status, 201);
    assert.ok(data.data.complaint.complaint_id);
    assert.ok(data.data.caseId);
    createdComplaintId = data.data.complaint.complaint_id;
    createdCaseId = data.data.caseId;
  });

  // Step 5: Discover recursive network connections
  await t.test('Step 5: Recursive CTE Traversal & Syndicate Detection', async () => {
    const { status, data } = await apiRequest(`/api/cases/${createdCaseId}/network?depth=4`);
    assert.strictEqual(status, 200);

    const discoveredComplaints = data.data.nodes
      .filter(n => n.type === 'COMPLAINT')
      .map(n => n.data.complaintId);

    console.log('[E2E Test] Connected complaints in discovered network:', discoveredComplaints);

    // Because this new complaint shared identifiers with Syndicate Alpha (Bank 987654321012 & Phone +919876543210),
    // the recursive CTE MUST discover the connection to CMP-2026-0001, CMP-2026-0002, CMP-2026-0003, CMP-2026-0004!
    assert.ok(discoveredComplaints.includes(createdComplaintId));
    assert.ok(discoveredComplaints.includes('CMP-2026-0001'), 'Must connect to CMP-2026-0001');
    assert.ok(discoveredComplaints.length >= 4, 'Must reveal organized syndicate');
  });

  // Step 6: Risk score evaluation
  await t.test('Step 6: Risk Engine 4-factor scoring', async () => {
    const { status, data } = await apiRequest(`/api/cases/${createdCaseId}/risk`);
    assert.strictEqual(status, 200);
    assert.ok(data.data.risk.final_score >= 80, 'Risk score should be >= 80 (CRITICAL)');
    assert.strictEqual(data.data.risk.risk_level, 'CRITICAL');
  });

  // Step 7: Generate AI Investigation Summary
  await t.test('Step 7: AI Investigation Brief Generation', async () => {
    const { status, data } = await apiRequest(`/api/cases/${createdCaseId}/ai-summary`, {
      method: 'POST'
    });
    assert.strictEqual(status, 200);
    assert.ok(data.data.summary.includes(createdCaseId));
    assert.ok(data.data.recommendations.length > 0);
  });

  // Step 8: Investigator updates case status
  await t.test('Step 8: Update Case Status & Investigation Log', async () => {
    const { status, data } = await apiRequest(`/api/cases/${createdCaseId}/status`, {
      method: 'PATCH',
      body: {
        status: 'ESCALATED',
        investigation_notes: 'Escalated to State Cyber Crime Police Station; syndicate bank accounts flagged.'
      }
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.data.case.status, 'ESCALATED');
  });

  // Step 9: Audit log verification
  await t.test('Step 9: Audit Log chain of custody check', async () => {
    const { status, data } = await apiRequest('/api/audit-logs?limit=10');
    assert.strictEqual(status, 200);
    const actions = data.data.logs.map(l => l.action);
    assert.ok(actions.includes('CREATE_COMPLAINT'));
    assert.ok(actions.includes('UPDATE_CASE_STATUS'));
  });
});
