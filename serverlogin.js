const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',    // or process.env.DB_HOST
  user: 'root',         // your MySQL username
  password: '',         // your MySQL password
  database: 'recruitify' // your database name
});

db.connect(err => {
  if (err) throw err;
  console.log('✅ MySQL Connected...');
});

// ✅ Ensure table exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255)
)
`;
db.query(createTableQuery, err => {
  if (err) console.log('❌ Error creating table:', err);
  else console.log('✅ Table ready');
});

// --- SIGNUP API ---
app.post('/signup', async (req, res) => {
  const { roll_number, full_name, email, password } = req.body;

  // ✅ Check if user already exists
  const checkQuery = 'SELECT * FROM students WHERE roll_number = ?';
  db.query(checkQuery, [roll_number], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    if (results.length > 0) {
      return res.json({ success: false, message: 'Roll Number already exists' });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new student
    const insertQuery = 'INSERT INTO students (roll_number, full_name, email, password) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [roll_number, full_name, email, hashedPassword], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Error creating account' });
      res.json({ success: true, message: 'Account created successfully!' });
    });
  });
});

// --- LOGIN API ---
app.post('/login', (req, res) => {
  const { roll_number, password } = req.body;

  const sql = 'SELECT * FROM students WHERE roll_number = ?';
  db.query(sql, [roll_number], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    if (results.length === 0) return res.json({ success: false, message: '❌ No user found' });

    const isMatch = await bcrypt.compare(password, results[0].password);
    if (!isMatch) return res.json({ success: false, message: '❌ Wrong password' });

    res.json({ success: true, message: '✅ Login successful!' });
  });
});

// ✅ Start server
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
