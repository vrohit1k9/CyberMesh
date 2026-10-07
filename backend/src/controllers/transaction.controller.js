const { query } = require('../config/db');

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

module.exports = {
  getTransactions,
  getTransactionById
};
