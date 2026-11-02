require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { initDatabase, exec, query, getActiveEngine } = require('./db');

async function runSqlFile(filePath) {
  console.log(`[CyberMesh DB Init] Executing: ${path.basename(filePath)}...`);
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  
  try {
    await exec(sqlContent);
    console.log(`[CyberMesh DB Init] Completed: ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`[CyberMesh DB Init] Error executing ${path.basename(filePath)}:`, err.message);
    throw err;
  }
}

async function initializeDatabase() {
  try {
    console.log('====================================================');
    console.log('CYBERMESH: DATABASE INITIALIZATION & SEEDING');
    console.log('====================================================');

    await initDatabase();
    console.log(`[CyberMesh DB Init] Target Engine: ${getActiveEngine()}`);

    const baseDbDir = path.join(__dirname, '..', '..', '..', 'database');

    // 1. Schema
    await runSqlFile(path.join(baseDbDir, 'schema.sql'));

    // 2. Indexes
    await runSqlFile(path.join(baseDbDir, 'indexes.sql'));

    // 3. Procedures & Views
    await runSqlFile(path.join(baseDbDir, 'procedures.sql'));

    // 4. Sample Data
    await runSqlFile(path.join(baseDbDir, 'sample_data.sql'));

    // Verification check
    const complaintCount = await query('SELECT COUNT(*) as count FROM complaints');
    const identCount = await query('SELECT COUNT(*) as count FROM identifiers');
    const txCount = await query('SELECT COUNT(*) as count FROM transactions');
    const caseCount = await query('SELECT COUNT(*) as count FROM fraud_cases');

    console.log('====================================================');
    console.log('[CyberMesh DB Init] Verification Counts:');
    console.log(` - Complaints:   ${complaintCount.rows[0].count}`);
    console.log(` - Identifiers:  ${identCount.rows[0].count}`);
    console.log(` - Transactions: ${txCount.rows[0].count}`);
    console.log(` - Fraud Cases:  ${caseCount.rows[0].count}`);
    console.log('====================================================');
    console.log('Database initialization succeeded!');
    return true;
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDatabase().then(() => process.exit(0));
}

module.exports = { initializeDatabase };
