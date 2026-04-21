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

// ============ SETUP ROUTE ============
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        roll_number VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(15),
        dob DATE,
        address TEXT,
        college VARCHAR(100),
        branch VARCHAR(100),
        cgpa DECIMAL(3,2),
        year_of_study VARCHAR(20),
        tagline VARCHAR(200),
        linkedin VARCHAR(200),
        github VARCHAR(200),
        sgpa TEXT,
        profile_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recruiters (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        gst_number VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        roll_number VARCHAR(20) REFERENCES students(roll_number) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        project_title VARCHAR(100),
        project_description TEXT,
        project_link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        recruiter_id INT REFERENCES recruiters(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        company VARCHAR(100) NOT NULL,
        location VARCHAR(100),
        description TEXT,
        requirements TEXT,
        salary VARCHAR(50),
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        roll_number VARCHAR(20) REFERENCES students(roll_number) ON DELETE CASCADE,
        job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(roll_number, job_id)
      )
    `);
    res.json({ message: '✅ All tables created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ STUDENT ROUTES ============

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
