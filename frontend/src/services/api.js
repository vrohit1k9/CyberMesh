const BASE_URL = '/api';

/**
 * Enhanced fetch wrapper with JWT bearer injection and uniform error handling
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('cybermesh_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('cybermesh_token');
        localStorage.removeItem('cybermesh_user');
        window.location.href = '/login';
      }
      const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API Error: ${endpoint}]`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: credentials }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  getMe: () => apiFetch('/auth/me'),

  // Dashboard
  getDashboardStats: () => apiFetch('/dashboard/stats'),

  // Complaints
  getComplaints: (params = '') => apiFetch(`/complaints${params ? `?${params}` : ''}`),
  getComplaintById: (id) => apiFetch(`/complaints/${id}`),
  createComplaint: (data) => apiFetch('/complaints', { method: 'POST', body: data }),
  updateComplaint: (id, data) => apiFetch(`/complaints/${id}`, { method: 'PUT', body: data }),

  // Cases
  getCases: (params = '') => apiFetch(`/cases${params ? `?${params}` : ''}`),
  getCaseById: (id) => apiFetch(`/cases/${id}`),
  updateCaseStatus: (id, data) => apiFetch(`/cases/${id}/status`, { method: 'PATCH', body: data }),
  getCaseRisk: (id) => apiFetch(`/cases/${id}/risk`),
  recalculateRisk: (id) => apiFetch(`/cases/${id}/recalculate-risk`, { method: 'POST' }),
  getCaseNetwork: (id, depth = 3) => apiFetch(`/cases/${id}/network?depth=${depth}`),
  getGlobalNetworks: () => apiFetch('/cases/network/global'),
  generateAiSummary: (id) => apiFetch(`/cases/${id}/ai-summary`, { method: 'POST' }),

  // AI Service Gateway
  extractEntities: (text) => apiFetch('/ai/extract', { method: 'POST', body: { text } }),
  classifyText: (title, description) => apiFetch('/ai/classify', { method: 'POST', body: { title, description } }),
  ragAnalyze: (text, topK = 2) => apiFetch('/ai/rag-analyze', { method: 'POST', body: { text, topK } }),
  correlate: (data) => apiFetch('/ai/correlate', { method: 'POST', body: data }),

  // Transactions
  getTransactions: (params = '') => apiFetch(`/transactions${params ? `?${params}` : ''}`),
  getTransactionById: (id) => apiFetch(`/transactions/${id}`),
  runAnomalyDetection: () => apiFetch('/transactions/run-anomaly-detection', { method: 'POST' }),

  // Audit Logs
  getAuditLogs: (params = '') => apiFetch(`/audit-logs${params ? `?${params}` : ''}`)
};
