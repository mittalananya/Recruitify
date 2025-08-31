const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});
db.connect(err => {
    if (err) throw err;
    console.log('✅ MySQL Connected...');
});

// --- SIGNUP API ---
app.post('/signup', async (req, res) => {
    const { roll_number, full_name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO students (roll_number, full_name, email, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [roll_number, full_name, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).send("Error: " + err);
        res.send("✅ Account created successfully!");
    });
});

// --- LOGIN API ---
app.post('/login', (req, res) => {
    const { roll_number, password } = req.body;

    const sql = "SELECT * FROM students WHERE roll_number = ?";
    db.query(sql, [roll_number], async (err, results) => {
        if (err) return res.status(500).send("Error: " + err);
        if (results.length === 0) return res.status(400).send("❌ No user found");

        const isMatch = await bcrypt.compare(password, results[0].password);
        if (!isMatch) return res.status(400).send("❌ Wrong password");

        res.send("✅ Login successful!");
    });
});

// Run server
app.listen(5500, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
