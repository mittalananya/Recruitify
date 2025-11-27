
const { Pool } = require('pg');

require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.dpg-d4ka22vgi27c73ckdmcg-a,
    user: process.env.recruitify_db_user,
    password: process.env.kQ7b86pOTnEYCw0rr0FyFKvzEjtHK4vv,
    database: process.env.recruitify_db,
    port: process.env.DB_PORT || 5432
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database');
});

module.exports = connection;
