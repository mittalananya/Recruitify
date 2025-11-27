const { Pool } = require('pg');
require('dotenv').config();

// Correct PostgreSQL pool connection
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }  // Render requires SSL
});

// Test connection
pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL Database'))
    .catch(err => console.error('❌ PostgreSQL Connection Error:', err));

module.exports = pool;
