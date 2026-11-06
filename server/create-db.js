import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing database configuration: ${missing.join(', ')}`);

// Connect to default postgres database to create the target database
const createDatabase = async () => {
  const adminClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    const dbName = process.env.DB_NAME;
    
    // Check if database exists
    const checkQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const result = await adminClient.query(checkQuery, [dbName]);

    if (result.rows.length > 0) {
      console.log(`ℹ️  Database "${dbName}" already exists`);
    } else {
      // Create database
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully`);
    }

    await adminClient.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    
    // If database already exists, that's okay
    if (error.code === '42P04') {
      console.log(`ℹ️  Database "${process.env.DB_NAME}" already exists`);
      process.exit(0);
    } else {
      console.error(error);
      process.exit(1);
    }
  }
};

createDatabase();

