const { query } = require('../config/db');
const { logAuditEvent } = require('../services/audit.service');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * List transactions with filtering by anomaly flag, complaint, channel, etc.
 */
async function getTransactions(req, res) {
  try {
    const {
      anomalyOnly,
      complaintId,
      paymentChannel,
      search,
      page = 1,
      limit = 25
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (anomalyOnly === 'true' || anomalyOnly === true) {
      conditions.push('t.is_flagged_anomaly = TRUE');
    }

    if (complaintId) {
      conditions.push(`t.complaint_id = $${pIdx}`);
      params.push(complaintId);
      pIdx++;
    }

    if (paymentChannel) {
      conditions.push(`t.payment_channel = $${pIdx}`);
      params.push(paymentChannel.toUpperCase());
      pIdx++;
    }

    if (search) {
      conditions.push(`(t.transaction_id ILIKE $${pIdx} OR t.anomaly_reason ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM transactions t ${whereClause};`;
    const countRes = await query(countSql, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT 
        t.transaction_id, t.complaint_id, t.amount, t.currency, 
        t.transaction_timestamp, t.payment_channel, 
        t.is_flagged_anomaly, t.anomaly_reason,
        i_sender.value as sender_value, i_sender.type as sender_type,
        i_recv.value as receiver_value, i_recv.type as receiver_type
      FROM transactions t
      LEFT JOIN identifiers i_sender ON t.sender_identifier_id = i_sender.identifier_id
      LEFT JOIN identifiers i_recv ON t.receiver_identifier_id = i_recv.identifier_id
      ${whereClause}
      ORDER BY t.transaction_timestamp DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};
    `;

    params.push(limitNum, offset);
    const dataRes = await query(dataSql, params);

    return res.json({
      success: true,
      data: {
        transactions: dataRes.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_TRANSACTIONS_FAILED', message: error.message }
    });
  }
}

/**
 * Get single transaction details
 */
async function getTransactionById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        t.*,
        i_sender.value as sender_value, i_sender.type as sender_type,
        i_recv.value as receiver_value, i_recv.type as receiver_type,
        c.title as complaint_title, c.category as complaint_category
      FROM transactions t
      LEFT JOIN identifiers i_sender ON t.sender_identifier_id = i_sender.identifier_id
      LEFT JOIN identifiers i_recv ON t.receiver_identifier_id = i_recv.identifier_id
      LEFT JOIN complaints c ON t.complaint_id = c.complaint_id
      WHERE t.transaction_id = $1;
    `;

    const resData = await query(sql, [id]);
    if (resData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRANSACTION_NOT_FOUND', message: `Transaction ${id} not found` }
      });
    }

    return res.json({
      success: true,
      data: {
        transaction: resData.rows[0]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_TRANSACTION_FAILED', message: error.message }
    });
  }
}

/**
 * Run statistical anomaly detection across transactions (via AI service with local fallback)
 * Updates database flags and reasons for anomalous transactions
 */
async function runBatchAnomalyDetection(req, res) {
  try {
    const txSql = `
      SELECT 
        t.transaction_id, t.complaint_id, t.amount, t.currency, 
        t.transaction_timestamp, t.payment_channel, 
        t.is_flagged_anomaly, t.anomaly_reason,
        i_sender.value as sender_value,
        i_recv.value as receiver_value
      FROM transactions t
      LEFT JOIN identifiers i_sender ON t.sender_identifier_id = i_sender.identifier_id
      LEFT JOIN identifiers i_recv ON t.receiver_identifier_id = i_recv.identifier_id
      ORDER BY t.transaction_timestamp DESC
      LIMIT 500;
    `;
    const txRes = await query(txSql);
    const transactions = txRes.rows;

    if (transactions.length === 0) {
      return res.json({
        success: true,
        data: {
          totalAnalyzed: 0,
          flaggedCount: 0,
          flaggedIds: [],
          engine: 'NONE'
        }
      });
    }

    let flaggedList = [];
    let engine = 'STATISTICAL_LOCAL_ENGINE';

    // Attempt AI Microservice
    try {
      const payload = {
        transactions: transactions.map(t => ({
          transaction_id: t.transaction_id,
          amount: parseFloat(t.amount) || 0,
          timestamp: new Date(t.transaction_timestamp).toISOString(),
          receiver_id: t.receiver_value || 'UNKNOWN',
          sender_id: t.sender_value || 'CITIZEN',
          payment_channel: t.payment_channel || 'UPI'
        }))
      };

      const response = await fetch(`${AI_SERVICE_URL}/api/detect-anomalies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        flaggedList = json.analysis ? json.analysis.filter(a => a.is_anomalous) : [];
        engine = 'AI_MICROSERVICE_SCIPY_NUMPY';
      }
    } catch (e) {
      // AI Service offline -> local statistical fallback
    }

    // Fallback if AI service didn't return
    if (engine === 'STATISTICAL_LOCAL_ENGINE') {
      const amounts = transactions.map(t => parseFloat(t.amount) || 0);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (amounts.length || 1);
      const stdDev = Math.sqrt(variance);

      // Frequency by receiver
      const receiverCounts = {};
      transactions.forEach(t => {
        const r = t.receiver_value || 'UNKNOWN';
        receiverCounts[r] = (receiverCounts[r] || 0) + 1;
      });

      flaggedList = [];
      transactions.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        const reasons = [];
        let isAnomalous = false;

        // Rule 1: High Z-Score (amount > 2.2 std dev above mean)
        if (stdDev > 0) {
          const zScore = (amt - mean) / stdDev;
          if (zScore >= 2.2) {
            isAnomalous = true;
            reasons.push(`Amount outlier: Z-score ${zScore.toFixed(2)} (Amount ₹${amt.toLocaleString('en-IN')} vs Mean ₹${Math.round(mean).toLocaleString('en-IN')})`);
          }
        }

        // Rule 2: Velocity / Mule Account Inflow Spike (>= 8 tx in dataset)
        const r = t.receiver_value || 'UNKNOWN';
        if (receiverCounts[r] >= 8) {
          isAnomalous = true;
          reasons.push(`Velocity surge: Receiver account received ${receiverCounts[r]} transfers in short window`);
        }

        // Rule 3: High single ticket threshold (>= 1,00,000 INR)
        if (amt >= 100000.0) {
          isAnomalous = true;
          reasons.push('High-value threshold: Transaction exceeds ₹1,00,000 regulatory flag threshold');
        }

        if (isAnomalous) {
          flaggedList.push({
            transaction_id: t.transaction_id,
            amount: amt,
            reasons: reasons
          });
        }
      });
    }

    // Persist updates to DB
    for (const item of flaggedList) {
      const reasonStr = Array.isArray(item.reasons) ? item.reasons.join('; ') : 'Statistical Anomaly Flagged';
      await query(`
        UPDATE transactions
        SET is_flagged_anomaly = TRUE, anomaly_reason = $1
        WHERE transaction_id = $2;
      `, [reasonStr, item.transaction_id]);
    }

    // Audit log
    await logAuditEvent({
      userId: req.user ? req.user.userId : null,
      action: 'RUN_ANOMALY_DETECTION',
      resource: 'TRANSACTIONS',
      metadata: {
        totalAnalyzed: transactions.length,
        flaggedCount: flaggedList.length,
        engine
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: {
        totalAnalyzed: transactions.length,
        flaggedCount: flaggedList.length,
        flaggedIds: flaggedList.map(f => f.transaction_id),
        engine
      }
    });
  } catch (error) {
    console.error('[Transaction Controller] Anomaly scan failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'ANOMALY_DETECTION_FAILED', message: error.message }
    });
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  runBatchAnomalyDetection
};
