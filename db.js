// FILE: db.js (RECOMMENDED APPROACH)
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL pool connection using single DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Render PostgreSQL
  },
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Event listeners
pool.on('connect', () => {
  console.log('✅ New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Test initial connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
  } else {
    console.log('✅ Connected to PostgreSQL Database');
    console.log(`📅 Database time: ${res.rows[0].now}`);
  }
});

module.exports = pool;
