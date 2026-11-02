const { query } = require('../config/db');

/**
 * Aggregates real-time dashboard telemetry from PostgreSQL
 */
async function getDashboardStats(req, res) {
  try {
    // 1. KPI Totals
    const totalComplaintsRes = await query('SELECT COUNT(*) as count, COALESCE(SUM(reported_amount), 0) as total_amount FROM complaints;');
    const activeCasesRes = await query("SELECT COUNT(*) as count FROM fraud_cases WHERE status IN ('NEW', 'ACTIVE', 'IN_REVIEW');");
    const highRiskRes = await query("SELECT COUNT(*) as count FROM risk_scores WHERE risk_level = 'HIGH';");
    const criticalRiskRes = await query("SELECT COUNT(*) as count FROM risk_scores WHERE risk_level = 'CRITICAL';");

    // Count distinct identifiers linked to >= 2 complaints (reused)
    const reusedRes = await query(`
      SELECT COUNT(*) as count FROM (
        SELECT identifier_id FROM complaint_identifiers 
        GROUP BY identifier_id 
        HAVING COUNT(DISTINCT complaint_id) > 1
      ) t;
    `);

    // 2. Complaints by Category
    const categoryRes = await query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(reported_amount), 0) as amount
      FROM complaints
      GROUP BY category
      ORDER BY count DESC;
    `);

    // 3. Risk Level Distribution
    const riskDistRes = await query(`
      SELECT risk_level, COUNT(*) as count
      FROM risk_scores
      GROUP BY risk_level
      ORDER BY 
        CASE risk_level 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END;
    `);

    // 4. Timeline (Complaints reported over recent dates)
    const timelineRes = await query(`
      SELECT reported_date, COUNT(*) as count, SUM(reported_amount) as daily_amount
      FROM complaints
      GROUP BY reported_date
      ORDER BY reported_date ASC
      LIMIT 15;
    `);

    // 5. Transaction Anomaly Metrics
    const txMetricsRes = await query(`
      SELECT 
        COUNT(*) as total_txns,
        COUNT(*) FILTER (WHERE is_flagged_anomaly = TRUE) as anomaly_txns,
        COALESCE(SUM(amount), 0) as total_volume,
        COALESCE(SUM(amount) FILTER (WHERE is_flagged_anomaly = TRUE), 0) as anomaly_volume
      FROM transactions;
    `);

    // 6. Recent Cases (top 8)
    const recentCasesRes = await query(`
      SELECT 
        fc.case_id, fc.case_title, fc.status, fc.created_at,
        c.category, c.reported_amount,
        rs.final_score as risk_score, rs.risk_level
      FROM fraud_cases fc
      JOIN complaints c ON fc.primary_complaint_id = c.complaint_id
      LEFT JOIN risk_scores rs ON fc.case_id = rs.case_id
      ORDER BY fc.created_at DESC
      LIMIT 8;
    `);

    return res.json({
      success: true,
      data: {
        kpis: {
          totalComplaints: parseInt(totalComplaintsRes.rows[0].count, 10),
          totalReportedLoss: parseFloat(totalComplaintsRes.rows[0].total_amount),
          activeCases: parseInt(activeCasesRes.rows[0].count, 10),
          highRiskCases: parseInt(highRiskRes.rows[0].count, 10),
          criticalRiskCases: parseInt(criticalRiskRes.rows[0].count, 10),
          reusedIdentifiers: parseInt(reusedRes.rows[0].count, 10)
        },
        categoryBreakdown: categoryRes.rows.map(r => ({
          category: r.category,
          count: parseInt(r.count, 10),
          amount: parseFloat(r.amount)
        })),
        riskDistribution: riskDistRes.rows.map(r => ({
          level: r.risk_level,
          count: parseInt(r.count, 10)
        })),
        timeline: timelineRes.rows.map(r => ({
          date: r.reported_date,
          count: parseInt(r.count, 10),
          amount: parseFloat(r.daily_amount || 0)
        })),
        transactionMetrics: {
          total: parseInt(txMetricsRes.rows[0].total_txns, 10),
          flagged: parseInt(txMetricsRes.rows[0].anomaly_txns, 10),
          totalVolume: parseFloat(txMetricsRes.rows[0].total_volume),
          anomalyVolume: parseFloat(txMetricsRes.rows[0].anomaly_volume)
        },
        recentCases: recentCasesRes.rows
      }
    });
  } catch (error) {
    console.error('[Dashboard Controller] Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'DASHBOARD_STATS_FAILED', message: error.message }
    });
  }
}

module.exports = {
  getDashboardStats
};
