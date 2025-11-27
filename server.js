const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');   // PostgreSQL connection file
require('dotenv').config();

const app = express();

// Correct CORS
app.use(cors({
  origin: "https://mittalananya.github.io",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🚀 Placement Portal Backend is Running!' });
});


// ===================================
//       STUDENT ROUTES
// ===================================

// ⭐ Student Signup (PostgreSQL)
app.post('/api/student/signup', async (req, res) => {
  const { roll_number, full_name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO students (roll_number, full_name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    pool.query(query, [roll_number, full_name, email, hashedPassword], (err, result) => {
      if (err) {
        console.log(err);

        // PostgreSQL duplicate entry code = 23505
        if (err.code === '23505') {
          return res.status(400).json({ error: 'Roll number or email already exists' });
        }

        return res.status(500).json({ error: 'Signup failed' });
      }

      res.status(201).json({
        message: 'Student registered successfully',
        studentId: result.rows[0].id
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ⭐ Student Login (PostgreSQL)
app.post('/api/student/login', (req, res) => {
  const { roll_number, password } = req.body;

  const query = 'SELECT * FROM students WHERE roll_number = $1';

  pool.query(query, [roll_number], async (err, result) => {
    if (err) return res.status(500).json({ error: 'Login failed' });

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid roll number or password' });

    const student = result.rows[0];

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
