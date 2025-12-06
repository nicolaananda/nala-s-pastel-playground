import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || '119.28.114.89',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nala',
  user: process.env.DB_USER || 'bot_wa',
  password: process.env.DB_PASSWORD || 'bot_wa',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database schema
export const initDatabase = async () => {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grasp_guide_access (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        order_id VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        customer_first_name VARCHAR(255),
        customer_last_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) DEFAULT 'webhook',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_order_id ON grasp_guide_access(order_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_id ON grasp_guide_access(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_code ON grasp_guide_access(code);
    `);

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Database operations
export const db = {
  // Save access code
  async saveAccessCode({ transactionId, orderId, code, customer, source = 'webhook' }) {
    const query = `
      INSERT INTO grasp_guide_access (
        transaction_id, order_id, code,
        customer_first_name, customer_last_name, customer_email, customer_phone,
        source, saved_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (transaction_id)
      DO UPDATE SET
        code = EXCLUDED.code,
        order_id = EXCLUDED.order_id,
        customer_first_name = EXCLUDED.customer_first_name,
        customer_last_name = EXCLUDED.customer_last_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      transactionId,
      orderId,
      code,
      customer?.firstName || null,
      customer?.lastName || null,
      customer?.email || null,
      customer?.phone || null,
      source,
      new Date().toISOString(),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find code by code value
  async findCodeByCode(code) {
    const query = `
      SELECT * FROM grasp_guide_access
      WHERE UPPER(TRIM(code)) = UPPER(TRIM($1))
      LIMIT 1
    `;
    const result = await pool.query(query, [code]);
    return result.rows[0] || null;
  },

  // Find code by order ID
  async findCodeByOrderId(orderId) {
    const query = `
      SELECT * FROM grasp_guide_access
      WHERE order_id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [orderId]);
    return result.rows[0] || null;
  },

  // Find code by transaction ID
  async findCodeByTransactionId(transactionId) {
    const query = `
      SELECT * FROM grasp_guide_access
      WHERE transaction_id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [transactionId]);
    return result.rows[0] || null;
  },

  // Get all access codes (for admin/migration purposes)
  async getAllAccessCodes() {
    const query = `
      SELECT * FROM grasp_guide_access
      ORDER BY saved_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Convert database row to JSON format (for backward compatibility)
  rowToJson(row) {
    if (!row) return null;
    return {
      transactionId: row.transaction_id,
      orderId: row.order_id,
      code: row.code,
      customer: {
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        email: row.customer_email,
        phone: row.customer_phone,
      },
      savedAt: row.saved_at?.toISOString() || row.saved_at,
      source: row.source,
    };
  },
};

export default pool;

