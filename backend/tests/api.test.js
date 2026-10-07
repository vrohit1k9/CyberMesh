process.env.TEST_MODE = '1';
process.env.PORT = '5005';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { app, startServer } = require('../src/server');

let serverInstance;
let baseUrl = 'http://localhost:5005';
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

test('1. System Health Check', async () => {
  const { status, data } = await apiRequest('/api/health');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.status, 'UP');
});

test('2. Authentication Flow (Login & JWT issuance)', async () => {
  const { status, data } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: {
      username: 'investigator_raj',
      password: 'CyberMesh2026!'
    }
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.token, 'Should return JWT token');
  assert.strictEqual(data.data.user.username, 'investigator_raj');
  assert.strictEqual(data.data.user.role, 'INVESTIGATOR');

  token = data.data.token;
});

test('3. Verify Current User Profile (/api/auth/me)', async () => {
  const { status, data } = await apiRequest('/api/auth/me');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.user.username, 'investigator_raj');
});

test('4. Fetch Real Database Dashboard Statistics', async () => {
  const { status, data } = await apiRequest('/api/dashboard/stats');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.kpis.totalComplaints >= 50, 'Total complaints count should be at least 50');
  assert.ok(data.data.categoryBreakdown.length > 0, 'Categories should be aggregated');
  assert.ok(data.data.riskDistribution.length > 0, 'Risk distribution should be populated');
});

test('5. Fetch Complaints with Pagination & Filter', async () => {
  const { status, data } = await apiRequest('/api/complaints?limit=10&page=1');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.complaints.length, 10);
  assert.ok(data.data.pagination.total >= 50);
});

test('6. Verify Guaranteed Demo Network (Syndicate Alpha Recursive CTE)', async () => {
  // Case CASE-2026-001 corresponds to primary complaint CMP-2026-0001
  const { status, data } = await apiRequest('/api/cases/CASE-2026-001/network?depth=4');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);

  const nodeIds = data.data.nodes.map(n => n.id);
  const complaintIds = data.data.nodes
    .filter(n => n.type === 'COMPLAINT')
    .map(n => n.data.complaintId);

  console.log('[Test Network] Discovered Complaints in Syndicate Alpha:', complaintIds);

  // The recursive CTE must discover the connected loop:
  // CMP-2026-0001 (Root) -> Bank001 -> CMP-2026-0002 -> Phone002 -> CMP-2026-0003 -> Domain001 -> CMP-2026-0004
  assert.ok(complaintIds.includes('CMP-2026-0001'), 'Must include root C001');
  assert.ok(complaintIds.includes('CMP-2026-0002'), 'Must discover C002 via shared bank account');
  assert.ok(complaintIds.includes('CMP-2026-0003'), 'Must discover C003 via shared phone');
  assert.ok(complaintIds.includes('CMP-2026-0004'), 'Must discover C004 via shared domain');
  assert.ok(data.data.metrics.totalComplaints >= 4, 'Must identify all 4 ring complaints');
});

test('7. Transparent 4-Factor Risk Score Calculation', async () => {
  const { status, data } = await apiRequest('/api/cases/CASE-2026-001/risk');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.risk.risk_level, 'CRITICAL');
  assert.ok(data.data.risk.final_score >= 80, 'Syndicate Alpha risk score should be >= 80');
});

test('8. AI Entity Extraction Gateway', async () => {
  const sampleComplaint = "Scammer asked victim to transfer Rs. 35,000 to demo123@upi and caller used phone 919876543210 on portal verify-secure.xyz";
  const { status, data } = await apiRequest('/api/ai/extract', {
    method: 'POST',
    body: { text: sampleComplaint }
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  const entities = data.data.entities;
  const types = entities.map(e => e.type);
  assert.ok(types.includes('UPI'), 'Should extract UPI');
  assert.ok(types.includes('PHONE'), 'Should extract PHONE');
  assert.ok(types.includes('DOMAIN'), 'Should extract DOMAIN');
});

test('9. AI Case Investigation Summary Generation', async () => {
  const { status, data } = await apiRequest('/api/cases/CASE-2026-001/ai-summary', {
    method: 'POST'
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.summary.includes('CASE-2026-001'));
  assert.ok(data.data.patterns.length > 0);
  assert.ok(data.data.recommendations.length > 0);
});

test('10. Audit Logging Ledger Integrity', async () => {
  const { status, data } = await apiRequest('/api/audit-logs?limit=5');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.logs.length > 0, 'Audit logs should record actions');
  const actions = data.data.logs.map(l => l.action);
  assert.ok(actions.includes('LOGIN') || actions.includes('GENERATE_AI_SUMMARY'));
});
