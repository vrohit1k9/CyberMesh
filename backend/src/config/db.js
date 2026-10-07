const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

let pool = null;
let pgliteInstance = null;
let activeEngine = 'UNKNOWN'; // 'POSTGRES_REMOTE' | 'PGLITE_EMBEDDED'

/**
 * Initializes and establishes database connection.
 * Checks for external PostgreSQL server via DATABASE_URL;
 * falls back seamlessly to embedded PostgreSQL (PGlite) for zero-dependency local runs.
 */
async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  // Try standard PostgreSQL pool first if configured
  if (dbUrl && !process.env.FORCE_EMBEDDED_DB) {
    try {
      const testPool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 2500,
      });

      // Quick probe
      await testPool.query('SELECT 1');
      pool = testPool;
      activeEngine = 'POSTGRES_REMOTE';
      console.log(`[CyberMesh DB] Connected successfully to PostgreSQL server at ${dbUrl.replace(/:[^:]*@/, ':****@')}`);
      return;
    } catch (err) {
      console.warn(`[CyberMesh DB] Could not connect to external PostgreSQL server (${err.message}).`);
      console.log(`[CyberMesh DB] Initializing embedded WebAssembly PostgreSQL engine (PGlite) for seamless local execution...`);
    }
  }

  // Embedded PostgreSQL engine fallback
  try {
    const { PGlite } = require('@electric-sql/pglite');
    const dataDir = path.join(__dirname, '..', '..', 'data', 'pglite');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    pgliteInstance = new PGlite(dataDir);
    await pgliteInstance.waitReady;
    activeEngine = 'PGLITE_EMBEDDED';
    console.log(`[CyberMesh DB] Embedded PostgreSQL engine (PGlite) initialized successfully at: ${dataDir}`);
  } catch (embeddedErr) {
    console.error(`[CyberMesh DB] Fatal: Failed to initialize embedded database:`, embeddedErr);
    throw embeddedErr;
  }
}

/**
 * Execute raw multi-statement SQL script (DDL, migrations, seed batches)
 * @param {string} sqlText 
 */
async function exec(sqlText) {
  if (!pool && !pgliteInstance) {
    await initDatabase();
  }

  if (activeEngine === 'POSTGRES_REMOTE') {
    return await pool.query(sqlText);
  } else {
    // PGlite multi-statement script execution uses .exec()
    return await pgliteInstance.exec(sqlText);
  }
}

/**
 * Unified parameterized query interface
 * @param {string} text - SQL query text with $1, $2 parameters
 * @param {Array} params - Parameter array
 * @returns {Promise<{ rows: Array, rowCount: number }>}
 */
async function query(text, params = []) {
  if (!pool && !pgliteInstance) {
    await initDatabase();
  }

  try {
    if (activeEngine === 'POSTGRES_REMOTE') {
      const res = await pool.query(text, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0),
        fields: res.fields
      };
    } else {
      // PGlite interface
      const res = await pgliteInstance.query(text, params);
      return {
        rows: res.rows || [],
        rowCount: res.affectedRows ?? (res.rows ? res.rows.length : 0),
        fields: res.fields
      };
    }
  } catch (error) {
    console.error(`[CyberMesh DB Error] Query failed:`, {
      query: text.trim().substring(0, 120),
      params,
      message: error.message
    });
    throw error;
  }
}

/**
 * Transaction helper executing callback within a transactional context
 */
async function withTransaction(callback) {
  if (!pool && !pgliteInstance) {
    await initDatabase();
  }

  if (activeEngine === 'POSTGRES_REMOTE') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    // PGlite transaction
    return await pgliteInstance.transaction(async (tx) => {
      return await callback(tx);
    });
  }
}

function getActiveEngine() {
  return activeEngine;
}

module.exports = {
  initDatabase,
  exec,
  query,
  withTransaction,
  getActiveEngine
};
