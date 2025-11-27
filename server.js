const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();

// ✅ Correct CORS (single clean version)
app.use(cors({
  origin: "https://mittalananya.github.io",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Body parser
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: '🚀 Placement Portal Backend is Running!' });
});

// ========== STUDENT ROUTES ==========

// Student Signup
app.post('/api/student/signup', async (req, res) => {
    const { roll_number, full_name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO students (roll_number, full_name, email, password) VALUES (?, ?, ?, ?)';

        db.query(query, [roll_number, full_name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Roll number or email already exists' });
                }
                return res.status(500).json({ error: 'Signup failed' });
            }
            res.status(201).json({ message: 'Student registered successfully', studentId: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Student Login
app.post('/api/student/login', (req, res) => {
    const { roll_number, password } = req.body;

    const query = 'SELECT * FROM students WHERE roll_number = ?';

    db.query(query, [roll_number], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Login failed' });

        if (results.length === 0)
            return res.status(401).json({ error: 'Invalid roll number or password' });

        const student = results[0];
        const isPasswordValid = await bcrypt.compare(password, student.password);

        if (!isPasswordValid)
            return res.status(401).json({ error: 'Invalid roll number or password' });

        const token = jwt.sign(
            { id: student.id, roll_number: student.roll_number, type: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            student: {
                id: student.id,
                roll_number: student.roll_number,
                full_name: student.full_name,
                email: student.email
            }
        });
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
