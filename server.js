const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ============ TEST ROUTE ============
app.get('/', (req, res) => {
  res.json({ message: '🚀 Recruitify Backend is Live!' });
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============ STUDENT ROUTES ============

// Student Signup
app.post('/api/student/signup', async (req, res) => {
  const { roll_number, full_name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO students (roll_number, full_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, roll_number, full_name, email',
      [roll_number, full_name, email, hashedPassword]
    );
    res.status(201).json({ message: 'Student registered successfully', student: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Roll number or email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Student Login
app.post('/api/student/login', async (req, res) => {
  const { roll_number, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM students WHERE roll_number = $1', [roll_number]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid roll number or password' });

    const student = result.rows[0];
    const isValid = await bcrypt.compare(password, student.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid roll number or password' });

    const token = jwt.sign(
      { id: student.id, roll_number: student.roll_number, type: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    delete student.password;
    res.json({ message: 'Login successful', token, student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Student Profile
app.get('/api/student/profile/:roll_number', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE roll_number = $1', [req.params.roll_number]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const student = result.rows[0];
    delete student.password;
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Student Profile
app.put('/api/student/profile/:roll_number', async (req, res) => {
  const { roll_number } = req.params;
  const { full_name, email, phone, dob, address, college, branch, cgpa, year_of_study, tagline, linkedin, github, sgpa } = req.body;
  try {
    const sgpaJson = sgpa ? JSON.stringify(sgpa) : null;
    const result = await pool.query(
      `UPDATE students SET 
        full_name=COALESCE($1,full_name), email=COALESCE($2,email),
        phone=$3, dob=$4, address=$5, college=$6, branch=$7,
        cgpa=$8, year_of_study=$9, tagline=$10, linkedin=$11,
        github=$12, sgpa=$13, profile_completed=true, updated_at=CURRENT_TIMESTAMP
       WHERE roll_number=$14 RETURNING *`,
      [full_name, email, phone, dob, address, college, branch, cgpa, year_of_study, tagline, linkedin, github, sgpaJson, roll_number]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const student = result.rows[0];
    delete student.password;
    res.json({ message: 'Profile updated successfully', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ RECRUITER ROUTES ============

// Recruiter Signup
app.post('/api/recruiter/signup', async (req, res) => {
  const { companyName, gstNumber, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO recruiters (company_name, gst_number, email, password) VALUES ($1, $2, $3, $4) RETURNING id, company_name, gst_number, email',
      [companyName, gstNumber, email, hashedPassword]
    );
    const recruiter = result.rows[0];
    const token = jwt.sign(
      { id: recruiter.id, email: recruiter.email, type: 'recruiter' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ message: 'Recruiter registered successfully', token, recruiter });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'GST number or email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Recruiter Login
app.post('/api/recruiter/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM recruiters WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const recruiter = result.rows[0];
    const isValid = await bcrypt.compare(password, recruiter.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: recruiter.id, email: recruiter.email, type: 'recruiter' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    delete recruiter.password;
    res.json({ message: 'Login successful', token, recruiter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Recruiter Profile
app.get('/api/recruiter/dashboard/:email', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recruiters WHERE email = $1', [req.params.email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Recruiter not found' });
    const recruiter = result.rows[0];
    delete recruiter.password;
    res.json({ recruiter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;